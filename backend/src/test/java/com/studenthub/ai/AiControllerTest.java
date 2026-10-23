package com.studenthub.ai;

import com.jayway.jsonpath.JsonPath;
import com.studenthub.ApiTest;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.assertj.MvcTestResult;

import java.nio.charset.StandardCharsets;

import static org.assertj.core.api.Assertions.assertThat;

class AiControllerTest extends ApiTest {

    @Test
    void statusShowsTheDailyAllowance() {
        MvcTestResult status = get(registerUser(), "/api/ai/status");

        assertThat(status).hasStatus(HttpStatus.OK);
        assertThat(status).bodyJson().extractingPath("$.enabled").isEqualTo(true);
        assertThat(status).bodyJson().extractingPath("$.dailyLimit").isEqualTo(3);
        assertThat(status).bodyJson().extractingPath("$.usedToday").isEqualTo(0);
    }

    @Test
    void aSummaryIsGeneratedOnceAndSharedWithEveryone() {
        TestUser author = registerUser();
        TestUser classmate = registerUser();
        String materialId = upload(author, createCourse(author, uniqueCode()), "lecture.pdf");
        int callsBefore = studyAssistant.calls.get();

        MvcTestResult first = post(author, "/api/materials/" + materialId + "/ai/summary", "");
        MvcTestResult second = post(classmate, "/api/materials/" + materialId + "/ai/summary", "");

        assertThat(first).hasStatus(HttpStatus.OK);
        assertThat(first).bodyJson().extractingPath("$.overview").isEqualTo("Overview of Notes lecture.pdf");
        assertThat(second).bodyJson().extractingPath("$.keyPoints[0]").isEqualTo("Point one");
        assertThat(studyAssistant.calls.get()).isEqualTo(callsBefore + 1);
        assertThat(get(classmate, "/api/ai/status")).bodyJson().extractingPath("$.usedToday").isEqualTo(0);
    }

    @Test
    void quizzesReturnQuestionsWithTheirAnswers() {
        TestUser student = registerUser();
        String materialId = upload(student, createCourse(student, uniqueCode()), "exam.pdf");

        MvcTestResult quiz = post(student, "/api/materials/" + materialId + "/ai/quiz", "");

        assertThat(quiz).hasStatus(HttpStatus.OK);
        assertThat(quiz).bodyJson().extractingPath("$.questions[0].options").asArray().hasSize(4);
        assertThat(quiz).bodyJson().extractingPath("$.questions[0].correctOptionIndex").isEqualTo(1);
    }

    @Test
    void eachStudentHasADailyLimitOfNewGenerations() {
        TestUser student = registerUser();
        String courseId = createCourse(student, uniqueCode());

        for (int i = 0; i < 3; i++) {
            String materialId = upload(student, courseId, "notes-" + i + ".pdf");
            assertThat(post(student, "/api/materials/" + materialId + "/ai/quiz", "")).hasStatus(HttpStatus.OK);
        }
        String fourth = upload(student, courseId, "notes-3.pdf");
        MvcTestResult limited = post(student, "/api/materials/" + fourth + "/ai/quiz", "");

        assertThat(limited).hasStatus(HttpStatus.TOO_MANY_REQUESTS);
        assertThat(limited).bodyJson().extractingPath("$.code").isEqualTo("AI_DAILY_LIMIT");
        assertThat(get(student, "/api/ai/status")).bodyJson().extractingPath("$.usedToday").isEqualTo(3);
    }

    @Test
    void unsupportedFilesAreRejectedWithoutCallingTheModel() {
        TestUser student = registerUser();
        String materialId = upload(student, createCourse(student, uniqueCode()), "slides.pptx");
        int callsBefore = studyAssistant.calls.get();

        MvcTestResult result = post(student, "/api/materials/" + materialId + "/ai/summary", "");

        assertThat(result).hasStatus(HttpStatus.BAD_REQUEST);
        assertThat(result).bodyJson().extractingPath("$.errors.material").isNotNull();
        assertThat(studyAssistant.calls.get()).isEqualTo(callsBefore);
    }

    @Test
    void withoutAnApiKeyTheToolsReportThemselvesUnavailable() {
        TestUser student = registerUser();
        String materialId = upload(student, createCourse(student, uniqueCode()), "lecture.pdf");
        studyAssistant.enabled = false;
        try {
            assertThat(get(student, "/api/ai/status")).bodyJson().extractingPath("$.enabled").isEqualTo(false);
            MvcTestResult result = post(student, "/api/materials/" + materialId + "/ai/summary", "");
            assertThat(result).hasStatus(HttpStatus.SERVICE_UNAVAILABLE);
            assertThat(result).bodyJson().extractingPath("$.code").isEqualTo("AI_DISABLED");
        } finally {
            studyAssistant.enabled = true;
        }
    }

    private String upload(TestUser user, String courseId, String fileName) {
        MvcTestResult result = mvc.post().uri("/api/courses/" + courseId + "/materials").multipart()
                .file(new MockMultipartFile("file", fileName, "application/octet-stream",
                        "%PDF-1.7 study notes".getBytes(StandardCharsets.UTF_8)))
                .param("type", "NOTES")
                .param("title", "Notes " + fileName)
                .param("academicYear", "2025/26")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + user.token())
                .exchange();
        return JsonPath.read(body(result), "$.id");
    }
}
