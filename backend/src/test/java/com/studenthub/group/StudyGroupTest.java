package com.studenthub.group;

import com.jayway.jsonpath.JsonPath;
import com.studenthub.ApiTest;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.test.web.servlet.assertj.MvcTestResult;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class StudyGroupTest extends ApiTest {

    @Test
    void onlyMembersSeeWhoIsInTheGroupAndWhereItMeets() {
        TestUser creator = registerUser();
        TestUser outsider = registerUser();
        String courseId = createCourse(creator, uniqueCode());
        put(outsider, "/api/courses/" + courseId + "/enrollment");
        String groupId = createGroup(creator, courseId, 4);

        MvcTestResult outsiderView = get(outsider, "/api/courses/" + courseId + "/groups");
        assertThat(outsiderView).bodyJson().extractingPath("$[0].memberCount").isEqualTo(1);
        assertThat(outsiderView).bodyJson().extractingPath("$[0].members").asArray().isEmpty();
        assertThat(outsiderView).bodyJson().extractingPath("$[0].meetingDetails").isNull();

        MvcTestResult joined = put(outsider, "/api/groups/" + groupId + "/membership");
        assertThat(joined).bodyJson().extractingPath("$.meetingDetails").isEqualTo("Library room 2, Thursdays 17:00");
        assertThat(joined).bodyJson().extractingPath("$.members").asArray().hasSize(2);
    }

    @Test
    void groupsBelongToCourseMembersAndRespectTheirCapacity() {
        TestUser creator = registerUser();
        String courseId = createCourse(creator, uniqueCode());
        String groupId = createGroup(creator, courseId, 2);
        TestUser second = registerUser();
        TestUser third = registerUser();

        assertThat(put(second, "/api/groups/" + groupId + "/membership")).hasStatus(HttpStatus.FORBIDDEN);
        put(second, "/api/courses/" + courseId + "/enrollment");
        put(third, "/api/courses/" + courseId + "/enrollment");
        assertThat(put(second, "/api/groups/" + groupId + "/membership")).hasStatus(HttpStatus.OK);
        assertThat(put(third, "/api/groups/" + groupId + "/membership")).hasStatus(HttpStatus.CONFLICT);
    }

    @Test
    void aGroupDisappearsWhenItsLastMemberLeaves() {
        TestUser creator = registerUser();
        String courseId = createCourse(creator, uniqueCode());
        String groupId = createGroup(creator, courseId, 5);

        assertThat(delete(creator, "/api/groups/" + groupId + "/membership")).hasStatus(HttpStatus.NO_CONTENT);

        List<String> ids = JsonPath.read(body(get(creator, "/api/courses/" + courseId + "/groups")), "$[*].id");
        assertThat(ids).doesNotContain(groupId);
    }

    private String createGroup(TestUser user, String courseId, int capacity) {
        return JsonPath.read(body(post(user, "/api/courses/" + courseId + "/groups", """
                {"name": "Exam prep", "description": "Weekly revision", "meetingDetails": "Library room 2, Thursdays 17:00",
                 "capacity": %d}
                """.formatted(capacity))), "$.id");
    }
}
