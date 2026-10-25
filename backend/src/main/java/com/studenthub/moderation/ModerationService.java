package com.studenthub.moderation;

import com.studenthub.auth.CurrentUser;
import com.studenthub.common.ConflictException;
import com.studenthub.common.NotFoundException;
import com.studenthub.moderation.ModeratedContent.Summary;
import com.studenthub.moderation.ModerationAction.Kind;
import com.studenthub.user.User;
import com.studenthub.user.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.EnumMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
class ModerationService {

    private final ReportRepository reports;
    private final ModerationActionRepository actions;
    private final UserRepository users;
    private final Map<ContentType, ModeratedContent> contentByType;
    private final int autoHideThreshold;

    ModerationService(ReportRepository reports, ModerationActionRepository actions, UserRepository users,
                      List<ModeratedContent> contents,
                      @Value("${app.moderation.auto-hide-threshold}") int autoHideThreshold) {
        this.reports = reports;
        this.actions = actions;
        this.users = users;
        this.contentByType = new EnumMap<>(contents.stream()
                .collect(Collectors.toMap(ModeratedContent::type, Function.identity())));
        this.autoHideThreshold = autoHideThreshold;
    }

    /**
     * Records a report. Once enough students report the same content it is hidden until a moderator reviews it,
     * so harmful content disappears quickly even when no moderator is online.
     */
    @Transactional
    void report(CurrentUser user, ContentType type, UUID id, ReportReason reason, String details) {
        Summary summary = describe(type, id);
        if (reports.existsByTargetTypeAndTargetIdAndReporterId(type, id, user.id())) {
            throw new ConflictException("You have already reported this");
        }
        reports.save(new Report(type, id, user.id(), reason,
                details == null || details.isBlank() ? null : details.strip()));
        if (!summary.hidden() && reports.countOpen(type, id) >= autoHideThreshold) {
            content(type).setHidden(id, true);
            actions.save(new ModerationAction(null, type, id, Kind.AUTO_HIDE, describeForLog(summary)));
        }
    }

    /** Open reports grouped by the content they are about, oldest first. Reporters are never included. */
    @Transactional(readOnly = true)
    List<QueueItem> queue() {
        Map<String, List<Report>> grouped = new LinkedHashMap<>();
        for (Report report : reports.findOpen()) {
            grouped.computeIfAbsent(report.getTargetType() + ":" + report.getTargetId(), key -> new ArrayList<>())
                    .add(report);
        }
        List<QueueItem> items = new ArrayList<>();
        for (List<Report> group : grouped.values()) {
            Report first = group.getFirst();
            content(first.getTargetType()).describe(first.getTargetId()).ifPresent(summary -> {
                Map<ReportReason, Long> reasons = group.stream()
                        .collect(Collectors.groupingBy(Report::getReason, () -> new EnumMap<>(ReportReason.class),
                                Collectors.counting()));
                List<String> details = group.stream().map(Report::getDetails).filter(Objects::nonNull).toList();
                items.add(new QueueItem(first.getTargetType(), first.getTargetId(), summary, group.size(), reasons,
                        details, first.getCreatedAt()));
            });
        }
        return items;
    }

    @Transactional
    void hide(CurrentUser moderator, ContentType type, UUID id) {
        Summary summary = describe(type, id);
        content(type).setHidden(id, true);
        resolve(moderator, type, id, Kind.HIDE, summary);
    }

    /** Makes the content visible again and dismisses its reports. */
    @Transactional
    void restore(CurrentUser moderator, ContentType type, UUID id) {
        Summary summary = describe(type, id);
        content(type).setHidden(id, false);
        resolve(moderator, type, id, Kind.RESTORE, summary);
    }

    @Transactional
    void remove(CurrentUser moderator, ContentType type, UUID id) {
        Summary summary = describe(type, id);
        content(type).delete(id);
        resolve(moderator, type, id, Kind.DELETE, summary);
    }

    @Transactional(readOnly = true)
    List<LogEntry> log() {
        List<ModerationAction> recent = actions.findAllByOrderByCreatedAtDesc(PageRequest.of(0, 50));
        Map<UUID, String> moderatorNames = users.findAllById(recent.stream().map(ModerationAction::getModeratorId)
                        .filter(Objects::nonNull).distinct().toList())
                .stream().collect(Collectors.toMap(User::getId, User::getDisplayName));
        return recent.stream().map(action -> new LogEntry(action.getAction(), action.getTargetType(),
                action.getSummary(),
                action.getModeratorId() == null ? "Automatic" : moderatorNames.getOrDefault(action.getModeratorId(),
                        "Former moderator"),
                action.getCreatedAt())).toList();
    }

    private void resolve(CurrentUser moderator, ContentType type, UUID id, Kind kind, Summary summary) {
        reports.resolve(type, id, Instant.now());
        actions.save(new ModerationAction(moderator.id(), type, id, kind, describeForLog(summary)));
    }

    private Summary describe(ContentType type, UUID id) {
        return content(type).describe(id).orElseThrow(() -> new NotFoundException("Content not found"));
    }

    private ModeratedContent content(ContentType type) {
        ModeratedContent content = contentByType.get(type);
        if (content == null) {
            throw new IllegalStateException("No moderation support for " + type);
        }
        return content;
    }

    private static String describeForLog(Summary summary) {
        return summary.courseCode() + ": " + summary.title();
    }

    record QueueItem(ContentType type, UUID id, Summary content, int reportCount, Map<ReportReason, Long> reasons,
                     List<String> details, Instant firstReportedAt) {
    }

    record LogEntry(Kind action, ContentType type, String summary, String moderator, Instant at) {
    }
}
