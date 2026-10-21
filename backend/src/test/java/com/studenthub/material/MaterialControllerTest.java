package com.studenthub.material;

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

class MaterialControllerTest extends ApiTest {

    private static final byte[] PDF = "%PDF-1.7 past exam".getBytes(StandardCharsets.UTF_8);

    @Test
    void anyStudentCanShareAndDownloadMaterials() throws Exception {
        TestUser author = registerUser();
        TestUser classmate = registerUser();
        String courseId = createCourse(author, uniqueCode());

        MvcTestResult upload = upload(classmate, courseId, "C:\\Users\\me\\exam 2025.pdf", "PAST_EXAM", "2025/26");

        assertThat(upload).hasStatus(HttpStatus.CREATED);
        assertThat(upload).bodyJson().extractingPath("$.fileName").isEqualTo("exam 2025.pdf");
        assertThat(upload).bodyJson().extractingPath("$.contentType").isEqualTo("application/pdf");
        assertThat(upload).bodyJson().extractingPath("$.uploader.displayName").isEqualTo("Test Student");
        assertThat(upload).bodyJson().extractingPath("$.canDelete").isEqualTo(true);
        String materialId = JsonPath.read(body(upload), "$.id");

        assertThat(get(author, "/api/courses/" + courseId + "/materials"))
                .bodyJson().extractingPath("$[0].canDelete").isEqualTo(false);
        assertThat(get(author, "/api/courses/" + courseId)).bodyJson().extractingPath("$.materialCount").isEqualTo(1);

        MvcTestResult download = get(author, "/api/materials/" + materialId + "/file");
        assertThat(download).hasStatus(HttpStatus.OK);
        assertThat(download.getResponse().getContentAsByteArray()).isEqualTo(PDF);
        assertThat(download.getResponse().getHeader(HttpHeaders.CONTENT_DISPOSITION)).startsWith("attachment");
    }

    @Test
    void uploadRejectsMissingOrUnsafeFilesAndBadYears() {
        TestUser student = registerUser();
        String courseId = createCourse(student, uniqueCode());

        MvcTestResult html = mvc.post().uri("/api/courses/" + courseId + "/materials").multipart()
                .file(new MockMultipartFile("file", "notes.html", "text/html", "<script>".getBytes()))
                .param("type", "NOTES").param("title", "Notes").param("academicYear", "2025/26")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + student.token()).exchange();
        assertThat(html).hasStatus(HttpStatus.BAD_REQUEST);
        assertThat(html).bodyJson().extractingPath("$.errors.file").isNotNull();

        MvcTestResult noFile = mvc.post().uri("/api/courses/" + courseId + "/materials").multipart()
                .param("type", "NOTES").param("title", "Notes").param("academicYear", "2025/26")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + student.token()).exchange();
        assertThat(noFile).hasStatus(HttpStatus.BAD_REQUEST);
        assertThat(noFile).bodyJson().extractingPath("$.errors.file").isNotNull();

        MvcTestResult badYear = upload(student, courseId, "exam.pdf", "PAST_EXAM", "last year");
        assertThat(badYear).hasStatus(HttpStatus.BAD_REQUEST);
        assertThat(badYear).bodyJson().extractingPath("$.errors.academicYear").isNotNull();
    }

    @Test
    void votesAreCountedOncePerStudentAndRankMaterials() {
        TestUser author = registerUser();
        TestUser second = registerUser();
        String courseId = createCourse(author, uniqueCode());
        String older = JsonPath.read(body(upload(author, courseId, "a.pdf", "NOTES", "2025/26")), "$.id");
        String newer = JsonPath.read(body(upload(author, courseId, "b.pdf", "NOTES", "2025/26")), "$.id");

        assertThat(put(author, "/api/materials/" + older + "/vote")).bodyJson().extractingPath("$.voteCount").isEqualTo(1);
        assertThat(put(author, "/api/materials/" + older + "/vote")).bodyJson().extractingPath("$.voteCount").isEqualTo(1);
        assertThat(put(second, "/api/materials/" + older + "/vote")).bodyJson().extractingPath("$.voteCount").isEqualTo(2);

        assertThat(ids(get(author, "/api/courses/" + courseId + "/materials"))).containsExactly(older, newer);
        assertThat(ids(get(author, "/api/courses/" + courseId + "/materials?sort=new"))).containsExactly(newer, older);
        assertThat(get(author, "/api/courses/" + courseId + "/materials"))
                .bodyJson().extractingPath("$[0].voted").isEqualTo(true);

        assertThat(delete(second, "/api/materials/" + older + "/vote")).bodyJson().extractingPath("$.voteCount").isEqualTo(1);
        assertThat(delete(second, "/api/materials/" + older + "/vote")).bodyJson().extractingPath("$.voteCount").isEqualTo(1);
    }

    @Test
    void materialsCanBeFilteredByTypeAndYear() {
        TestUser author = registerUser();
        String courseId = createCourse(author, uniqueCode());
        String exam2025 = JsonPath.read(body(upload(author, courseId, "exam.pdf", "PAST_EXAM", "2025/26")), "$.id");
        String exam2024 = JsonPath.read(body(upload(author, courseId, "exam-old.pdf", "PAST_EXAM", "2024/25")), "$.id");
        upload(author, courseId, "notes.pdf", "NOTES", "2025/26");

        assertThat(ids(get(author, "/api/courses/" + courseId + "/materials?type=PAST_EXAM")))
                .containsExactlyInAnyOrder(exam2025, exam2024);
        assertThat(ids(get(author, "/api/courses/" + courseId + "/materials?type=PAST_EXAM&year=2024/25")))
                .containsExactly(exam2024);
    }

    @Test
    void onlyTheUploaderCanDeleteAndTheFileGoesAway() {
        TestUser uploader = registerUser();
        String courseId = createCourse(uploader, uniqueCode());
        String materialId = JsonPath.read(body(upload(uploader, courseId, "exam.pdf", "PAST_EXAM", "2025/26")), "$.id");

        assertThat(delete(registerUser(), "/api/materials/" + materialId)).hasStatus(HttpStatus.FORBIDDEN);
        assertThat(delete(uploader, "/api/materials/" + materialId)).hasStatus(HttpStatus.NO_CONTENT);
        assertThat(get(uploader, "/api/materials/" + materialId + "/file")).hasStatus(HttpStatus.NOT_FOUND);
    }

    @Test
    void feedShowsNewMaterialsFromJoinedCoursesOnly() {
        TestUser student = registerUser();
        TestUser stranger = registerUser();
        String joined = createCourse(student, uniqueCode());
        String other = createCourse(stranger, uniqueCode());
        String shared = JsonPath.read(body(upload(stranger, joined, "notes.pdf", "NOTES", "2025/26")), "$.id");
        upload(stranger, other, "secret.pdf", "NOTES", "2025/26");

        assertThat(ids(get(student, "/api/materials/feed"))).containsExactly(shared);
    }

    private MvcTestResult upload(TestUser user, String courseId, String fileName, String type, String academicYear) {
        return mvc.post().uri("/api/courses/" + courseId + "/materials").multipart()
                .file(new MockMultipartFile("file", fileName, "application/octet-stream", PDF))
                .param("type", type)
                .param("title", "Material " + fileName)
                .param("academicYear", academicYear)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + user.token())
                .exchange();
    }

    private static List<String> ids(MvcTestResult result) {
        return JsonPath.read(body(result), "$[*].id");
    }
}
