package com.studenthub.course;

import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

public interface CourseRepository extends JpaRepository<Course, UUID>, JpaSpecificationExecutor<Course> {

    boolean existsByProgramIdAndCode(UUID programId, String code);

    boolean existsByProgramIdAndCodeAndIdNot(UUID programId, String code, UUID id);

    @Query("""
            select m.course.id as courseId, count(m) as materials
            from Material m
            where m.course.id in :courseIds
            group by m.course.id
            """)
    List<MaterialCount> countMaterials(Collection<UUID> courseIds);

    interface MaterialCount {
        UUID getCourseId();

        long getMaterials();
    }

    /**
     * Courses matching every given filter; a {@code null} filter is ignored.
     *
     * @param text           matched case-insensitively against the course code and name
     * @param enrolledUserId keeps only courses this user joined
     */
    static Specification<Course> search(String text, UUID programId, Integer studyYear, UUID enrolledUserId) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (programId != null) {
                predicates.add(cb.equal(root.get("programId"), programId));
            }
            if (studyYear != null) {
                predicates.add(cb.equal(root.get("studyYear"), studyYear));
            }
            if (text != null) {
                String pattern = "%" + escapeLike(text.toLowerCase(Locale.ROOT)) + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("name")), pattern, '\\'),
                        cb.like(cb.lower(root.get("code")), pattern, '\\')));
            }
            if (enrolledUserId != null) {
                Subquery<UUID> enrolled = query.subquery(UUID.class);
                Root<Enrollment> enrollment = enrolled.from(Enrollment.class);
                enrolled.select(enrollment.get("id").get("courseId"))
                        .where(cb.equal(enrollment.get("id").get("userId"), enrolledUserId));
                predicates.add(root.get("id").in(enrolled));
            }
            return cb.and(predicates.toArray(Predicate[]::new));
        };
    }

    private static String escapeLike(String value) {
        return value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
    }
}
