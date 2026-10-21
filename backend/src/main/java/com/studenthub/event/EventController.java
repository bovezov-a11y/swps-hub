package com.studenthub.event;

import com.studenthub.auth.CurrentUser;
import com.studenthub.event.EventDtos.EventRequest;
import com.studenthub.event.EventDtos.EventResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@RestController
class EventController {

    private final EventService eventService;

    EventController(EventService eventService) {
        this.eventService = eventService;
    }

    @GetMapping("/api/courses/{courseId}/events")
    List<EventResponse> list(CurrentUser user, @PathVariable UUID courseId,
                             @RequestParam(required = false) Instant from,
                             @RequestParam(required = false) Instant to) {
        return eventService.listForCourse(user, courseId, from, to);
    }

    /** Creates the event, or one per week when {@code repeatWeeks} is set, and returns everything created. */
    @PostMapping("/api/courses/{courseId}/events")
    @ResponseStatus(HttpStatus.CREATED)
    List<EventResponse> create(CurrentUser user, @PathVariable UUID courseId, @Valid @RequestBody EventRequest request) {
        return eventService.create(user, courseId, request);
    }

    @DeleteMapping("/api/events/{eventId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void delete(CurrentUser user, @PathVariable UUID eventId) {
        eventService.delete(user, eventId);
    }
}
