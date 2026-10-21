package com.studenthub.program;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/programs")
class ProgramController {

    private final ProgramService programService;

    ProgramController(ProgramService programService) {
        this.programService = programService;
    }

    @GetMapping
    List<ProgramService.ProgramResponse> list() {
        return programService.list();
    }
}
