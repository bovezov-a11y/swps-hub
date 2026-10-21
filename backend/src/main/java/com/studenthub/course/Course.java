package com.studenthub.course;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "courses")
public class Course {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 20)
    private String code;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(nullable = false, length = 20)
    private String semester;

    @Column(length = 100)
    private String lecturer;

    @Column(length = 2000)
    private String description;

    @Column(name = "created_by", nullable = false, updatable = false)
    private UUID createdBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected Course() {
    }

    public Course(String code, String name, String semester, String lecturer, String description, UUID createdBy) {
        update(code, name, semester, lecturer, description);
        this.createdBy = createdBy;
        this.createdAt = Instant.now();
    }

    public void update(String code, String name, String semester, String lecturer, String description) {
        this.code = code;
        this.name = name;
        this.semester = semester;
        this.lecturer = lecturer;
        this.description = description;
    }

    public UUID getId() {
        return id;
    }

    public String getCode() {
        return code;
    }

    public String getName() {
        return name;
    }

    public String getSemester() {
        return semester;
    }

    public String getLecturer() {
        return lecturer;
    }

    public String getDescription() {
        return description;
    }

    public UUID getCreatedBy() {
        return createdBy;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
