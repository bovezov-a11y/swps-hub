package com.studenthub.material;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "material_votes")
public class MaterialVote {

    @EmbeddedId
    private Id id;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected MaterialVote() {
    }

    public MaterialVote(UUID materialId, UUID userId) {
        this.id = new Id(materialId, userId);
        this.createdAt = Instant.now();
    }

    public Id getId() {
        return id;
    }

    @Embeddable
    public record Id(@Column(name = "material_id") UUID materialId, @Column(name = "user_id") UUID userId) {
    }
}
