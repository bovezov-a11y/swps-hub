package com.studenthub.qa;

import com.studenthub.course.Course;
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
@Table(name = "questions")
public class Question {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "course_id", nullable = false, updatable = false)
    private Course course;

    @Column(name = "author_id", nullable = false, updatable = false)
    private UUID authorId;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, length = 5000)
    private String body;

    @Column(name = "vote_count", nullable = false)
    private int voteCount;

    @Column(name = "accepted_answer_id")
    private UUID acceptedAnswerId;

    @Column(nullable = false)
    private boolean hidden;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected Question() {
    }

    Question(Course course, UUID authorId, String title, String body) {
        this.id = UUID.randomUUID();
        this.course = course;
        this.authorId = authorId;
        this.title = title;
        this.body = body;
        this.createdAt = Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public Course getCourse() {
        return course;
    }

    public UUID getAuthorId() {
        return authorId;
    }

    public String getTitle() {
        return title;
    }

    public String getBody() {
        return body;
    }

    public int getVoteCount() {
        return voteCount;
    }

    public UUID getAcceptedAnswerId() {
        return acceptedAnswerId;
    }

    void setAcceptedAnswerId(UUID acceptedAnswerId) {
        this.acceptedAnswerId = acceptedAnswerId;
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
