package com.studenthub.flashcard;

import com.studenthub.auth.CurrentUser;
import com.studenthub.common.ForbiddenException;
import com.studenthub.common.InvalidRequestException;
import com.studenthub.common.NotFoundException;
import com.studenthub.course.Course;
import com.studenthub.course.CourseService;
import com.studenthub.flashcard.SpacedRepetition.Grade;
import com.studenthub.flashcard.SpacedRepetition.Scheduled;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

/** Shared flashcard decks per course, studied with spaced repetition. Each student's progress is private. */
@Service
public class FlashcardService {

    private static final int MAX_CARDS_PER_DECK = 500;
    private static final int STUDY_BATCH = 20;
    private static final int NEW_CARDS_PER_BATCH = 10;

    private final FlashcardDeckRepository decks;
    private final FlashcardRepository cards;
    private final CardProgressRepository progress;
    private final CourseService courseService;
    private final JdbcClient jdbc;
    private final ZoneId zone;

    FlashcardService(FlashcardDeckRepository decks, FlashcardRepository cards, CardProgressRepository progress,
                     CourseService courseService, JdbcClient jdbc, @Value("${app.time-zone}") ZoneId zone) {
        this.decks = decks;
        this.cards = cards;
        this.progress = progress;
        this.courseService = courseService;
        this.jdbc = jdbc;
        this.zone = zone;
    }

    /** Decks of a course with how many of their cards the user should study now (due or never seen). */
    @Transactional(readOnly = true)
    List<DeckSummary> decks(CurrentUser user, UUID courseId) {
        courseService.require(courseId);
        return jdbc.sql("""
                        select d.id, d.title, d.description, d.created_by, d.source_material_id, d.created_at,
                               count(f.id) as cards,
                               count(f.id) filter (where p.card_id is null or p.due_at <= now()) as due
                        from flashcard_decks d
                        left join flashcards f on f.deck_id = d.id
                        left join flashcard_progress p on p.card_id = f.id and p.user_id = :userId
                        where d.course_id = :courseId
                        group by d.id
                        order by d.created_at desc
                        """)
                .param("userId", user.id())
                .param("courseId", courseId)
                .query((rs, row) -> new DeckSummary(rs.getObject("id", UUID.class), rs.getString("title"),
                        rs.getString("description"), rs.getInt("cards"), rs.getInt("due"),
                        user.id().equals(rs.getObject("created_by", UUID.class)),
                        rs.getObject("source_material_id", UUID.class) != null,
                        rs.getObject("created_at", OffsetDateTime.class).toInstant()))
                .list();
    }

    @Transactional(readOnly = true)
    DeckDetail deck(CurrentUser user, UUID deckId) {
        FlashcardDeck deck = requireDeck(deckId);
        Course course = deck.getCourse();
        List<CardView> cardViews = cards.findAllByDeckIdOrderByPosition(deckId).stream()
                .map(card -> new CardView(card.getId(), card.getFront(), card.getBack())).toList();
        return new DeckDetail(deck.getId(), deck.getTitle(), deck.getDescription(),
                new CourseRef(course.getId(), course.getCode(), course.getName()), cardViews,
                deck.getSourceMaterialId() != null, canEdit(user, deck));
    }

    @Transactional
    UUID createDeck(CurrentUser user, UUID courseId, String title, String description, List<CardInput> newCards) {
        Course course = courseService.require(courseId);
        validateCount(newCards.size());
        FlashcardDeck deck = decks.save(new FlashcardDeck(course, user.id(), title.strip(),
                description == null || description.isBlank() ? null : description.strip(), null));
        saveCards(deck.getId(), newCards, 0);
        return deck.getId();
    }

    @Transactional
    void addCards(CurrentUser user, UUID deckId, List<CardInput> newCards) {
        FlashcardDeck deck = requireDeck(deckId);
        if (!canEdit(user, deck)) {
            throw new ForbiddenException("Only the person who made the deck or a moderator can add cards");
        }
        int last = cards.findLastPosition(deckId);
        validateCount(last + 1 + newCards.size());
        saveCards(deckId, newCards, last + 1);
    }

    @Transactional
    void deleteDeck(CurrentUser user, UUID deckId) {
        FlashcardDeck deck = requireDeck(deckId);
        if (!canEdit(user, deck)) {
            throw new ForbiddenException("Only the person who made the deck or a moderator can delete it");
        }
        decks.delete(deck);
    }

    /** The next cards to study: due reviews first, then a few new cards so the queue never floods. */
    @Transactional(readOnly = true)
    List<StudyCard> studyQueue(CurrentUser user, UUID deckId) {
        requireDeck(deckId);
        List<StudyCard> queue = new ArrayList<>(jdbc.sql("""
                        select f.id, f.front, f.back
                        from flashcards f join flashcard_progress p on p.card_id = f.id and p.user_id = :userId
                        where f.deck_id = :deckId and p.due_at <= now()
                        order by p.due_at
                        limit :limit
                        """)
                .param("userId", user.id()).param("deckId", deckId).param("limit", STUDY_BATCH)
                .query((rs, row) -> new StudyCard(rs.getObject("id", UUID.class), rs.getString("front"),
                        rs.getString("back"), false))
                .list());
        int room = Math.min(NEW_CARDS_PER_BATCH, STUDY_BATCH - queue.size());
        if (room > 0) {
            queue.addAll(jdbc.sql("""
                            select f.id, f.front, f.back
                            from flashcards f
                            where f.deck_id = :deckId
                              and not exists (select 1 from flashcard_progress p
                                              where p.card_id = f.id and p.user_id = :userId)
                            order by f.position
                            limit :limit
                            """)
                    .param("userId", user.id()).param("deckId", deckId).param("limit", room)
                    .query((rs, row) -> new StudyCard(rs.getObject("id", UUID.class), rs.getString("front"),
                            rs.getString("back"), true))
                    .list());
        }
        return queue;
    }

    @Transactional
    ReviewResult review(CurrentUser user, UUID cardId, Grade grade) {
        cards.findById(cardId).orElseThrow(() -> new NotFoundException("Card not found"));
        Instant now = Instant.now();
        CardProgress cardProgress = progress.findById(new CardProgress.Id(user.id(), cardId))
                .orElseGet(() -> new CardProgress(user.id(), cardId));
        Scheduled scheduled = SpacedRepetition.review(cardProgress.state(), grade, now);
        cardProgress.apply(scheduled, now);
        progress.save(cardProgress);
        jdbc.sql("insert into flashcard_review_log (user_id, card_id, grade, reviewed_at) values (:u, :c, :g, :at)")
                .param("u", user.id()).param("c", cardId).param("g", grade.name())
                .param("at", OffsetDateTime.ofInstant(now, zone))
                .update();
        return new ReviewResult(scheduled.dueAt(), scheduled.state().intervalDays());
    }

    /** The student's own study stats across the courses they joined. */
    @Transactional(readOnly = true)
    LearningSummary summary(CurrentUser user) {
        int due = jdbc.sql("""
                        select count(*)
                        from flashcards f
                        join flashcard_decks d on d.id = f.deck_id
                        join enrollments e on e.course_id = d.course_id and e.user_id = :userId
                        left join flashcard_progress p on p.card_id = f.id and p.user_id = :userId
                        where p.card_id is null or p.due_at <= now()
                        """)
                .param("userId", user.id()).query(Integer.class).single();
        List<LocalDate> reviewDays = jdbc.sql("""
                        select distinct (reviewed_at at time zone :zone)::date as day
                        from flashcard_review_log where user_id = :userId
                        order by day desc
                        limit 400
                        """)
                .param("zone", zone.getId()).param("userId", user.id())
                .query((rs, row) -> rs.getObject("day", LocalDate.class)).list();
        LocalDate today = LocalDate.now(zone);
        int reviewedToday = jdbc.sql("""
                        select count(*) from flashcard_review_log
                        where user_id = :userId and reviewed_at >= :start
                        """)
                .param("userId", user.id())
                .param("start", today.atStartOfDay(zone).toOffsetDateTime())
                .query(Integer.class).single();
        return new LearningSummary(due, reviewedToday, streak(reviewDays, today));
    }

    /** Consecutive days with at least one review, ending today or yesterday (today may not be done yet). */
    static int streak(List<LocalDate> reviewDays, LocalDate today) {
        Set<LocalDate> days = new HashSet<>(reviewDays);
        LocalDate cursor = days.contains(today) ? today : today.minusDays(1);
        int streak = 0;
        while (days.contains(cursor)) {
            streak++;
            cursor = cursor.minusDays(1);
        }
        return streak;
    }

    /** Used by the AI tools: one generated deck per material, reused by everyone. */
    public Optional<UUID> deckForMaterial(UUID materialId) {
        return decks.findFirstBySourceMaterialId(materialId).map(FlashcardDeck::getId);
    }

    @Transactional
    public UUID createGeneratedDeck(UUID courseId, String title, UUID materialId, List<CardInput> newCards) {
        Course course = courseService.require(courseId);
        FlashcardDeck deck = decks.save(new FlashcardDeck(course, null, title,
                "Generated by AI from a shared material. Check important facts against the source.", materialId));
        saveCards(deck.getId(), newCards.subList(0, Math.min(newCards.size(), MAX_CARDS_PER_DECK)), 0);
        return deck.getId();
    }

    private void saveCards(UUID deckId, List<CardInput> newCards, int firstPosition) {
        List<Flashcard> toSave = new ArrayList<>();
        for (int i = 0; i < newCards.size(); i++) {
            CardInput input = newCards.get(i);
            toSave.add(new Flashcard(deckId, input.front().strip(), input.back().strip(), firstPosition + i));
        }
        cards.saveAll(toSave);
    }

    private static void validateCount(int count) {
        if (count < 1 || count > MAX_CARDS_PER_DECK) {
            throw new InvalidRequestException("cards", "a deck holds between 1 and " + MAX_CARDS_PER_DECK + " cards");
        }
    }

    private FlashcardDeck requireDeck(UUID deckId) {
        return decks.findWithCourseById(deckId).orElseThrow(() -> new NotFoundException("Deck not found"));
    }

    private static boolean canEdit(CurrentUser user, FlashcardDeck deck) {
        return user.id().equals(deck.getCreatedBy()) || user.isModerator();
    }

    public record CardInput(String front, String back) {
    }

    record CourseRef(UUID id, String code, String name) {
    }

    record DeckSummary(UUID id, String title, String description, int cardCount, int dueCount, boolean mine,
                       boolean aiGenerated, Instant createdAt) {
    }

    record DeckDetail(UUID id, String title, String description, CourseRef course, List<CardView> cards,
                      boolean aiGenerated, boolean canEdit) {
    }

    record CardView(UUID id, String front, String back) {
    }

    record StudyCard(UUID id, String front, String back, boolean isNew) {
    }

    record ReviewResult(Instant nextDueAt, int intervalDays) {
    }

    record LearningSummary(int dueCards, int reviewedToday, int streakDays) {
    }
}
