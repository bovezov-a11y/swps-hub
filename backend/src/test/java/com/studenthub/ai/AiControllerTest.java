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

    @Test
    void aSyllabusIsReadIntoAssessmentsWithOnlyExactDates() {
        TestUser student = registerUser();
        String courseId = createCourse(student, uniqueCode());

        MvcTestResult result = uploadSyllabus(student, courseId, "syllabus.pdf");

        assertThat(result).hasStatus(HttpStatus.OK);
        assertThat(result).bodyJson().extractingPath("$.gradingSummary").isEqualTo("Midterm 30%, essay 20%, final exam 50%.");
        assertThat(result).bodyJson().extractingPath("$.items[0].type").isEqualTo("EXAM");
        assertThat(result).bodyJson().extractingPath("$.items[0].date").isEqualTo("2026-11-18");
        assertThat(result).bodyJson().extractingPath("$.items[0].time").isEqualTo("10:00:00");
        assertThat(result).bodyJson().extractingPath("$.items[0].weightPercent").isEqualTo(30);
        // A date the model wrote in words is not trusted; the student fills it in.
        assertThat(result).bodyJson().extractingPath("$.items[1].date").isNull();
        assertThat(result).bodyJson().extractingPath("$.items[2].timing").isEqualTo("exam session");
        assertThat(get(student, "/api/courses/" + courseId + "/events")).bodyJson()
                .extractingPath("$").asArray().isEmpty();
        assertThat(get(student, "/api/ai/status")).bodyJson().extractingPath("$.usedToday").isEqualTo(1);
    }

    @Test
    void onlyCourseMembersCanImportASyllabus() {
        String courseId = createCourse(registerUser(), uniqueCode());
        int callsBefore = studyAssistant.calls.get();

        MvcTestResult result = uploadSyllabus(registerUser(), courseId, "syllabus.pdf");

        assertThat(result).hasStatus(HttpStatus.FORBIDDEN);
        assertThat(studyAssistant.calls.get()).isEqualTo(callsBefore);
    }

    @Test
    void aSyllabusMustBeAFileTheModelCanRead() {
        TestUser student = registerUser();

        MvcTestResult result = uploadSyllabus(student, createCourse(student, uniqueCode()), "syllabus.docx");

        assertThat(result).hasStatus(HttpStatus.BAD_REQUEST);
        assertThat(result).bodyJson().extractingPath("$.errors.file").asString().contains("PDF");
    }

    private MvcTestResult uploadSyllabus(TestUser user, String courseId, String fileName) {
        return mvc.post().uri("/api/courses/" + courseId + "/ai/syllabus").multipart()
                .file(new MockMultipartFile("file", fileName, "application/octet-stream",
                        "%PDF-1.7 syllabus".getBytes(StandardCharsets.UTF_8)))
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + user.token())
                .exchange();
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
