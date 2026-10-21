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
                {"programId": "%s", "studyYear": 2, "term": "SUMMER", "code": "  %s ",
                 "name": "Algorithms and Data Structures", "lecturer": "Dr Kowalski"}
                """.formatted(programId(author, "computer-science"), code.toLowerCase()));

        assertThat(result).hasStatus(HttpStatus.CREATED);
        assertThat(result).bodyJson().extractingPath("$.code").isEqualTo(code);
        assertThat(result).bodyJson().extractingPath("$.program.slug").isEqualTo("computer-science");
        assertThat(result).bodyJson().extractingPath("$.studyYear").isEqualTo(2);
        assertThat(result).bodyJson().extractingPath("$.term").isEqualTo("SUMMER");
        assertThat(result).bodyJson().extractingPath("$.enrolled").isEqualTo(true);
        assertThat(result).bodyJson().extractingPath("$.memberCount").isEqualTo(1);
        assertThat(result).bodyJson().extractingPath("$.canEdit").isEqualTo(true);
    }

    @Test
    void courseCodeIsUniqueWithinAProgram() {
        TestUser author = registerUser();
        String code = uniqueCode();
        createCourse(author, code, "psychology", 1);

        assertThat(post(author, "/api/courses", courseJson(author, "psychology", code)))
                .hasStatus(HttpStatus.CONFLICT);
        assertThat(post(author, "/api/courses", courseJson(author, "law", code)))
                .hasStatus(HttpStatus.CREATED);
    }

    @Test
    void createValidatesYearAndProgram() {
        TestUser author = registerUser();

        MvcTestResult badYear = post(author, "/api/courses", """
                {"programId": "%s", "studyYear": 7, "term": "WINTER", "code": "%s", "name": "Statistics"}
                """.formatted(programId(author, "psychology"), uniqueCode()));
        assertThat(badYear).hasStatus(HttpStatus.BAD_REQUEST);
        assertThat(badYear).bodyJson().extractingPath("$.errors.studyYear").isNotNull();

        MvcTestResult unknownProgram = post(author, "/api/courses", """
                {"programId": "%s", "studyYear": 1, "term": "WINTER", "code": "%s", "name": "Statistics"}
                """.formatted(UUID.randomUUID(), uniqueCode()));
        assertThat(unknownProgram).hasStatus(HttpStatus.BAD_REQUEST);
        assertThat(unknownProgram).bodyJson().extractingPath("$.errors.programId").isNotNull();
    }

    @Test
    void coursesCanBeBrowsedByProgramAndYear() {
        TestUser author = registerUser();
        String firstYear = createCourse(author, uniqueCode(), "cognitive-science", 1);
        String thirdYear = createCourse(author, uniqueCode(), "cognitive-science", 3);
        createCourse(author, uniqueCode(), "sociology", 1);

        List<String> program = JsonPath.read(body(get(author, "/api/courses?program=cognitive-science&size=100")), "$.items[*].id");
        List<String> yearThree = JsonPath.read(body(get(author, "/api/courses?program=cognitive-science&year=3&size=100")), "$.items[*].id");

        assertThat(program).contains(firstYear, thirdYear);
        assertThat(yearThree).contains(thirdYear).doesNotContain(firstYear);
        assertThat(get(author, "/api/courses?program=no-such-program")).hasStatus(HttpStatus.NOT_FOUND);
    }

    @Test
    void programsListCountsTheirCourses() {
        TestUser author = registerUser();
        createCourse(author, uniqueCode(), "design", 1);

        MvcTestResult programs = get(author, "/api/programs");

        assertThat(programs).hasStatus(HttpStatus.OK);
        List<Integer> designCounts = JsonPath.read(body(programs), "$[?(@.slug == 'design')].courseCount");
        assertThat(designCounts.getFirst()).isPositive();
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
        assertThat(search).bodyJson().extractingPath("$.items[0].program.name").isEqualTo("Psychology");

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
                {"programId": "%s", "studyYear": 1, "term": "WINTER", "code": "%s", "name": "Renamed course"}
                """.formatted(programId(author, "psychology"), code);

        assertThat(put(registerUser(), "/api/courses/" + courseId, update)).hasStatus(HttpStatus.FORBIDDEN);
        assertThat(put(author, "/api/courses/" + courseId, update))
                .hasStatus(HttpStatus.OK)
                .bodyJson().extractingPath("$.name").isEqualTo("Renamed course");
    }

    @Test
    void unknownCourseReturnsNotFound() {
        assertThat(get(registerUser(), "/api/courses/" + UUID.randomUUID())).hasStatus(HttpStatus.NOT_FOUND);
    }

    private String courseJson(TestUser user, String programSlug, String code) {
        return """
                {"programId": "%s", "studyYear": 1, "term": "WINTER", "code": "%s", "name": "Some course"}
                """.formatted(programId(user, programSlug), code);
    }

    private List<String> myCourseIds(TestUser user) {
        return JsonPath.read(body(get(user, "/api/courses?mine=true")), "$.items[*].id");
    }
}
