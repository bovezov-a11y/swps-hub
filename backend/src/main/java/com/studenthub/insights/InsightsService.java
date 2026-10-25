package com.studenthub.insights;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static java.time.DayOfWeek.MONDAY;

/**
 * Aggregate statistics for university staff. Nothing here identifies a student: results describe courses and
 * content, and any count of people below the minimum group size is withheld (returned as null).
 */
@Service
class InsightsService {

    private static final int HEATMAP_WEEKS = 12;
    private static final Duration CRUNCH_HORIZON = Duration.ofDays(30);
    private static final Duration CRUNCH_WINDOW = Duration.ofDays(7);
    private static final int CRUNCH_ASSESSMENTS = 3;

    private final JdbcClient jdbc;
    private final ZoneId zone;
    private final int minGroupSize;

    InsightsService(JdbcClient jdbc, @Value("${app.time-zone}") ZoneId zone,
                    @Value("${app.insights.min-group-size}") int minGroupSize) {
        this.jdbc = jdbc;
        this.zone = zone;
        this.minGroupSize = minGroupSize;
    }

    Insights insights() {
        Instant now = Instant.now();
        return new Insights(overview(now), programs(), assessmentHeatmap(), crunch(now), materialGaps(),
                topMaterials(), unansweredQuestions(), minGroupSize);
    }

    private Overview overview(Instant now) {
        return jdbc.sql("""
                        select (select count(*) from users where email_verified) as students,
                               (select count(*) from courses) as courses,
                               (select count(*) from materials where not hidden) as materials,
                               (select count(*) from course_events
                                 where type in ('EXAM', 'DEADLINE') and starts_at >= :now and starts_at < :until)
                                 as upcoming_assessments,
                               (select coalesce(sum(requests), 0) from ai_usage where day > current_date - 30)
                                 as ai_generations,
                               (select count(*) from flashcard_review_log where reviewed_at > :now - interval '30 days')
                                 as flashcard_reviews
                        """)
                .param("now", OffsetDateTime.ofInstant(now, zone))
                .param("until", OffsetDateTime.ofInstant(now.plus(CRUNCH_HORIZON), zone))
                .query((rs, row) -> new Overview(people(rs.getLong("students")), rs.getLong("courses"),
                        rs.getLong("materials"), rs.getLong("upcoming_assessments"), rs.getLong("ai_generations"),
                        rs.getLong("flashcard_reviews")))
                .single();
    }

    private List<ProgramStats> programs() {
        return jdbc.sql("""
                        select p.slug, p.name,
                               count(distinct c.id) as courses,
                               count(distinct m.id) as materials,
                               count(distinct e.user_id) as students
                        from programs p
                        left join courses c on c.program_id = p.id
                        left join materials m on m.course_id = c.id and not m.hidden
                        left join enrollments e on e.course_id = c.id
                        group by p.id, p.slug, p.name, p.sort_order
                        order by p.sort_order
                        """)
                .query((rs, row) -> new ProgramStats(rs.getString("slug"), rs.getString("name"),
                        rs.getLong("courses"), rs.getLong("materials"), people(rs.getLong("students"))))
                .list();
    }

    /** Exams and deadlines per program and week for the coming weeks; counts events, never people. */
    private Heatmap assessmentHeatmap() {
        LocalDate firstWeek = LocalDate.now(zone).with(TemporalAdjusters.previousOrSame(MONDAY));
        List<LocalDate> weeks = new ArrayList<>();
        for (int i = 0; i < HEATMAP_WEEKS; i++) {
            weeks.add(firstWeek.plusWeeks(i));
        }
        Map<String, long[]> countsBySlug = new LinkedHashMap<>();
        Map<String, String> names = new HashMap<>();
        jdbc.sql("select slug, name from programs order by sort_order")
                .query((rs, row) -> {
                    countsBySlug.put(rs.getString("slug"), new long[HEATMAP_WEEKS]);
                    names.put(rs.getString("slug"), rs.getString("name"));
                    return null;
                }).list();
        jdbc.sql("""
                        select p.slug, (e.starts_at at time zone :zone)::date as day
                        from course_events e
                        join courses c on c.id = e.course_id
                        join programs p on p.id = c.program_id
                        where e.type in ('EXAM', 'DEADLINE') and e.starts_at >= :from and e.starts_at < :to
                        """)
                .param("zone", zone.getId())
                .param("from", firstWeek.atStartOfDay(zone).toOffsetDateTime())
                .param("to", firstWeek.plusWeeks(HEATMAP_WEEKS).atStartOfDay(zone).toOffsetDateTime())
                .query((rs, row) -> {
                    LocalDate day = rs.getObject("day", LocalDate.class);
                    int week = (int) (java.time.temporal.ChronoUnit.WEEKS.between(firstWeek, day));
                    countsBySlug.get(rs.getString("slug"))[week]++;
                    return null;
                }).list();
        List<HeatmapRow> rows = countsBySlug.entrySet().stream()
                .map(entry -> new HeatmapRow(entry.getKey(), names.get(entry.getKey()),
                        java.util.Arrays.stream(entry.getValue()).boxed().toList()))
                .toList();
        return new Heatmap(weeks, rows);
    }

    /**
     * How many students face at least three exams or deadlines within a single week in the next month. The
     * per-student schedule is only used inside this method; only the totals leave it.
     */
    private Crunch crunch(Instant now) {
        Map<UUID, List<Instant>> byStudent = new HashMap<>();
        jdbc.sql("""
                        select en.user_id, e.starts_at
                        from course_events e
                        join enrollments en on en.course_id = e.course_id
                        where e.type in ('EXAM', 'DEADLINE') and e.starts_at >= :now and e.starts_at < :until
                        """)
                .param("now", OffsetDateTime.ofInstant(now, zone))
                .param("until", OffsetDateTime.ofInstant(now.plus(CRUNCH_HORIZON), zone))
                .query((rs, row) -> {
                    byStudent.computeIfAbsent(rs.getObject("user_id", UUID.class), id -> new ArrayList<>())
                            .add(rs.getObject("starts_at", OffsetDateTime.class).toInstant());
                    return null;
                }).list();
        long crunched = byStudent.values().stream().filter(InsightsService::hasCrunch).count();
        return new Crunch(people(byStudent.size()), people(crunched), CRUNCH_ASSESSMENTS,
                (int) CRUNCH_WINDOW.toDays());
    }

    private static boolean hasCrunch(List<Instant> assessments) {
        List<Instant> sorted = assessments.stream().sorted().toList();
        for (int start = 0; start + CRUNCH_ASSESSMENTS - 1 < sorted.size(); start++) {
            Instant last = sorted.get(start + CRUNCH_ASSESSMENTS - 1);
            if (Duration.between(sorted.get(start), last).compareTo(CRUNCH_WINDOW) <= 0) {
                return true;
            }
        }
        return false;
    }

    /** Busy courses with few shared materials: where the university or lecturers could help most. */
    private List<CourseGap> materialGaps() {
        return jdbc.sql("""
                        select c.id, c.code, c.name, p.name as program,
                               count(distinct e.user_id) as members, count(distinct m.id) as materials
                        from courses c
                        join programs p on p.id = c.program_id
                        left join enrollments e on e.course_id = c.id
                        left join materials m on m.course_id = c.id and not m.hidden
                        group by c.id, c.code, c.name, p.name
                        having count(distinct e.user_id) >= :minGroupSize
                        order by count(distinct m.id), count(distinct e.user_id) desc
                        limit 5
                        """)
                .param("minGroupSize", minGroupSize)
                .query((rs, row) -> new CourseGap(rs.getString("code"), rs.getString("name"),
                        rs.getString("program"), rs.getLong("members"), rs.getLong("materials")))
                .list();
    }

    private List<TopMaterial> topMaterials() {
        return jdbc.sql("""
                        select m.title, m.type, c.code, c.name, m.vote_count
                        from materials m join courses c on c.id = m.course_id
                        where not m.hidden
                        order by m.vote_count desc, m.created_at desc
                        limit 5
                        """)
                .query((rs, row) -> new TopMaterial(rs.getString("title"), rs.getString("type"),
                        rs.getString("code"), rs.getString("name"), rs.getInt("vote_count")))
                .list();
    }

    /** Courses where questions go unanswered: a sign students need more support there. */
    private List<CourseQuestions> unansweredQuestions() {
        return jdbc.sql("""
                        select c.code, c.name, count(*) as unanswered
                        from questions q join courses c on c.id = q.course_id
                        where not q.hidden
                          and not exists (select 1 from answers a where a.question_id = q.id and not a.hidden)
                        group by c.id, c.code, c.name
                        order by count(*) desc
                        limit 5
                        """)
                .query((rs, row) -> new CourseQuestions(rs.getString("code"), rs.getString("name"),
                        rs.getLong("unanswered")))
                .list();
    }

    /** Counts of people below the minimum group size are withheld so no one can be singled out. */
    private Long people(long count) {
        return count < minGroupSize ? null : count;
    }

    record Insights(Overview overview, List<ProgramStats> programs, Heatmap assessmentHeatmap, Crunch crunch,
                    List<CourseGap> materialGaps, List<TopMaterial> topMaterials,
                    List<CourseQuestions> unansweredQuestions, int minGroupSize) {
    }

    record Overview(Long students, long courses, long materials, long upcomingAssessments, long aiGenerations,
                    long flashcardReviews) {
    }

    record ProgramStats(String slug, String name, long courses, long materials, Long students) {
    }

    record Heatmap(List<LocalDate> weeks, List<HeatmapRow> rows) {
    }

    record HeatmapRow(String slug, String name, List<Long> counts) {
    }

    record Crunch(Long studentsWithAssessments, Long studentsInCrunch, int assessments, int days) {
    }

    record CourseGap(String code, String name, String program, long members, long materials) {
    }

    record TopMaterial(String title, String type, String courseCode, String courseName, int votes) {
    }

    record CourseQuestions(String code, String name, long unanswered) {
    }
}
