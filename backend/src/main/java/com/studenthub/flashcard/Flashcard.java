package com.studenthub.flashcard;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "flashcards")
class Flashcard {

    @Id
    private UUID id;

    @Column(name = "deck_id", nullable = false, updatable = false)
    private UUID deckId;

    @Column(nullable = false, length = 500)
    private String front;

    @Column(nullable = false, length = 2000)
    private String back;

    @Column(nullable = false)
    private int position;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected Flashcard() {
    }

    Flashcard(UUID deckId, String front, String back, int position) {
        this.id = UUID.randomUUID();
        this.deckId = deckId;
        this.front = front;
        this.back = back;
        this.position = position;
        this.createdAt = Instant.now();
    }

    UUID getId() {
        return id;
    }

    UUID getDeckId() {
        return deckId;
    }

    String getFront() {
        return front;
    }

    String getBack() {
        return back;
    }

    int getPosition() {
        return position;
    }
}
