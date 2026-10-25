package com.studenthub.calendar;


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

    static String write(String calendarName, List<CalendarDtos.CalendarEvent> events, Instant generatedAt) {
        List<String> lines = new ArrayList<>();
        lines.add("BEGIN:VCALENDAR");
        lines.add("VERSION:2.0");
        lines.add("PRODID:-//Student Hub//Calendar//EN");
        lines.add("CALSCALE:GREGORIAN");
        lines.add("METHOD:PUBLISH");
        lines.add("X-WR-CALNAME:" + escape(calendarName));
        lines.add("REFRESH-INTERVAL;VALUE=DURATION:PT6H");
        lines.add("X-PUBLISHED-TTL:PT6H");
        for (CalendarDtos.CalendarEvent event : events) {
            lines.add("BEGIN:VEVENT");
            lines.add("UID:" + event.id() + "@student-hub");
            lines.add("DTSTAMP:" + UTC_TIMESTAMP.format(generatedAt));
            lines.add("DTSTART:" + UTC_TIMESTAMP.format(event.startsAt()));
            lines.add("DTEND:" + UTC_TIMESTAMP.format(event.endsAt()));
            lines.add("SUMMARY:" + escape("%s: %s".formatted(event.course().code(), event.title())));
            lines.add("DESCRIPTION:" + escape("%s · %s".formatted(event.type().label(), event.course().name())));
            lines.add("CATEGORIES:" + event.type().name());
            if (event.location() != null) {
                lines.add("LOCATION:" + escape(event.location()));
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
