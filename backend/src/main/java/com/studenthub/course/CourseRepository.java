package com.studenthub.course;

import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

public interface CourseRepository extends JpaRepository<Course, UUID>, JpaSpecificationExecutor<Course> {

    boolean existsByCodeAndSemester(String code, String semester);

    boolean existsByCodeAndSemesterAndIdNot(String code, String semester, UUID id);

    /**
     * Courses matching every given filter; a {@code null} filter is ignored.
     *
     * @param text           matched case-insensitively against the course code and name
     * @param enrolledUserId keeps only courses this user joined
     */
    static Specification<Course> search(String text, String semester, UUID enrolledUserId) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (semester != null) {
                predicates.add(cb.equal(root.get("semester"), semester));
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
