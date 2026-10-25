package com.studenthub.moderation;

import com.studenthub.auth.CurrentUser;
import com.studenthub.moderation.ModerationService.LogEntry;
import com.studenthub.moderation.ModerationService.QueueItem;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

/** Reporting is open to every student; everything under /api/moderation needs the moderator or admin role. */
@RestController
class ModerationController {

    private final ModerationService moderation;

    ModerationController(ModerationService moderation) {
        this.moderation = moderation;
    }

    @PostMapping("/api/reports")
    @ResponseStatus(HttpStatus.CREATED)
    void report(CurrentUser user, @Valid @RequestBody ReportRequest request) {
        moderation.report(user, request.targetType(), request.targetId(), request.reason(), request.details());
    }

    @GetMapping("/api/moderation/queue")
    List<QueueItem> queue() {
        return moderation.queue();
    }

    @PostMapping("/api/moderation/{type}/{id}/hide")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void hide(CurrentUser moderator, @PathVariable ContentType type, @PathVariable UUID id) {
        moderation.hide(moderator, type, id);
    }

    @PostMapping("/api/moderation/{type}/{id}/restore")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void restore(CurrentUser moderator, @PathVariable ContentType type, @PathVariable UUID id) {
        moderation.restore(moderator, type, id);
    }

    @DeleteMapping("/api/moderation/{type}/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void remove(CurrentUser moderator, @PathVariable ContentType type, @PathVariable UUID id) {
        moderation.remove(moderator, type, id);
    }

    @GetMapping("/api/moderation/log")
    List<LogEntry> log() {
        return moderation.log();
    }

    record ReportRequest(@NotNull ContentType targetType, @NotNull UUID targetId, @NotNull ReportReason reason,
                         @Size(max = 1000) String details) {
    }
}
