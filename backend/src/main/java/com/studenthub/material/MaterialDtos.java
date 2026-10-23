package com.studenthub.material;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.UUID;

final class MaterialDtos {

    private MaterialDtos() {
    }

    /** Metadata sent as form fields next to the uploaded file. */
    record MaterialForm(
            @NotNull MaterialType type,
            @NotBlank @Size(max = 200) String title,
            @Size(max = 2000) String description,
            @NotBlank @Pattern(regexp = "^\\d{4}/\\d{2}$", message = "must look like 2025/26") String academicYear) {
    }

    record Uploader(String displayName) {
    }

    record CourseRef(UUID id, String code, String name) {
    }

    record MaterialResponse(UUID id, CourseRef course, MaterialType type, String title, String description,
                            String academicYear, String fileName, String contentType, long fileSize, int voteCount,
                            boolean voted, Uploader uploader, boolean mine, Instant createdAt, boolean canDelete) {
    }
}
