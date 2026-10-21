package com.studenthub.course;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Collection;
import java.util.List;
import java.util.Set;
import java.util.UUID;

public interface EnrollmentRepository extends JpaRepository<Enrollment, Enrollment.Id> {

    @Query("""
            select e.id.courseId as courseId, count(e) as members
            from Enrollment e
            where e.id.courseId in :courseIds
            group by e.id.courseId
            """)
    List<MemberCount> countMembers(Collection<UUID> courseIds);

    @Query("select e.id.courseId from Enrollment e where e.id.userId = :userId and e.id.courseId in :courseIds")
    Set<UUID> findEnrolledCourseIds(UUID userId, Collection<UUID> courseIds);

    interface MemberCount {
        UUID getCourseId();

        long getMembers();
    }
}
