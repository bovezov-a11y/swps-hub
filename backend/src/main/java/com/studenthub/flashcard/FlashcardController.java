package com.studenthub.flashcard;

import com.studenthub.auth.CurrentUser;
import com.studenthub.flashcard.FlashcardService.CardInput;
import com.studenthub.flashcard.FlashcardService.DeckDetail;
import com.studenthub.flashcard.FlashcardService.DeckSummary;
import com.studenthub.flashcard.FlashcardService.LearningSummary;
import com.studenthub.flashcard.FlashcardService.ReviewResult;
import com.studenthub.flashcard.FlashcardService.StudyCard;
import com.studenthub.flashcard.SpacedRepetition.Grade;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
class FlashcardController {

    private final FlashcardService flashcards;

    FlashcardController(FlashcardService flashcards) {
        this.flashcards = flashcards;
    }

    @GetMapping("/api/courses/{courseId}/decks")
    List<DeckSummary> decks(CurrentUser user, @PathVariable UUID courseId) {
        return flashcards.decks(user, courseId);
    }

    @PostMapping("/api/courses/{courseId}/decks")
    @ResponseStatus(HttpStatus.CREATED)
    Created createDeck(CurrentUser user, @PathVariable UUID courseId, @Valid @RequestBody DeckRequest request) {
        return new Created(flashcards.createDeck(user, courseId, request.title(), request.description(),
                toInputs(request.cards())));
    }

    @GetMapping("/api/decks/{deckId}")
    DeckDetail deck(CurrentUser user, @PathVariable UUID deckId) {
        return flashcards.deck(user, deckId);
    }

    @PostMapping("/api/decks/{deckId}/cards")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void addCards(CurrentUser user, @PathVariable UUID deckId, @Valid @RequestBody CardsRequest request) {
        flashcards.addCards(user, deckId, toInputs(request.cards()));
    }

    @DeleteMapping("/api/decks/{deckId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void deleteDeck(CurrentUser user, @PathVariable UUID deckId) {
        flashcards.deleteDeck(user, deckId);
    }

    @GetMapping("/api/decks/{deckId}/study")
    List<StudyCard> study(CurrentUser user, @PathVariable UUID deckId) {
        return flashcards.studyQueue(user, deckId);
    }

    @PostMapping("/api/cards/{cardId}/reviews")
    ReviewResult review(CurrentUser user, @PathVariable UUID cardId, @Valid @RequestBody ReviewRequest request) {
        return flashcards.review(user, cardId, request.grade());
    }

    @GetMapping("/api/me/learning")
    LearningSummary summary(CurrentUser user) {
        return flashcards.summary(user);
    }

    private static List<CardInput> toInputs(List<CardRequest> cards) {
        return cards.stream().map(card -> new CardInput(card.front(), card.back())).toList();
    }

    record CardRequest(@NotBlank @Size(max = 500) String front, @NotBlank @Size(max = 2000) String back) {
    }

    record DeckRequest(@NotBlank @Size(max = 150) String title, @Size(max = 500) String description,
                       @NotEmpty @Size(max = 500) List<@Valid CardRequest> cards) {
    }

    record CardsRequest(@NotEmpty @Size(max = 500) List<@Valid CardRequest> cards) {
    }

    record ReviewRequest(@NotNull Grade grade) {
    }

    record Created(UUID id) {
    }
}
