package com.studenthub.flashcard;

import com.studenthub.flashcard.SpacedRepetition.Grade;
import com.studenthub.flashcard.SpacedRepetition.Scheduled;
import com.studenthub.flashcard.SpacedRepetition.State;
import org.junit.jupiter.api.Test;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class SpacedRepetitionTest {

    private static final Instant NOW = Instant.parse("2026-10-25T10:00:00Z");

    @Test
    void goodAnswersSpreadReviewsFurtherApart() {
        Scheduled first = SpacedRepetition.review(State.fresh(), Grade.GOOD, NOW);
        Scheduled second = SpacedRepetition.review(first.state(), Grade.GOOD, NOW);
        Scheduled third = SpacedRepetition.review(second.state(), Grade.GOOD, NOW);

        assertThat(List.of(first.state().intervalDays(), second.state().intervalDays(), third.state().intervalDays()))
                .containsExactly(1, 3, 8);
        assertThat(third.dueAt()).isEqualTo(NOW.plus(Duration.ofDays(8)));
    }

    @Test
    void forgettingBringsTheCardBackSoonAndMakesItHarder() {
        Scheduled learned = SpacedRepetition.review(new State(2.5, 20, 5), Grade.AGAIN, NOW);

        assertThat(learned.state().repetitions()).isZero();
        assertThat(learned.state().ease()).isEqualTo(2.3);
        assertThat(learned.dueAt()).isEqualTo(NOW.plus(SpacedRepetition.RELEARN_DELAY));
    }

    @Test
    void easeNeverDropsBelowTheMinimum() {
        State state = new State(1.35, 3, 2);
        for (int i = 0; i < 5; i++) {
            state = SpacedRepetition.review(state, Grade.HARD, NOW).state();
        }
        assertThat(state.ease()).isEqualTo(SpacedRepetition.MINIMUM_EASE);
    }

    @Test
    void easyAnswersJumpFurtherThanGoodOnes() {
        State seen = new State(2.5, 3, 2);
        assertThat(SpacedRepetition.review(seen, Grade.EASY, NOW).state().intervalDays())
                .isGreaterThan(SpacedRepetition.review(seen, Grade.GOOD, NOW).state().intervalDays());
    }

    @Test
    void streaksCountConsecutiveDaysEndingTodayOrYesterday() {
        LocalDate today = LocalDate.of(2026, 10, 25);

        assertThat(FlashcardService.streak(List.of(today, today.minusDays(1), today.minusDays(2)), today)).isEqualTo(3);
        assertThat(FlashcardService.streak(List.of(today.minusDays(1), today.minusDays(2)), today)).isEqualTo(2);
        assertThat(FlashcardService.streak(List.of(today.minusDays(3)), today)).isZero();
    }
}
