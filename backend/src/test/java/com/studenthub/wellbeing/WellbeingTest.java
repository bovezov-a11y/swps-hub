package com.studenthub.wellbeing;

import com.jayway.jsonpath.JsonPath;
import com.studenthub.ApiTest;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.test.web.servlet.assertj.MvcTestResult;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class WellbeingTest extends ApiTest {

    @Test
    void threeAssessmentsWithinAWeekAreFlaggedAsACrunch() {
        TestUser student = registerUser();
        String courseId = createCourse(student, uniqueCode());
        Instant base = Instant.now().plus(20, ChronoUnit.DAYS).truncatedTo(ChronoUnit.HOURS);
        addAssessment(student, courseId, "EXAM", "Midterm", base);
        addAssessment(student, courseId, "DEADLINE", "Essay", base.plus(2, ChronoUnit.DAYS));
        addAssessment(student, courseId, "EXAM", "Lab exam", base.plus(4, ChronoUnit.DAYS));

        MvcTestResult workload = get(student, "/api/me/workload?weeks=8");

        assertThat(workload).hasStatus(HttpStatus.OK);
        assertThat(workload).bodyJson().extractingPath("$.days").asArray().hasSize(56);
        List<String> crunchTitles = JsonPath.read(body(workload), "$.crunches[0].assessments[*].title");
        assertThat(crunchTitles).containsExactly("Midterm", "Essay", "Lab exam");
    }

    @Test
    void aStudyPlanAddsSpacedSessionsToThePersonalCalendarOnly() {
        TestUser student = registerUser();
        TestUser classmate = registerUser();
        String courseId = createCourse(student, uniqueCode());
        put(classmate, "/api/courses/" + courseId + "/enrollment");
        Instant examAt = Instant.now().plus(10, ChronoUnit.DAYS).truncatedTo(ChronoUnit.HOURS);
        String examId = addAssessment(student, courseId, "EXAM", "Final", examAt);

        MvcTestResult plan = post(student, "/api/me/study-plans", """
                {"examEventId": "%s"}
                """.formatted(examId));

        assertThat(plan).hasStatus(HttpStatus.CREATED);
        assertThat(plan).bodyJson().extractingPath("$").asArray().hasSize(4);
        assertThat(post(student, "/api/me/study-plans", """
                {"examEventId": "%s"}
                """.formatted(examId))).hasStatus(HttpStatus.CONFLICT);

        String range = "?from=" + Instant.now() + "&to=" + examAt.plus(1, ChronoUnit.DAYS);
        List<String> mine = JsonPath.read(body(get(student, "/api/calendar" + range)), "$[*].type");
        List<String> theirs = JsonPath.read(body(get(classmate, "/api/calendar" + range)), "$[*].type");
        assertThat(mine).filteredOn("STUDY"::equals).hasSize(4);
        assertThat(theirs).doesNotContain("STUDY");

        String sessionId = JsonPath.read(body(plan), "$[0].id");
        assertThat(delete(classmate, "/api/me/study-sessions/" + sessionId)).hasStatus(HttpStatus.NOT_FOUND);
        assertThat(delete(student, "/api/me/study-sessions/" + sessionId)).hasStatus(HttpStatus.NO_CONTENT);
    }

    @Test
    void plansNeedAnExamInACourseTheStudentJoined() {
        TestUser owner = registerUser();
        String courseId = createCourse(owner, uniqueCode());
        String examId = addAssessment(owner, courseId, "EXAM", "Final",
                Instant.now().plus(10, ChronoUnit.DAYS));

        assertThat(post(registerUser(), "/api/me/study-plans", """
                {"examEventId": "%s"}
                """.formatted(examId))).hasStatus(HttpStatus.FORBIDDEN);
    }

    private String addAssessment(TestUser user, String courseId, String type, String title, Instant at) {
        MvcTestResult result = post(user, "/api/courses/" + courseId + "/events", """
                {"type": "%s", "title": "%s", "startsAt": "%s", "endsAt": "%s"}
                """.formatted(type, title, at, at));
        return JsonPath.read(body(result), "$[0].id");
    }
}
