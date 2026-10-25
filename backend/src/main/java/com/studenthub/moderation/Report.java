package com.studenthub.moderation;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "reports")
class Report {

    @Id
    private UUID id;

    @Enumerated(EnumType.STRING)
    @Column(name = "target_type", nullable = false, length = 20)
    private ContentType targetType;

    @Column(name = "target_id", nullable = false)
    private UUID targetId;

    @Column(name = "reporter_id", nullable = false)
    private UUID reporterId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ReportReason reason;

    @Column(length = 1000)
    private String details;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "resolved_at")
    private Instant resolvedAt;

    protected Report() {
    }

    Report(ContentType targetType, UUID targetId, UUID reporterId, ReportReason reason, String details) {
        this.id = UUID.randomUUID();
        this.targetType = targetType;
        this.targetId = targetId;
        this.reporterId = reporterId;
        this.reason = reason;
        this.details = details;
        this.createdAt = Instant.now();
    }

    ContentType getTargetType() {
        return targetType;
    }

    UUID getTargetId() {
        return targetId;
    }

    ReportReason getReason() {
        return reason;
    }

    String getDetails() {
        return details;
    }

    Instant getCreatedAt() {
        return createdAt;
    }
}
