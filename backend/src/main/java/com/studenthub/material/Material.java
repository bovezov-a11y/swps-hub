package com.studenthub.material;

import com.studenthub.course.Course;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

/** A file shared in a course: a past exam, notes, a summary and so on. */
@Entity
@Table(name = "materials")
public class Material {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "course_id", nullable = false, updatable = false)
    private Course course;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private MaterialType type;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(length = 2000)
    private String description;

    @Column(name = "academic_year", nullable = false, length = 7)
    private String academicYear;

    @Column(name = "file_key", nullable = false, unique = true, length = 100, updatable = false)
    private String fileKey;

    @Column(name = "file_name", nullable = false)
    private String fileName;

    @Column(name = "content_type", nullable = false, length = 100)
    private String contentType;

    @Column(name = "file_size", nullable = false)
    private long fileSize;

    @Column(name = "vote_count", nullable = false)
    private int voteCount;

    /** Hidden by moderators, or automatically after several reports. Only the uploader and moderators see it. */
    @Column(nullable = false)
    private boolean hidden;

    @Column(name = "uploaded_by", nullable = false, updatable = false)
    private UUID uploadedBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected Material() {
    }

    /** The id is assigned up front because it doubles as the storage key of the file. */
    public Material(UUID id, Course course, MaterialType type, String title, String description, String academicYear,
                    String fileName, String contentType, long fileSize, UUID uploadedBy) {
        this.id = id;
        this.course = course;
        this.type = type;
        this.title = title;
        this.description = description;
        this.academicYear = academicYear;
        this.fileKey = id.toString();
        this.fileName = fileName;
        this.contentType = contentType;
        this.fileSize = fileSize;
        this.uploadedBy = uploadedBy;
        this.createdAt = Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public Course getCourse() {
        return course;
    }

    public MaterialType getType() {
        return type;
    }

    public String getTitle() {
        return title;
    }

    public String getDescription() {
        return description;
    }

    public String getAcademicYear() {
        return academicYear;
    }

    public String getFileKey() {
        return fileKey;
    }

    public String getFileName() {
        return fileName;
    }

    public String getContentType() {
        return contentType;
    }

    public long getFileSize() {
        return fileSize;
    }

    public int getVoteCount() {
        return voteCount;
    }

    public boolean isHidden() {
        return hidden;
    }

    public void setHidden(boolean hidden) {
        this.hidden = hidden;
    }

    public UUID getUploadedBy() {
        return uploadedBy;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
