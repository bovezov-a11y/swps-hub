package com.studenthub.qa;

import com.jayway.jsonpath.JsonPath;
import com.studenthub.ApiTest;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.test.web.servlet.assertj.MvcTestResult;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class QaTest extends ApiTest {

    @Test
    void questionsAndAnswersNeverRevealWhoWroteThem() {
        TestUser asker = registerUser();
        TestUser helper = registerUser();
        String courseId = createCourse(asker, uniqueCode());
        String questionId = ask(asker, courseId, "How do I read a p-value?");
        answer(helper, questionId, "It is the chance of data this extreme if H0 were true.");
        answer(asker, questionId, "Thanks, and what about effect sizes?");

        MvcTestResult seenByHelper = get(helper, "/api/questions/" + questionId);
        MvcTestResult seenByAsker = get(asker, "/api/questions/" + questionId);

        assertThat(JsonPath.<List<String>>read(body(seenByHelper), "$.answers[*].author"))
                .containsExactlyInAnyOrder("YOU", "ASKER");
        assertThat(JsonPath.<List<String>>read(body(seenByAsker), "$.answers[*].author"))
                .containsExactlyInAnyOrder("STUDENT", "YOU");
        assertThat(seenByHelper).bodyJson().extractingPath("$.mine").isEqualTo(false);
        assertThat(body(seenByHelper)).doesNotContain(asker.id(), helper.id(), "Test Student");
    }

    @Test
    void onlyTheAskerCanAcceptAndTheAcceptedAnswerComesFirst() {
        TestUser asker = registerUser();
        String courseId = createCourse(asker, uniqueCode());
        String questionId = ask(asker, courseId, "Which chapters are on the exam?");
        String first = answer(registerUser(), questionId, "Chapters 1 to 4.");
        String best = answer(registerUser(), questionId, "Chapters 1 to 6, see the syllabus.");

        assertThat(put(registerUser(), "/api/questions/" + questionId + "/accepted-answer", """
                {"answerId": "%s"}
                """.formatted(best))).hasStatus(HttpStatus.FORBIDDEN);
        assertThat(put(asker, "/api/questions/" + questionId + "/accepted-answer", """
                {"answerId": "%s"}
                """.formatted(best))).hasStatus(HttpStatus.NO_CONTENT);

        MvcTestResult detail = get(asker, "/api/questions/" + questionId);
        assertThat(JsonPath.<List<String>>read(body(detail), "$.answers[*].id")).containsExactly(best, first);
        assertThat(detail).bodyJson().extractingPath("$.answers[0].accepted").isEqualTo(true);
    }

    @Test
    void votesCountOncePerStudentAndUnansweredQuestionsCanBeFiltered() {
        TestUser asker = registerUser();
        TestUser voter = registerUser();
        String courseId = createCourse(asker, uniqueCode());
        String answered = ask(asker, courseId, "Answered question");
        String open = ask(asker, courseId, "Open question");
        answer(voter, answered, "An answer");

        assertThat(put(voter, "/api/questions/" + open + "/vote")).bodyJson().extractingPath("$.voteCount").isEqualTo(1);
        assertThat(put(voter, "/api/questions/" + open + "/vote")).bodyJson().extractingPath("$.voteCount").isEqualTo(1);

        List<String> unanswered = JsonPath.read(
                body(get(voter, "/api/courses/" + courseId + "/questions?filter=unanswered")), "$[*].id");
        assertThat(unanswered).containsExactly(open);
    }

    @Test
    void reportedQuestionsCanBeHiddenByModerators() {
        TestUser asker = registerUser();
        String courseId = createCourse(asker, uniqueCode());
        String questionId = ask(asker, courseId, "Selling exam answers, message me");

        assertThat(post(registerUser(), "/api/reports", """
                {"targetType": "QUESTION", "targetId": "%s", "reason": "SPAM"}
                """.formatted(questionId))).hasStatus(HttpStatus.CREATED);
        assertThat(post(moderator(), "/api/moderation/QUESTION/" + questionId + "/hide", ""))
                .hasStatus(HttpStatus.NO_CONTENT);

        assertThat(get(registerUser(), "/api/questions/" + questionId)).hasStatus(HttpStatus.NOT_FOUND);
        assertThat(get(asker, "/api/questions/" + questionId)).bodyJson().extractingPath("$.hidden").isEqualTo(true);
    }

    private String ask(TestUser user, String courseId, String title) {
        return JsonPath.read(body(post(user, "/api/courses/" + courseId + "/questions", """
                {"title": "%s", "body": "Details about: %s"}
                """.formatted(title, title))), "$.id");
    }

    private String answer(TestUser user, String questionId, String text) {
        return JsonPath.read(body(post(user, "/api/questions/" + questionId + "/answers", """
                {"body": "%s"}
                """.formatted(text))), "$.id");
    }
}
