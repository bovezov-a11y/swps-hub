package com.studenthub.event;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.UUID;

final class EventDtos {

    private EventDtos() {
    }

    /**
     * @param repeatWeeks creates the event this many times, one week apart (for weekly classes); defaults to once
     */
    record EventRequest(
            @NotNull EventType type,
            @NotBlank @Size(max = 200) String title,
            @NotNull Instant startsAt,
            @NotNull Instant endsAt,
            @Size(max = 200) String location,
            @Min(1) @Max(20) Integer repeatWeeks) {
    }

    record EventResponse(UUID id, UUID courseId, EventType type, String title, Instant startsAt, Instant endsAt,
                         String location, boolean canDelete) {
    }
}
