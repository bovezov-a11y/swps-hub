package com.studenthub.flashcard;

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

class FlashcardTest extends ApiTest {

    @Test
    void studyingACardSchedulesItForLaterAndCountsTowardsTheStreak() {
        TestUser student = registerUser();
        String courseId = createCourse(student, uniqueCode());
        String deckId = createDeck(student, courseId);

        List<String> queue = JsonPath.read(body(get(student, "/api/decks/" + deckId + "/study")), "$[*].id");
        assertThat(queue).hasSize(3);
        assertThat(get(student, "/api/courses/" + courseId + "/decks"))
                .bodyJson().extractingPath("$[0].dueCount").isEqualTo(3);

        MvcTestResult review = post(student, "/api/cards/" + queue.getFirst() + "/reviews", """
                {"grade": "GOOD"}
                """);
        assertThat(review).hasStatus(HttpStatus.OK);
        assertThat(review).bodyJson().extractingPath("$.intervalDays").isEqualTo(1);

        assertThat(JsonPath.<List<String>>read(body(get(student, "/api/decks/" + deckId + "/study")), "$[*].id"))
                .doesNotContain(queue.getFirst());
        MvcTestResult summary = get(student, "/api/me/learning");
        assertThat(summary).bodyJson().extractingPath("$.reviewedToday").isEqualTo(1);
        assertThat(summary).bodyJson().extractingPath("$.streakDays").isEqualTo(1);
        assertThat(summary).bodyJson().extractingPath("$.dueCards").isEqualTo(2);
    }

    @Test
    void progressIsPrivateToEachStudent() {
        TestUser author = registerUser();
        TestUser classmate = registerUser();
        String courseId = createCourse(author, uniqueCode());
        String deckId = createDeck(author, courseId);
        String cardId = JsonPath.<List<String>>read(body(get(author, "/api/decks/" + deckId + "/study")), "$[*].id")
                .getFirst();
        post(author, "/api/cards/" + cardId + "/reviews", """
                {"grade": "EASY"}
                """);

        assertThat(JsonPath.<List<String>>read(body(get(classmate, "/api/decks/" + deckId + "/study")), "$[*].id"))
                .contains(cardId);
    }

    @Test
    void onlyTheAuthorCanChangeADeck() {
        TestUser author = registerUser();
        String deckId = createDeck(author, createCourse(author, uniqueCode()));
        String cards = """
                {"cards": [{"front": "Extra", "back": "Card"}]}
                """;

        assertThat(post(registerUser(), "/api/decks/" + deckId + "/cards", cards)).hasStatus(HttpStatus.FORBIDDEN);
        assertThat(post(author, "/api/decks/" + deckId + "/cards", cards)).hasStatus(HttpStatus.NO_CONTENT);
        assertThat(get(author, "/api/decks/" + deckId)).bodyJson().extractingPath("$.cards").asArray().hasSize(4);
    }

    @Test
    void aiFlashcardsAreGeneratedOncePerMaterial() {
        TestUser student = registerUser();
        String courseId = createCourse(student, uniqueCode());
        MvcTestResult upload = mvc.post().uri("/api/courses/" + courseId + "/materials").multipart()
                .file(new MockMultipartFile("file", "lecture.pdf", "application/pdf",
                        "%PDF-1.7".getBytes(StandardCharsets.UTF_8)))
                .param("type", "NOTES").param("title", "Lecture 1").param("academicYear", "2025/26")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + student.token())
                .exchange();
        String materialId = JsonPath.read(body(upload), "$.id");
        int callsBefore = studyAssistant.calls.get();

        String first = JsonPath.read(body(post(student, "/api/materials/" + materialId + "/ai/flashcards", "")),
                "$.deckId");
        String second = JsonPath.read(body(post(registerUser(), "/api/materials/" + materialId + "/ai/flashcards", "")),
                "$.deckId");

        assertThat(second).isEqualTo(first);
        assertThat(studyAssistant.calls.get()).isEqualTo(callsBefore + 1);
        assertThat(get(student, "/api/decks/" + first)).bodyJson().extractingPath("$.aiGenerated").isEqualTo(true);
    }

    private String createDeck(TestUser user, String courseId) {
        return JsonPath.read(body(post(user, "/api/courses/" + courseId + "/decks", """
                {"title": "Key terms", "cards": [
                  {"front": "Mean", "back": "The average"},
                  {"front": "Median", "back": "The middle value"},
                  {"front": "Mode", "back": "The most common value"}]}
                """)), "$.id");
    }
}
