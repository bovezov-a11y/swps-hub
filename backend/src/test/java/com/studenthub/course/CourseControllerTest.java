package com.studenthub.course;

import com.jayway.jsonpath.JsonPath;
import com.studenthub.ApiTest;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.test.web.servlet.assertj.MvcTestResult;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class CourseControllerTest extends ApiTest {

    @Test
    void createNormalisesCodeAndEnrollsTheAuthor() {
        TestUser author = registerUser();
        String code = uniqueCode();

        MvcTestResult result = post(author, "/api/courses", """
                {"code": "  %s ", "name": "Cognitive Psychology", "semester": "2026/27 Winter", "lecturer": "Dr Kowalska"}
                """.formatted(code.toLowerCase()));

        assertThat(result).hasStatus(HttpStatus.CREATED);
        assertThat(result).bodyJson().extractingPath("$.code").isEqualTo(code);
        assertThat(result).bodyJson().extractingPath("$.enrolled").isEqualTo(true);
        assertThat(result).bodyJson().extractingPath("$.memberCount").isEqualTo(1);
        assertThat(result).bodyJson().extractingPath("$.canEdit").isEqualTo(true);
    }

    @Test
    void courseCodeIsUniquePerSemester() {
        TestUser author = registerUser();
        String code = uniqueCode();
        createCourse(author, code);

        assertThat(post(author, "/api/courses", """
                {"code": "%s", "name": "Duplicate", "semester": "2026/27 Winter"}
                """.formatted(code))).hasStatus(HttpStatus.CONFLICT);
        assertThat(post(author, "/api/courses", """
                {"code": "%s", "name": "Next year", "semester": "2027/28 Winter"}
                """.formatted(code))).hasStatus(HttpStatus.CREATED);
    }

    @Test
    void createValidatesSemesterFormat() {
        MvcTestResult result = post(registerUser(), "/api/courses", """
                {"code": "%s", "name": "Statistics", "semester": "winter"}
                """.formatted(uniqueCode()));

        assertThat(result).hasStatus(HttpStatus.BAD_REQUEST);
        assertThat(result).bodyJson().extractingPath("$.errors.semester").isNotNull();
    }

    @Test
    void studentsCanFindJoinAndLeaveCourses() {
        TestUser author = registerUser();
        TestUser student = registerUser();
        String code = uniqueCode();
        String courseId = createCourse(author, code);

        MvcTestResult search = get(student, "/api/courses?q=" + code.toLowerCase());
        assertThat(search).bodyJson().extractingPath("$.items[0].id").isEqualTo(courseId);
        assertThat(search).bodyJson().extractingPath("$.items[0].enrolled").isEqualTo(false);
        assertThat(search).bodyJson().extractingPath("$.items[0].memberCount").isEqualTo(1);

        assertThat(put(student, "/api/courses/" + courseId + "/enrollment")).hasStatus(HttpStatus.NO_CONTENT);
        assertThat(put(student, "/api/courses/" + courseId + "/enrollment")).hasStatus(HttpStatus.NO_CONTENT);
        assertThat(myCourseIds(student)).containsExactly(courseId);
        assertThat(get(student, "/api/courses/" + courseId)).bodyJson().extractingPath("$.memberCount").isEqualTo(2);

        assertThat(delete(student, "/api/courses/" + courseId + "/enrollment")).hasStatus(HttpStatus.NO_CONTENT);
        assertThat(myCourseIds(student)).isEmpty();
    }

    @Test
    void onlyTheAuthorCanEditACourse() {
        TestUser author = registerUser();
        String code = uniqueCode();
        String courseId = createCourse(author, code);
        String update = """
                {"code": "%s", "name": "Renamed course", "semester": "2026/27 Winter"}
                """.formatted(code);

        assertThat(put(registerUser(), "/api/courses/" + courseId, update)).hasStatus(HttpStatus.FORBIDDEN);
        assertThat(put(author, "/api/courses/" + courseId, update))
                .hasStatus(HttpStatus.OK)
                .bodyJson().extractingPath("$.name").isEqualTo("Renamed course");
    }

    @Test
    void unknownCourseReturnsNotFound() {
        assertThat(get(registerUser(), "/api/courses/" + UUID.randomUUID())).hasStatus(HttpStatus.NOT_FOUND);
    }

    private List<String> myCourseIds(TestUser user) {
        return JsonPath.read(body(get(user, "/api/courses?mine=true")), "$.items[*].id");
    }
}
