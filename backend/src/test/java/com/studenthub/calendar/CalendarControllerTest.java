package com.studenthub.calendar;

import com.jayway.jsonpath.JsonPath;
import com.studenthub.ApiTest;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.assertj.MvcTestResult;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class CalendarControllerTest extends ApiTest {

    @Test
    void calendarContainsEventsFromJoinedCoursesOnly() {
        TestUser student = registerUser();
        String joinedCode = uniqueCode();
        String joinedCourse = createCourse(student, joinedCode);
        TestUser stranger = registerUser();
        String otherCourse = createCourse(stranger, uniqueCode());
        addExam(student, joinedCourse, "2026-12-01T09:00:00Z");
        addExam(stranger, otherCourse, "2026-12-02T09:00:00Z");

        MvcTestResult result = get(student, "/api/calendar?from=2026-11-30T00:00:00Z&to=2026-12-07T00:00:00Z");

        assertThat(result).hasStatus(HttpStatus.OK);
        List<String> codes = JsonPath.read(body(result), "$[*].course.code");
        assertThat(codes).containsExactly(joinedCode);
    }

    @Test
    void calendarRejectsInvalidRanges() {
        TestUser student = registerUser();

        assertThat(get(student, "/api/calendar?from=2026-12-07T00:00:00Z&to=2026-12-01T00:00:00Z"))
                .hasStatus(HttpStatus.BAD_REQUEST);
        assertThat(get(student, "/api/calendar?from=2026-01-01T00:00:00Z&to=2028-01-01T00:00:00Z"))
                .hasStatus(HttpStatus.BAD_REQUEST);
    }

    @Test
    void icsFeedIsPublicWithItsTokenAndCanBeReset() {
        TestUser student = registerUser();
        String code = uniqueCode();
        String courseId = createCourse(student, code);
        addExam(student, courseId, Instant.now().plus(7, ChronoUnit.DAYS).truncatedTo(ChronoUnit.HOURS).toString());

        String path = JsonPath.read(body(get(student, "/api/calendar/feed")), "$.path");
        assertThat(JsonPath.<String>read(body(get(student, "/api/calendar/feed")), "$.path")).isEqualTo(path);

        MvcTestResult feed = mvc.get().uri(path).exchange();
        assertThat(feed).hasStatus(HttpStatus.OK);
        assertThat(feed).hasContentTypeCompatibleWith(MediaType.parseMediaType("text/calendar"));
        assertThat(body(feed)).startsWith("BEGIN:VCALENDAR\r\n").contains("SUMMARY:" + code + ": Final exam");

        String newPath = JsonPath.read(body(post(student, "/api/calendar/feed/reset", "")), "$.path");
        assertThat(newPath).isNotEqualTo(path);
        assertThat(mvc.get().uri(path).exchange()).hasStatus(HttpStatus.NOT_FOUND);
        assertThat(mvc.get().uri(newPath).exchange()).hasStatus(HttpStatus.OK);
    }

    private void addExam(TestUser user, String courseId, String startsAt) {
        assertThat(post(user, "/api/courses/" + courseId + "/events", """
                {"type": "EXAM", "title": "Final exam", "startsAt": "%s", "endsAt": "%s"}
                """.formatted(startsAt, startsAt))).hasStatus(HttpStatus.CREATED);
    }
}
