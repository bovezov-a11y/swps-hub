package com.studenthub.ai;

import com.studenthub.ai.AiService.AiStatus;
import com.studenthub.ai.StudyAids.Quiz;
import com.studenthub.ai.StudyAids.Summary;
import com.studenthub.auth.CurrentUser;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
class AiController {

    private final AiService aiService;

    AiController(AiService aiService) {
        this.aiService = aiService;
    }

    /** Whether AI study tools are available, and how many generations the user has left today. */
    @GetMapping("/api/ai/status")
    AiStatus status(CurrentUser user) {
        return aiService.status(user);
    }

    /** Returns the material's summary, generating it on first use. */
    @PostMapping("/api/materials/{materialId}/ai/summary")
    Summary summary(CurrentUser user, @PathVariable UUID materialId) {
        return aiService.summary(user, materialId);
    }

    /** Returns the id of the material's AI flashcard deck, generating it on first use. */
    @PostMapping("/api/materials/{materialId}/ai/flashcards")
    DeckCreated flashcards(CurrentUser user, @PathVariable UUID materialId) {
        return new DeckCreated(aiService.flashcardDeck(user, materialId));
    }

    record DeckCreated(UUID deckId) {
    }

    /** Returns the material's practice quiz, generating it on first use. */
    @PostMapping("/api/materials/{materialId}/ai/quiz")
    Quiz quiz(CurrentUser user, @PathVariable UUID materialId) {
        return aiService.quiz(user, materialId);
    }
}
