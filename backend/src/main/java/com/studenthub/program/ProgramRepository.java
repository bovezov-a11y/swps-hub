package com.studenthub.program;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProgramRepository extends JpaRepository<Program, UUID> {

    Optional<Program> findBySlug(String slug);

    List<Program> findAllByOrderBySortOrder();

    @Query("select c.programId as programId, count(c) as courses from Course c group by c.programId")
    List<CourseCount> countCourses();

    interface CourseCount {
        UUID getProgramId();

        long getCourses();
    }
}
