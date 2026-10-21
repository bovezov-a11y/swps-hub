package com.studenthub.calendar;

import com.studenthub.auth.CurrentUser;
import com.studenthub.calendar.CalendarDtos.CalendarEvent;
import com.studenthub.calendar.CalendarDtos.FeedResponse;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/calendar")
class CalendarController {

    private static final MediaType TEXT_CALENDAR = MediaType.parseMediaType("text/calendar;charset=UTF-8");

    private final CalendarService calendarService;

    CalendarController(CalendarService calendarService) {
        this.calendarService = calendarService;
    }

    /** Events from all joined courses that overlap {@code [from, to)}. */
    @GetMapping
    List<CalendarEvent> events(CurrentUser user, @RequestParam Instant from, @RequestParam Instant to) {
        return calendarService.events(user, from, to);
    }

    @GetMapping("/feed")
    FeedResponse feed(CurrentUser user) {
        return calendarService.feed(user);
    }

    @PostMapping("/feed/reset")
    FeedResponse resetFeed(CurrentUser user) {
        return calendarService.resetFeed(user);
    }

    /** Public iCalendar feed; calendar apps cannot send a bearer token, so the secret token in the URL authorises it. */
    @GetMapping("/feeds/{token}.ics")
    ResponseEntity<String> ics(@PathVariable String token) {
        return ResponseEntity.ok()
                .contentType(TEXT_CALENDAR)
                .cacheControl(CacheControl.noCache())
                .body(calendarService.ics(token));
    }
}
