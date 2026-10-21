package com.studenthub.course;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.UUID;

final class CourseDtos {

    static final String SEMESTER_PATTERN = "^\\d{4}/\\d{2} (Winter|Summer)$";

    private CourseDtos() {
    }

    record CourseRequest(
            @NotBlank @Size(max = 20) String code,
            @NotBlank @Size(max = 200) String name,
            @NotBlank @Pattern(regexp = SEMESTER_PATTERN, message = "must look like 2026/27 Winter") String semester,
            @Size(max = 100) String lecturer,
            @Size(max = 2000) String description) {
    }

    record CourseSummary(UUID id, String code, String name, String semester, String lecturer,
                         long memberCount, boolean enrolled) {
    }

    record CourseDetail(UUID id, String code, String name, String semester, String lecturer, String description,
                        long memberCount, boolean enrolled, boolean canEdit, Instant createdAt) {
    }
}
