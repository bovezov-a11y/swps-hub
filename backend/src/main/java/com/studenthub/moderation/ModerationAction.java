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
@Table(name = "moderation_actions")
class ModerationAction {

    enum Kind {
        AUTO_HIDE,
        HIDE,
        RESTORE,
        DELETE
    }

    @Id
    private UUID id;

    /** Null for automatic actions. */
    @Column(name = "moderator_id")
    private UUID moderatorId;

    @Enumerated(EnumType.STRING)
    @Column(name = "target_type", nullable = false, length = 20)
    private ContentType targetType;

    @Column(name = "target_id", nullable = false)
    private UUID targetId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Kind action;

    @Column(nullable = false, length = 300)
    private String summary;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected ModerationAction() {
    }

    ModerationAction(UUID moderatorId, ContentType targetType, UUID targetId, Kind action, String summary) {
        this.id = UUID.randomUUID();
        this.moderatorId = moderatorId;
        this.targetType = targetType;
        this.targetId = targetId;
        this.action = action;
        this.summary = summary.length() > 300 ? summary.substring(0, 297) + "..." : summary;
        this.createdAt = Instant.now();
    }

    UUID getModeratorId() {
        return moderatorId;
    }

    ContentType getTargetType() {
        return targetType;
    }

    Kind getAction() {
        return action;
    }

    String getSummary() {
        return summary;
    }

    Instant getCreatedAt() {
        return createdAt;
    }
}
