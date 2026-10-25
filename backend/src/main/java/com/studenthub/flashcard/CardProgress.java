package com.studenthub.flashcard;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

/** One student's review state for one card. */
@Entity
@Table(name = "flashcard_progress")
class CardProgress {

    @EmbeddedId
    private Id id;

    @Column(nullable = false)
    private double ease;

    @Column(name = "interval_days", nullable = false)
    private int intervalDays;

    @Column(nullable = false)
    private int repetitions;

    @Column(name = "due_at", nullable = false)
    private Instant dueAt;

    @Column(name = "last_reviewed_at", nullable = false)
    private Instant lastReviewedAt;

    protected CardProgress() {
    }

    CardProgress(UUID userId, UUID cardId) {
        this.id = new Id(userId, cardId);
        SpacedRepetition.State fresh = SpacedRepetition.State.fresh();
        this.ease = fresh.ease();
        this.intervalDays = fresh.intervalDays();
        this.repetitions = fresh.repetitions();
    }

    SpacedRepetition.State state() {
        return new SpacedRepetition.State(ease, intervalDays, repetitions);
    }

    void apply(SpacedRepetition.Scheduled scheduled, Instant reviewedAt) {
        this.ease = scheduled.state().ease();
        this.intervalDays = scheduled.state().intervalDays();
        this.repetitions = scheduled.state().repetitions();
        this.dueAt = scheduled.dueAt();
        this.lastReviewedAt = reviewedAt;
    }

    Instant getDueAt() {
        return dueAt;
    }

    int getIntervalDays() {
        return intervalDays;
    }

    @Embeddable
    record Id(@Column(name = "user_id") UUID userId, @Column(name = "card_id") UUID cardId) {
    }
}
