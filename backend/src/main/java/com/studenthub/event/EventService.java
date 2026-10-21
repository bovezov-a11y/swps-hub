package com.studenthub.event;

import com.studenthub.auth.CurrentUser;
import com.studenthub.common.ForbiddenException;
import com.studenthub.common.InvalidRequestException;
import com.studenthub.common.NotFoundException;
import com.studenthub.course.Course;
import com.studenthub.course.CourseService;
import com.studenthub.event.EventDtos.EventRequest;
import com.studenthub.event.EventDtos.EventResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
class EventService {

    private static final Duration DEFAULT_LOOK_BACK = Duration.ofDays(365);
    private static final Duration DEFAULT_LOOK_AHEAD = Duration.ofDays(730);

    private final CourseEventRepository events;
    private final CourseService courseService;
    private final ZoneId zone;

    EventService(CourseEventRepository events, CourseService courseService, @Value("${app.time-zone}") ZoneId zone) {
        this.events = events;
        this.courseService = courseService;
        this.zone = zone;
    }

    @Transactional(readOnly = true)
    List<EventResponse> listForCourse(CurrentUser user, UUID courseId, Instant from, Instant to) {
        Course course = courseService.require(courseId);
        Instant now = Instant.now();
        return events.findForCourse(courseId,
                        from != null ? from : now.minus(DEFAULT_LOOK_BACK),
                        to != null ? to : now.plus(DEFAULT_LOOK_AHEAD))
                .stream()
                .map(event -> toResponse(user, course, event))
                .toList();
    }

    @Transactional
    List<EventResponse> create(CurrentUser user, UUID courseId, EventRequest request) {
        Course course = courseService.require(courseId);
        if (!courseService.isEnrolled(user.id(), courseId) && !user.isModerator()) {
            throw new ForbiddenException("Join the course to add events to it");
        }
        if (request.endsAt().isBefore(request.startsAt())) {
            throw new InvalidRequestException("endsAt", "must not be before the start time");
        }

        String title = request.title().strip();
        String location = request.location() == null || request.location().isBlank() ? null : request.location().strip();
        int occurrences = request.repeatWeeks() == null ? 1 : request.repeatWeeks();
        List<CourseEvent> created = new ArrayList<>(occurrences);
        for (int week = 0; week < occurrences; week++) {
            // Weeks are added in the university's time zone so a 10:00 class stays at 10:00 across DST changes.
            created.add(new CourseEvent(course, request.type(), title,
                    request.startsAt().atZone(zone).plusWeeks(week).toInstant(),
                    request.endsAt().atZone(zone).plusWeeks(week).toInstant(),
                    location, user.id()));
        }
        return events.saveAll(created).stream().map(event -> toResponse(user, course, event)).toList();
    }

    @Transactional
    void delete(CurrentUser user, UUID eventId) {
        CourseEvent event = events.findById(eventId).orElseThrow(() -> new NotFoundException("Event not found"));
        if (!canDelete(user, event.getCourse(), event)) {
            throw new ForbiddenException("Only the event author, the course author or a moderator can delete this event");
        }
        events.delete(event);
    }

    private static EventResponse toResponse(CurrentUser user, Course course, CourseEvent event) {
        return new EventResponse(event.getId(), course.getId(), event.getType(), event.getTitle(),
                event.getStartsAt(), event.getEndsAt(), event.getLocation(), canDelete(user, course, event));
    }

    private static boolean canDelete(CurrentUser user, Course course, CourseEvent event) {
        return event.getCreatedBy().equals(user.id()) || course.getCreatedBy().equals(user.id()) || user.isModerator();
    }
}
