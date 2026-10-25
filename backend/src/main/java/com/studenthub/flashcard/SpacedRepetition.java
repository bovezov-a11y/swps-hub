package com.studenthub.flashcard;

import java.time.Duration;
import java.time.Instant;

/**
 * A simplified SM-2 scheduler, the algorithm behind Anki. Each successful recall pushes the next review further
 * out by the card's ease factor; forgetting a card brings it back within minutes and makes it a little harder.
 */
final class SpacedRepetition {

    static final double STARTING_EASE = 2.5;
    static final double MINIMUM_EASE = 1.3;
    static final Duration RELEARN_DELAY = Duration.ofMinutes(10);

    enum Grade {
        AGAIN,
        HARD,
        GOOD,
        EASY
    }

    record State(double ease, int intervalDays, int repetitions) {

        static State fresh() {
            return new State(STARTING_EASE, 0, 0);
        }
    }

    record Scheduled(State state, Instant dueAt) {
    }

    private SpacedRepetition() {
    }

    static Scheduled review(State state, Grade grade, Instant now) {
        if (grade == Grade.AGAIN) {
            State next = new State(Math.max(MINIMUM_EASE, state.ease() - 0.2), 0, 0);
            return new Scheduled(next, now.plus(RELEARN_DELAY));
        }
        int repetitions = state.repetitions() + 1;
        double ease = switch (grade) {
            case HARD -> Math.max(MINIMUM_EASE, state.ease() - 0.15);
            case EASY -> state.ease() + 0.15;
            default -> state.ease();
        };
        int interval = switch (grade) {
            case HARD -> repetitions == 1 ? 1 : Math.max(state.intervalDays() + 1, round(state.intervalDays() * 1.2));
            case GOOD -> repetitions == 1 ? 1 : repetitions == 2 ? 3 : round(state.intervalDays() * ease);
            case EASY -> repetitions == 1 ? 4 : Math.max(state.intervalDays() + 1,
                    round(state.intervalDays() * ease * 1.3));
            case AGAIN -> throw new IllegalStateException("handled above");
        };
        return new Scheduled(new State(ease, interval, repetitions), now.plus(Duration.ofDays(interval)));
    }

    private static int round(double days) {
        return (int) Math.round(days);
    }
}
