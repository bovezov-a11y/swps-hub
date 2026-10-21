package com.studenthub.calendar;

import com.studenthub.auth.CurrentUser;
import com.studenthub.calendar.CalendarDtos.CalendarEvent;
import com.studenthub.calendar.CalendarDtos.CourseRef;
import com.studenthub.calendar.CalendarDtos.FeedResponse;
import com.studenthub.common.InvalidRequestException;
import com.studenthub.common.NotFoundException;
import com.studenthub.event.CourseEventRepository;
import com.studenthub.user.User;
import com.studenthub.user.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.List;

@Service
class CalendarService {

    private static final Duration MAX_RANGE = Duration.ofDays(366);
    private static final Duration FEED_LOOK_BACK = Duration.ofDays(90);
    private static final Duration FEED_LOOK_AHEAD = Duration.ofDays(365);
    private static final SecureRandom RANDOM = new SecureRandom();

    private final CourseEventRepository events;
    private final UserRepository users;

    CalendarService(CourseEventRepository events, UserRepository users) {
        this.events = events;
        this.users = users;
    }

    @Transactional(readOnly = true)
    List<CalendarEvent> events(CurrentUser user, Instant from, Instant to) {
        if (!to.isAfter(from)) {
            throw new InvalidRequestException("to", "must be after from");
        }
        if (Duration.between(from, to).compareTo(MAX_RANGE) > 0) {
            throw new InvalidRequestException("to", "range can be at most 366 days");
        }
        return events.findForUser(user.id(), from, to).stream()
                .map(event -> new CalendarEvent(event.getId(), event.getType(), event.getTitle(), event.getStartsAt(),
                        event.getEndsAt(), event.getLocation(), new CourseRef(event.getCourse().getId(),
                        event.getCourse().getCode(), event.getCourse().getName())))
                .toList();
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
        return IcsWriter.write("Student Hub",
                events.findForUser(account.getId(), now.minus(FEED_LOOK_BACK), now.plus(FEED_LOOK_AHEAD)), now);
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
