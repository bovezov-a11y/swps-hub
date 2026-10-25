package com.studenthub.wellbeing;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface StudySessionRepository extends JpaRepository<StudySession, UUID> {

    /** A student's sessions that overlap {@code [from, to)}, with their course loaded. */
    @Query("""
            select s from StudySession s join fetch s.course
            where s.userId = :userId and s.endsAt >= :from and s.startsAt < :to
            order by s.startsAt
            """)
    List<StudySession> findForUser(UUID userId, Instant from, Instant to);

    boolean existsByUserIdAndExamEventId(UUID userId, UUID examEventId);
}
