package com.studenthub.calendar;

import com.studenthub.event.EventType;

import java.time.Instant;
import java.util.UUID;

final class CalendarDtos {

    private CalendarDtos() {
    }

    record CalendarEvent(UUID id, EventType type, String title, Instant startsAt, Instant endsAt, String location,
                         CourseRef course) {
    }

    record CourseRef(UUID id, String code, String name) {
    }

    /** Path of the private iCalendar feed, relative to the site origin. */
    record FeedResponse(String path) {
    }
}
