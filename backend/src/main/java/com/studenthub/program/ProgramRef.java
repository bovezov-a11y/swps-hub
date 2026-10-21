package com.studenthub.program;

import java.util.UUID;

public record ProgramRef(UUID id, String slug, String name) {

    public static ProgramRef from(Program program) {
        return new ProgramRef(program.getId(), program.getSlug(), program.getName());
    }
}
