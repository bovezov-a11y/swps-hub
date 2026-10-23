package com.studenthub.ai;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

/** A generated study aid, stored as JSON so every student opening the material reuses it. */
@Entity
@Table(name = "material_ai_results")
class MaterialAiResult {

    @EmbeddedId
    private Id id;

    @Column(nullable = false, columnDefinition = "text")
    private String content;

    @Column(nullable = false, length = 60)
    private String model;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected MaterialAiResult() {
    }

    MaterialAiResult(UUID materialId, String kind, String content, String model) {
        this.id = new Id(materialId, kind);
        this.content = content;
        this.model = model;
        this.createdAt = Instant.now();
    }

    String getContent() {
        return content;
    }

    @Embeddable
    record Id(@Column(name = "material_id") UUID materialId, @Column(name = "kind", length = 20) String kind) {
    }
}
