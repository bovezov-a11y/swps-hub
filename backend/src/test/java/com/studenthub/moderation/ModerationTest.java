package com.studenthub.moderation;

import com.jayway.jsonpath.JsonPath;
import com.studenthub.ApiTest;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.assertj.MvcTestResult;

import java.nio.charset.StandardCharsets;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class ModerationTest extends ApiTest {

    @Test
    void contentReportedByThreeStudentsIsHiddenUntilReviewed() {
        TestUser uploader = registerUser();
        String courseId = createCourse(uploader, uniqueCode());
        String materialId = upload(uploader, courseId);
        TestUser bystander = registerUser();

        for (int i = 0; i < 3; i++) {
            assertThat(report(registerUser(), "MATERIAL", materialId)).hasStatus(HttpStatus.CREATED);
        }

        assertThat(ids(get(bystander, "/api/courses/" + courseId + "/materials"))).doesNotContain(materialId);
        MvcTestResult ownView = get(uploader, "/api/courses/" + courseId + "/materials");
        assertThat(ids(ownView)).contains(materialId);
        assertThat(ownView).bodyJson().extractingPath("$[0].hidden").isEqualTo(true);
        assertThat(get(bystander, "/api/materials/" + materialId + "/file")).hasStatus(HttpStatus.NOT_FOUND);
    }

    @Test
    void studentsCanReportOnlyOnceAndCannotOpenTheQueue() {
        TestUser student = registerUser();
        String materialId = upload(student, createCourse(student, uniqueCode()));

        assertThat(report(student, "MATERIAL", materialId)).hasStatus(HttpStatus.CREATED);
        assertThat(report(student, "MATERIAL", materialId)).hasStatus(HttpStatus.CONFLICT);
        assertThat(get(student, "/api/moderation/queue")).hasStatus(HttpStatus.FORBIDDEN);
        assertThat(get(student, "/api/insights")).hasStatus(HttpStatus.FORBIDDEN);
    }

    @Test
    void moderatorsSeeReasonsButNeverReporters() {
        TestUser uploader = registerUser();
        String materialId = upload(uploader, createCourse(uploader, uniqueCode()));
        TestUser reporter = registerUser();
        post(reporter, "/api/reports", """
                {"targetType": "MATERIAL", "targetId": "%s", "reason": "COPYRIGHT", "details": "Scanned textbook"}
                """.formatted(materialId));

        MvcTestResult queue = get(moderator(), "/api/moderation/queue");

        assertThat(queue).hasStatus(HttpStatus.OK);
        List<String> queuedIds = JsonPath.read(body(queue), "$[*].id");
        assertThat(queuedIds).contains(materialId);
        assertThat(body(queue)).contains("Scanned textbook", "COPYRIGHT").doesNotContain(reporter.id(), reporter.email());
    }

    @Test
    void moderatorsCanRestoreOrDeleteAndEveryActionIsLogged() {
        TestUser uploader = registerUser();
        String courseId = createCourse(uploader, uniqueCode());
        String restored = upload(uploader, courseId);
        String removed = upload(uploader, courseId);
        TestUser moderator = moderator();

        assertThat(post(moderator, "/api/moderation/MATERIAL/" + restored + "/hide", "")).hasStatus(HttpStatus.NO_CONTENT);
        assertThat(post(moderator, "/api/moderation/MATERIAL/" + restored + "/restore", ""))
                .hasStatus(HttpStatus.NO_CONTENT);
        assertThat(delete(moderator, "/api/moderation/MATERIAL/" + removed)).hasStatus(HttpStatus.NO_CONTENT);

        assertThat(ids(get(registerUser(), "/api/courses/" + courseId + "/materials")))
                .contains(restored).doesNotContain(removed);
        List<String> actions = JsonPath.read(body(get(moderator, "/api/moderation/log")), "$[*].action");
        assertThat(actions).contains("HIDE", "RESTORE", "DELETE");
    }

    @Test
    void adminsAppointModeratorsAndSeeOnlyAggregateInsights() {
        TestUser admin = admin();
        TestUser future = registerUser();

        assertThat(post(admin, "/api/admin/moderators", """
                {"email": "%s"}
                """.formatted(future.email()))).hasStatus(HttpStatus.CREATED);
        assertThat(get(login(future), "/api/moderation/queue")).hasStatus(HttpStatus.OK);
        assertThat(get(login(future), "/api/insights")).hasStatus(HttpStatus.FORBIDDEN);

        MvcTestResult insights = get(admin, "/api/insights");
        assertThat(insights).hasStatus(HttpStatus.OK);
        assertThat(insights).bodyJson().extractingPath("$.minGroupSize").isEqualTo(5);
        assertThat(insights).bodyJson().extractingPath("$.assessmentHeatmap.weeks").asArray().hasSize(12);
        assertThat(body(insights)).doesNotContain(future.email(), "@st.swps.edu.pl");
    }

    private MvcTestResult report(TestUser user, String type, String id) {
        return post(user, "/api/reports", """
                {"targetType": "%s", "targetId": "%s", "reason": "INAPPROPRIATE"}
                """.formatted(type, id));
    }

    private String upload(TestUser user, String courseId) {
        MvcTestResult result = mvc.post().uri("/api/courses/" + courseId + "/materials").multipart()
                .file(new MockMultipartFile("file", "notes.pdf", "application/pdf",
                        "%PDF-1.7".getBytes(StandardCharsets.UTF_8)))
                .param("type", "NOTES").param("title", "Notes").param("academicYear", "2025/26")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + user.token())
                .exchange();
        return JsonPath.read(body(result), "$.id");
    }

    private static List<String> ids(MvcTestResult result) {
        return JsonPath.read(body(result), "$[*].id");
    }
}
