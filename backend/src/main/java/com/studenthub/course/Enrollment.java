package com.studenthub.course;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "enrollments")
public class Enrollment {

    @EmbeddedId
    private Id id;

    @Column(name = "joined_at", nullable = false, updatable = false)
    private Instant joinedAt;

    protected Enrollment() {
    }

    public Enrollment(UUID userId, UUID courseId) {
        this.id = new Id(userId, courseId);
        this.joinedAt = Instant.now();
    }

    public Id getId() {
        return id;
    }

    public Instant getJoinedAt() {
        return joinedAt;
    }

    @Embeddable
    public record Id(@Column(name = "user_id") UUID userId, @Column(name = "course_id") UUID courseId) {
    }
}
