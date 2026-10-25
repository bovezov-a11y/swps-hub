package com.studenthub.wellbeing;

import com.studenthub.auth.CurrentUser;
import com.studenthub.wellbeing.WellbeingService.SessionResponse;
import com.studenthub.wellbeing.WellbeingService.Workload;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
class WellbeingController {

    private final WellbeingService wellbeing;

    WellbeingController(WellbeingService wellbeing) {
        this.wellbeing = wellbeing;
    }

    @GetMapping("/api/me/workload")
    Workload workload(CurrentUser user, @RequestParam(defaultValue = "16") int weeks) {
        return wellbeing.workload(user, Math.clamp(weeks, 1, 26));
    }

    @PostMapping("/api/me/study-plans")
    @ResponseStatus(HttpStatus.CREATED)
    List<SessionResponse> createStudyPlan(CurrentUser user, @Valid @RequestBody StudyPlanRequest request) {
        return wellbeing.createStudyPlan(user, request.examEventId());
    }

    @DeleteMapping("/api/me/study-sessions/{sessionId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void deleteSession(CurrentUser user, @PathVariable UUID sessionId) {
        wellbeing.deleteSession(user, sessionId);
    }

    record StudyPlanRequest(@NotNull UUID examEventId) {
    }
}
