package com.studenthub.program;

import com.studenthub.common.InvalidRequestException;
import com.studenthub.common.NotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class ProgramService {

    private final ProgramRepository programs;

    ProgramService(ProgramRepository programs) {
        this.programs = programs;
    }

    @Transactional(readOnly = true)
    List<ProgramResponse> list() {
        Map<UUID, Long> courseCounts = programs.countCourses().stream()
                .collect(Collectors.toMap(ProgramRepository.CourseCount::getProgramId, ProgramRepository.CourseCount::getCourses));
        return programs.findAllByOrderBySortOrder().stream()
                .map(program -> new ProgramResponse(program.getId(), program.getSlug(), program.getName(),
                        courseCounts.getOrDefault(program.getId(), 0L)))
                .toList();
    }

    public Program requireBySlug(String slug) {
        return programs.findBySlug(slug).orElseThrow(() -> new NotFoundException("Program not found"));
    }

    /** Looks up a program chosen in a form; an unknown id is a validation error on {@code programId}. */
    public Program requireForInput(UUID id) {
        return programs.findById(id).orElseThrow(() -> new InvalidRequestException("programId", "unknown program"));
    }

    /** All programs by id. There are only a handful, so callers can resolve references without joins. */
    public Map<UUID, Program> byId() {
        return programs.findAll().stream().collect(Collectors.toMap(Program::getId, Function.identity()));
    }

    record ProgramResponse(UUID id, String slug, String name, long courseCount) {
    }
}
