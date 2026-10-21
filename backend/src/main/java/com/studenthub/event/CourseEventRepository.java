package com.studenthub.event;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface CourseEventRepository extends JpaRepository<CourseEvent, UUID> {

    /** Events of one course that overlap the {@code [from, to)} range. */
    @Query("""
            select e from CourseEvent e
            where e.course.id = :courseId and e.endsAt >= :from and e.startsAt < :to
            order by e.startsAt
            """)
    List<CourseEvent> findForCourse(UUID courseId, Instant from, Instant to);

    /** Events of every course the user joined that overlap the {@code [from, to)} range, with their course loaded. */
    @Query("""
            select e from CourseEvent e join fetch e.course c
            where c.id in (select en.id.courseId from Enrollment en where en.id.userId = :userId)
              and e.endsAt >= :from and e.startsAt < :to
            order by e.startsAt
            """)
    List<CourseEvent> findForUser(UUID userId, Instant from, Instant to);
}
