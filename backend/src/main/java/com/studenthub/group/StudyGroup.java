package com.studenthub.group;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "study_groups")
class StudyGroup {

    @Id
    private UUID id;

    @Column(name = "course_id", nullable = false, updatable = false)
    private UUID courseId;

    @Column(name = "created_by", nullable = false, updatable = false)
    private UUID createdBy;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(length = 1000)
    private String description;

    /** Where and when the group meets, or an online link. Shown to members only. */
    @Column(name = "meeting_details", length = 300)
    private String meetingDetails;

    @Column(nullable = false)
    private int capacity;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected StudyGroup() {
    }

    StudyGroup(UUID courseId, UUID createdBy, String name, String description, String meetingDetails, int capacity) {
        this.id = UUID.randomUUID();
        this.courseId = courseId;
        this.createdBy = createdBy;
        this.name = name;
        this.description = description;
        this.meetingDetails = meetingDetails;
        this.capacity = capacity;
        this.createdAt = Instant.now();
    }

    UUID getId() {
        return id;
    }

    UUID getCourseId() {
        return courseId;
    }

    UUID getCreatedBy() {
        return createdBy;
    }

    String getName() {
        return name;
    }

    String getDescription() {
        return description;
    }

    String getMeetingDetails() {
        return meetingDetails;
    }

    int getCapacity() {
        return capacity;
    }

    Instant getCreatedAt() {
        return createdAt;
    }
}
