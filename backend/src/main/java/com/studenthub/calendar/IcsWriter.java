package com.studenthub.calendar;

import com.studenthub.event.CourseEvent;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

/**
 * Writes events as an iCalendar (RFC 5545) document that Google, Apple and Outlook calendars can subscribe to.
 */
final class IcsWriter {

    private static final DateTimeFormatter UTC_TIMESTAMP =
            DateTimeFormatter.ofPattern("yyyyMMdd'T'HHmmss'Z'").withZone(ZoneOffset.UTC);
    private static final int MAX_LINE_OCTETS = 75;

    private IcsWriter() {
    }

    static String write(String calendarName, List<CourseEvent> events, Instant generatedAt) {
        List<String> lines = new ArrayList<>();
        lines.add("BEGIN:VCALENDAR");
        lines.add("VERSION:2.0");
        lines.add("PRODID:-//Student Hub//Calendar//EN");
        lines.add("CALSCALE:GREGORIAN");
        lines.add("METHOD:PUBLISH");
        lines.add("X-WR-CALNAME:" + escape(calendarName));
        lines.add("REFRESH-INTERVAL;VALUE=DURATION:PT6H");
        lines.add("X-PUBLISHED-TTL:PT6H");
        for (CourseEvent event : events) {
            lines.add("BEGIN:VEVENT");
            lines.add("UID:" + event.getId() + "@student-hub");
            lines.add("DTSTAMP:" + UTC_TIMESTAMP.format(generatedAt));
            lines.add("DTSTART:" + UTC_TIMESTAMP.format(event.getStartsAt()));
            lines.add("DTEND:" + UTC_TIMESTAMP.format(event.getEndsAt()));
            lines.add("SUMMARY:" + escape("%s: %s".formatted(event.getCourse().getCode(), event.getTitle())));
            lines.add("DESCRIPTION:" + escape("%s · %s".formatted(event.getType().label(), event.getCourse().getName())));
            lines.add("CATEGORIES:" + event.getType().name());
            if (event.getLocation() != null) {
                lines.add("LOCATION:" + escape(event.getLocation()));
            }
            lines.add("END:VEVENT");
        }
        lines.add("END:VCALENDAR");

        StringBuilder out = new StringBuilder();
        for (String line : lines) {
            out.append(fold(line)).append("\r\n");
        }
        return out.toString();
    }

    static String escape(String value) {
        return value.replace("\\", "\\\\")
                .replace(";", "\\;")
                .replace(",", "\\,")
                .replace("\r\n", "\\n")
                .replace("\n", "\\n");
    }

    /** Splits a line into chunks of at most 75 octets; continuation lines start with a space. */
    static String fold(String line) {
        StringBuilder out = new StringBuilder();
        int lineOctets = 0;
        for (int i = 0; i < line.length(); ) {
            int codePoint = line.codePointAt(i);
            String character = Character.toString(codePoint);
            int octets = character.getBytes(StandardCharsets.UTF_8).length;
            if (lineOctets + octets > MAX_LINE_OCTETS) {
                out.append("\r\n ");
                lineOctets = 1;
            }
            out.append(character);
            lineOctets += octets;
            i += Character.charCount(codePoint);
        }
        return out.toString();
    }
}
