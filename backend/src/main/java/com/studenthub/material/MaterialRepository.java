package com.studenthub.material;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.UUID;

public interface MaterialRepository extends JpaRepository<Material, UUID> {

    @Query("""
            select m from Material m
            where m.course.id = :courseId
              and (:type is null or m.type = :type)
              and (:academicYear is null or m.academicYear = :academicYear)
            """)
    List<Material> findForCourse(UUID courseId, MaterialType type, String academicYear, Pageable pageable);

    /** Newest materials across every course the user joined, with their course loaded. */
    @Query("""
            select m from Material m join fetch m.course c
            where c.id in (select en.id.courseId from Enrollment en where en.id.userId = :userId)
            order by m.createdAt desc
            """)
    List<Material> findLatestForUser(UUID userId, Pageable pageable);

    // Counter updates run in the database so concurrent votes cannot overwrite each other.
    @Modifying(clearAutomatically = true)
    @Query("update Material m set m.voteCount = m.voteCount + :delta where m.id = :id")
    void adjustVoteCount(UUID id, int delta);
}
