package com.studenthub.qa;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "answers")
public class Answer {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "question_id", nullable = false, updatable = false)
    private Question question;

    @Column(name = "author_id", nullable = false, updatable = false)
    private UUID authorId;

    @Column(nullable = false, length = 5000)
    private String body;

    @Column(name = "vote_count", nullable = false)
    private int voteCount;

    @Column(nullable = false)
    private boolean hidden;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected Answer() {
    }

    Answer(Question question, UUID authorId, String body) {
        this.id = UUID.randomUUID();
        this.question = question;
        this.authorId = authorId;
        this.body = body;
        this.createdAt = Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public Question getQuestion() {
        return question;
    }

    public UUID getAuthorId() {
        return authorId;
    }

    public String getBody() {
        return body;
    }

    public int getVoteCount() {
        return voteCount;
    }

    public boolean isHidden() {
        return hidden;
    }

    void setHidden(boolean hidden) {
        this.hidden = hidden;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
