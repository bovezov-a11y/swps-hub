package com.studenthub.wellbeing;

import com.studenthub.auth.CurrentUser;
import com.studenthub.common.ConflictException;
import com.studenthub.common.ForbiddenException;
import com.studenthub.common.InvalidRequestException;
import com.studenthub.common.NotFoundException;
import com.studenthub.course.CourseService;
import com.studenthub.event.CourseEvent;
import com.studenthub.event.CourseEventRepository;
import com.studenthub.event.EventType;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.UUID;

import static java.time.DayOfWeek.MONDAY;

/**
 * Helps students see heavy weeks coming and spread their revision. Everything here is about the requesting student
 * only, and nothing about how a student feels is stored.
 */
@Service
class WellbeingService {

    static final int CRUNCH_ASSESSMENTS = 3;
    static final int CRUNCH_DAYS = 7;
    /** Days before an exam that get a study session: spaced practice beats cramming the night before. */
    private static final int[] PLAN_DAYS_BEFORE = {7, 4, 2, 1};
    private static final LocalTime SESSION_START = LocalTime.of(18, 0);
    private static final Duration SESSION_LENGTH = Duration.ofMinutes(60);

    private final CourseEventRepository events;
    private final StudySessionRepository sessions;
    private final CourseService courseService;
    private final ZoneId zone;

    WellbeingService(CourseEventRepository events, StudySessionRepository sessions, CourseService courseService,
                     @Value("${app.time-zone}") ZoneId zone) {
        this.events = events;
        this.sessions = sessions;
        this.courseService = courseService;
        this.zone = zone;
    }

    /**
     * Exams and deadlines per day from this week's Monday, and the stretches where at least three of them fall
     * within a week ("crunches").
     */
    @Transactional(readOnly = true)
    Workload workload(CurrentUser user, int weeks) {
        LocalDate today = LocalDate.now(zone);
        LocalDate from = today.with(TemporalAdjusters.previousOrSame(MONDAY));
        LocalDate to = from.plusWeeks(weeks);
        List<CourseEvent> assessments = events.findForUser(user.id(), from.atStartOfDay(zone).toInstant(),
                        to.atStartOfDay(zone).toInstant()).stream()
                .filter(event -> event.getType() == EventType.EXAM || event.getType() == EventType.DEADLINE)
                .toList();

        Map<LocalDate, List<Assessment>> byDay = new TreeMap<>();
        for (LocalDate day = from; day.isBefore(to); day = day.plusDays(1)) {
            byDay.put(day, new ArrayList<>());
        }
        List<Assessment> upcoming = new ArrayList<>();
        for (CourseEvent event : assessments) {
            Assessment assessment = new Assessment(event.getId(), event.getType(), event.getTitle(),
                    event.getCourse().getCode(), event.getStartsAt(),
                    sessions.existsByUserIdAndExamEventId(user.id(), event.getId()));
            byDay.get(LocalDate.ofInstant(event.getStartsAt(), zone)).add(assessment);
            if (!LocalDate.ofInstant(event.getStartsAt(), zone).isBefore(today)) {
                upcoming.add(assessment);
            }
        }
        List<Day> days = byDay.entrySet().stream()
                .map(entry -> new Day(entry.getKey(), entry.getValue().size(), entry.getValue())).toList();
        return new Workload(days, crunches(upcoming), CRUNCH_ASSESSMENTS, CRUNCH_DAYS);
    }

    /** Merges overlapping week-long windows with three or more assessments into continuous periods. */
    private List<Crunch> crunches(List<Assessment> upcoming) {
        List<Crunch> result = new ArrayList<>();
        List<Assessment> current = new ArrayList<>();
        for (int start = 0; start + CRUNCH_ASSESSMENTS - 1 < upcoming.size(); start++) {
            Assessment first = upcoming.get(start);
            Assessment last = upcoming.get(start + CRUNCH_ASSESSMENTS - 1);
            if (ChronoUnit.DAYS.between(LocalDate.ofInstant(first.startsAt(), zone),
                    LocalDate.ofInstant(last.startsAt(), zone)) >= CRUNCH_DAYS) {
                continue;
            }
            List<Assessment> window = upcoming.subList(start, start + CRUNCH_ASSESSMENTS);
            if (!current.isEmpty() && current.contains(window.getFirst())) {
                window.stream().filter(item -> !current.contains(item)).forEach(current::add);
            } else {
                if (!current.isEmpty()) {
                    result.add(toCrunch(current));
                }
                current.clear();
                current.addAll(window);
            }
        }
        if (!current.isEmpty()) {
            result.add(toCrunch(current));
        }
        return result;
    }

    private Crunch toCrunch(List<Assessment> assessments) {
        return new Crunch(LocalDate.ofInstant(assessments.getFirst().startsAt(), zone),
                LocalDate.ofInstant(assessments.getLast().startsAt(), zone), List.copyOf(assessments));
    }

    /** Adds evening study sessions 7, 4, 2 and 1 days before an exam or deadline, skipping days already past. */
    @Transactional
    List<SessionResponse> createStudyPlan(CurrentUser user, UUID examEventId) {
        CourseEvent exam = events.findById(examEventId).orElseThrow(() -> new NotFoundException("Event not found"));
        if (exam.getType() != EventType.EXAM && exam.getType() != EventType.DEADLINE) {
            throw new InvalidRequestException("examEventId", "study plans are for exams and deadlines");
        }
        if (!courseService.isEnrolled(user.id(), exam.getCourse().getId())) {
            throw new ForbiddenException("Join the course to plan for its exams");
        }
        if (sessions.existsByUserIdAndExamEventId(user.id(), examEventId)) {
            throw new ConflictException("You already have a study plan for this");
        }

        Instant now = Instant.now();
        LocalDate examDay = LocalDate.ofInstant(exam.getStartsAt(), zone);
        List<StudySession> planned = new ArrayList<>();
        for (int daysBefore : PLAN_DAYS_BEFORE) {
            Instant start = examDay.minusDays(daysBefore).atTime(SESSION_START).atZone(zone).toInstant();
            if (start.isAfter(now)) {
                planned.add(new StudySession(user.id(), exam.getCourse(), exam.getId(),
                        "Study: " + exam.getTitle(), start, start.plus(SESSION_LENGTH)));
            }
        }
        if (planned.isEmpty()) {
            throw new InvalidRequestException("examEventId", "this is too soon to plan sessions before it");
        }
        return sessions.saveAll(planned).stream().map(SessionResponse::from).toList();
    }

    @Transactional
    void deleteSession(CurrentUser user, UUID sessionId) {
        StudySession session = sessions.findById(sessionId)
                .filter(found -> found.getUserId().equals(user.id()))
                .orElseThrow(() -> new NotFoundException("Study session not found"));
        sessions.delete(session);
    }

    record Workload(List<Day> days, List<Crunch> crunches, int crunchAssessments, int crunchDays) {
    }

    record Day(LocalDate date, int count, List<Assessment> assessments) {
    }

    record Assessment(UUID eventId, EventType type, String title, String courseCode, Instant startsAt,
                      boolean planned) {
    }

    record Crunch(LocalDate from, LocalDate to, List<Assessment> assessments) {
    }

    record SessionResponse(UUID id, String title, Instant startsAt, Instant endsAt) {

        static SessionResponse from(StudySession session) {
            return new SessionResponse(session.getId(), session.getTitle(), session.getStartsAt(), session.getEndsAt());
        }
    }
}
