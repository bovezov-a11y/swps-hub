package com.studenthub.course;

import com.studenthub.program.ProgramRef;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.UUID;

final class CourseDtos {

    private CourseDtos() {
    }

    record CourseRequest(
            @NotNull UUID programId,
            @NotNull @Min(1) @Max(5) Integer studyYear,
            @NotNull Term term,
            @NotBlank @Size(max = 20) String code,
            @NotBlank @Size(max = 200) String name,
            @Size(max = 100) String lecturer,
            @Size(max = 2000) String description) {
    }

    record CourseSummary(UUID id, String code, String name, ProgramRef program, int studyYear, Term term,
                         String lecturer, long memberCount, long materialCount, boolean enrolled) {
    }

    record CourseDetail(UUID id, String code, String name, ProgramRef program, int studyYear, Term term,
                        String lecturer, String description, long memberCount, long materialCount,
                        boolean enrolled, boolean canEdit, Instant createdAt) {
    }
}
