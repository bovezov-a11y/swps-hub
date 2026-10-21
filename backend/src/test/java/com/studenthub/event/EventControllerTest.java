package com.studenthub.event;

import com.jayway.jsonpath.JsonPath;
import com.studenthub.ApiTest;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.test.web.servlet.assertj.MvcTestResult;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class EventControllerTest extends ApiTest {

    @Test
    void weeklyEventsKeepTheirLocalTimeAcrossDaylightSavingChange() {
        TestUser author = registerUser();
        String courseId = createCourse(author, uniqueCode());

        // 10:00 in Warsaw on 19 Oct (CEST, UTC+2); clocks go back on 25 Oct, so later weeks are 10:00 CET (UTC+1).
        MvcTestResult result = post(author, "/api/courses/" + courseId + "/events", """
                {"type": "LECTURE", "title": "Lecture", "startsAt": "2026-10-19T08:00:00Z",
                 "endsAt": "2026-10-19T09:30:00Z", "location": "Room 101", "repeatWeeks": 3}
                """);

        assertThat(result).hasStatus(HttpStatus.CREATED);
        List<String> starts = JsonPath.read(body(result), "$[*].startsAt");
        assertThat(starts).containsExactly("2026-10-19T08:00:00Z", "2026-10-26T09:00:00Z", "2026-11-02T09:00:00Z");
    }

    @Test
    void onlyMembersCanAddEvents() {
        String courseId = createCourse(registerUser(), uniqueCode());

        assertThat(post(registerUser(), "/api/courses/" + courseId + "/events", exam("2026-12-01T09:00:00Z")))
                .hasStatus(HttpStatus.FORBIDDEN);
    }

    @Test
    void eventCannotEndBeforeItStarts() {
        TestUser author = registerUser();
        String courseId = createCourse(author, uniqueCode());

        MvcTestResult result = post(author, "/api/courses/" + courseId + "/events", """
                {"type": "EXAM", "title": "Exam", "startsAt": "2026-12-01T10:00:00Z", "endsAt": "2026-12-01T09:00:00Z"}
                """);

        assertThat(result).hasStatus(HttpStatus.BAD_REQUEST);
        assertThat(result).bodyJson().extractingPath("$.errors.endsAt").isNotNull();
    }

    @Test
    void onlyTheEventAuthorOrCourseAuthorCanDeleteAnEvent() {
        TestUser courseAuthor = registerUser();
        TestUser eventAuthor = registerUser();
        TestUser otherMember = registerUser();
        String courseId = createCourse(courseAuthor, uniqueCode());
        put(eventAuthor, "/api/courses/" + courseId + "/enrollment");
        put(otherMember, "/api/courses/" + courseId + "/enrollment");
        String eventId = JsonPath.read(
                body(post(eventAuthor, "/api/courses/" + courseId + "/events", exam("2026-12-01T09:00:00Z"))), "$[0].id");

        assertThat(get(otherMember, "/api/courses/" + courseId + "/events"))
                .bodyJson().extractingPath("$[0].canDelete").isEqualTo(false);
        assertThat(delete(otherMember, "/api/events/" + eventId)).hasStatus(HttpStatus.FORBIDDEN);
        assertThat(delete(courseAuthor, "/api/events/" + eventId)).hasStatus(HttpStatus.NO_CONTENT);
        assertThat(get(otherMember, "/api/courses/" + courseId + "/events")).bodyJson().isEqualTo("[]");
    }

    static String exam(String startsAt) {
        return """
                {"type": "EXAM", "title": "Final exam", "startsAt": "%s", "endsAt": "%s"}
                """.formatted(startsAt, startsAt);
    }
}
