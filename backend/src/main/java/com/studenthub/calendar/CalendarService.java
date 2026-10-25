package com.studenthub.calendar;

import com.studenthub.auth.CurrentUser;
import com.studenthub.calendar.CalendarDtos.CalendarEvent;
import com.studenthub.calendar.CalendarDtos.CourseRef;
import com.studenthub.calendar.CalendarDtos.FeedResponse;
import com.studenthub.common.InvalidRequestException;
import com.studenthub.common.NotFoundException;
import com.studenthub.course.Course;
import com.studenthub.event.CourseEvent;
import com.studenthub.event.CourseEventRepository;
import com.studenthub.event.EventType;
import com.studenthub.wellbeing.StudySession;
import com.studenthub.wellbeing.StudySessionRepository;
import com.studenthub.user.User;
import com.studenthub.user.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Base64;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Service
class CalendarService {

    private static final Duration MAX_RANGE = Duration.ofDays(366);
    private static final Duration FEED_LOOK_BACK = Duration.ofDays(90);
    private static final Duration FEED_LOOK_AHEAD = Duration.ofDays(365);
    private static final SecureRandom RANDOM = new SecureRandom();

    private final CourseEventRepository events;
    private final UserRepository users;
    private final StudySessionRepository studySessions;

    CalendarService(CourseEventRepository events, UserRepository users, StudySessionRepository studySessions) {
        this.events = events;
        this.users = users;
        this.studySessions = studySessions;
    }

    @Transactional(readOnly = true)
    List<CalendarEvent> events(CurrentUser user, Instant from, Instant to) {
        if (!to.isAfter(from)) {
            throw new InvalidRequestException("to", "must be after from");
        }
        if (Duration.between(from, to).compareTo(MAX_RANGE) > 0) {
            throw new InvalidRequestException("to", "range can be at most 366 days");
        }
        return combined(user.id(), from, to);
    }

    /** Course events and the student's own study sessions, in time order. */
    private List<CalendarEvent> combined(UUID userId, Instant from, Instant to) {
        List<CalendarEvent> result = new ArrayList<>();
        for (CourseEvent event : events.findForUser(userId, from, to)) {
            result.add(new CalendarEvent(event.getId(), event.getType(), event.getTitle(), event.getStartsAt(),
                    event.getEndsAt(), event.getLocation(), courseRef(event.getCourse())));
        }
        for (StudySession session : studySessions.findForUser(userId, from, to)) {
            result.add(new CalendarEvent(session.getId(), EventType.STUDY, session.getTitle(), session.getStartsAt(),
                    session.getEndsAt(), null, courseRef(session.getCourse())));
        }
        result.sort(Comparator.comparing(CalendarEvent::startsAt));
        return result;
    }

    private static CourseRef courseRef(Course course) {
        return new CourseRef(course.getId(), course.getCode(), course.getName());
    }

    @Transactional
    FeedResponse feed(CurrentUser user) {
        User account = requireUser(user);
        if (account.getCalendarToken() == null) {
            account.setCalendarToken(newToken());
        }
        return toFeedResponse(account);
    }

    /** Replaces the feed token, so a leaked feed URL stops working. */
    @Transactional
    FeedResponse resetFeed(CurrentUser user) {
        User account = requireUser(user);
        account.setCalendarToken(newToken());
        return toFeedResponse(account);
    }

    @Transactional(readOnly = true)
    String ics(String token) {
        User account = users.findByCalendarToken(token)
                .orElseThrow(() -> new NotFoundException("Calendar feed not found"));
        Instant now = Instant.now();
        return IcsWriter.write("SWPS Hub",
                combined(account.getId(), now.minus(FEED_LOOK_BACK), now.plus(FEED_LOOK_AHEAD)), now);
    }

    private User requireUser(CurrentUser user) {
        return users.findById(user.id()).orElseThrow(() -> new NotFoundException("User not found"));
    }

    private static FeedResponse toFeedResponse(User account) {
        return new FeedResponse("/api/calendar/feeds/" + account.getCalendarToken() + ".ics");
    }

    private static String newToken() {
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
}
