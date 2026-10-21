package com.studenthub.course;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

/**
 * A subject taught in a program, such as "Cognitive Psychology" in the second year of Psychology. It persists across
 * academic years, so events and materials from every year collect in one place.
 */
@Entity
@Table(name = "courses")
public class Course {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "program_id", nullable = false)
    private UUID programId;

    @Column(name = "study_year", nullable = false)
    private int studyYear;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private Term term;

    @Column(nullable = false, length = 20)
    private String code;

    @Column(nullable = false, length = 200)
    private String name;

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

    public Course(UUID programId, int studyYear, Term term, String code, String name, String lecturer,
                  String description, UUID createdBy) {
        update(programId, studyYear, term, code, name, lecturer, description);
        this.createdBy = createdBy;
        this.createdAt = Instant.now();
    }

    public void update(UUID programId, int studyYear, Term term, String code, String name, String lecturer,
                       String description) {
        this.programId = programId;
        this.studyYear = studyYear;
        this.term = term;
        this.code = code;
        this.name = name;
        this.lecturer = lecturer;
        this.description = description;
    }

    public UUID getId() {
        return id;
    }

    public UUID getProgramId() {
        return programId;
    }

    public int getStudyYear() {
        return studyYear;
    }

    public Term getTerm() {
        return term;
    }

    public String getCode() {
        return code;
    }

    public String getName() {
        return name;
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
