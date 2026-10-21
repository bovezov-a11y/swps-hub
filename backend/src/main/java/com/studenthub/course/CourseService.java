package com.studenthub.course;

import com.studenthub.auth.CurrentUser;
import com.studenthub.common.ConflictException;
import com.studenthub.common.ForbiddenException;
import com.studenthub.common.NotFoundException;
import com.studenthub.common.PageResponse;
import com.studenthub.course.CourseDtos.CourseDetail;
import com.studenthub.course.CourseDtos.CourseRequest;
import com.studenthub.course.CourseDtos.CourseSummary;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class CourseService {

    private static final int MAX_PAGE_SIZE = 50;

    private final CourseRepository courses;
    private final EnrollmentRepository enrollments;

    CourseService(CourseRepository courses, EnrollmentRepository enrollments) {
        this.courses = courses;
        this.enrollments = enrollments;
    }

    @Transactional(readOnly = true)
    PageResponse<CourseSummary> search(CurrentUser user, String text, String semester, boolean onlyMine, int page, int size) {
        var pageable = PageRequest.of(Math.max(page, 0), Math.clamp(size, 1, MAX_PAGE_SIZE),
                Sort.by(Sort.Order.desc("semester"), Sort.Order.asc("code")));
        Page<Course> result = courses.findAll(
                CourseRepository.search(blankToNull(text), blankToNull(semester), onlyMine ? user.id() : null), pageable);

        List<UUID> ids = result.getContent().stream().map(Course::getId).toList();
        Map<UUID, Long> memberCounts = ids.isEmpty() ? Map.of() : enrollments.countMembers(ids).stream()
                .collect(Collectors.toMap(EnrollmentRepository.MemberCount::getCourseId, EnrollmentRepository.MemberCount::getMembers));
        Set<UUID> enrolled = ids.isEmpty() ? Set.of() : enrollments.findEnrolledCourseIds(user.id(), ids);

        return PageResponse.of(result, course -> new CourseSummary(course.getId(), course.getCode(), course.getName(),
                course.getSemester(), course.getLecturer(), memberCounts.getOrDefault(course.getId(), 0L),
                enrolled.contains(course.getId())));
    }

    @Transactional(readOnly = true)
    CourseDetail get(CurrentUser user, UUID courseId) {
        return toDetail(user, require(courseId));
    }

    @Transactional
    CourseDetail create(CurrentUser user, CourseRequest request) {
        String code = normalizeCode(request.code());
        if (courses.existsByCodeAndSemester(code, request.semester())) {
            throw new ConflictException("Course %s already exists in %s".formatted(code, request.semester()));
        }
        Course course = courses.save(new Course(code, request.name().strip(), request.semester(),
                blankToNull(request.lecturer()), blankToNull(request.description()), user.id()));
        enrollments.save(new Enrollment(user.id(), course.getId()));
        return toDetail(user, course);
    }

    @Transactional
    CourseDetail update(CurrentUser user, UUID courseId, CourseRequest request) {
        Course course = require(courseId);
        if (!canEdit(user, course)) {
            throw new ForbiddenException("Only the course author or a moderator can edit this course");
        }
        String code = normalizeCode(request.code());
        if (courses.existsByCodeAndSemesterAndIdNot(code, request.semester(), courseId)) {
            throw new ConflictException("Course %s already exists in %s".formatted(code, request.semester()));
        }
        course.update(code, request.name().strip(), request.semester(),
                blankToNull(request.lecturer()), blankToNull(request.description()));
        return toDetail(user, course);
    }

    @Transactional
    void join(CurrentUser user, UUID courseId) {
        require(courseId);
        var id = new Enrollment.Id(user.id(), courseId);
        if (!enrollments.existsById(id)) {
            enrollments.save(new Enrollment(user.id(), courseId));
        }
    }

    @Transactional
    void leave(CurrentUser user, UUID courseId) {
        require(courseId);
        enrollments.deleteById(new Enrollment.Id(user.id(), courseId));
    }

    public Course require(UUID courseId) {
        return courses.findById(courseId).orElseThrow(() -> new NotFoundException("Course not found"));
    }

    public boolean isEnrolled(UUID userId, UUID courseId) {
        return enrollments.existsById(new Enrollment.Id(userId, courseId));
    }

    private CourseDetail toDetail(CurrentUser user, Course course) {
        long members = enrollments.countMembers(List.of(course.getId())).stream()
                .mapToLong(EnrollmentRepository.MemberCount::getMembers).sum();
        return new CourseDetail(course.getId(), course.getCode(), course.getName(), course.getSemester(),
                course.getLecturer(), course.getDescription(), members, isEnrolled(user.id(), course.getId()),
                canEdit(user, course), course.getCreatedAt());
    }

    private static boolean canEdit(CurrentUser user, Course course) {
        return course.getCreatedBy().equals(user.id()) || user.isModerator();
    }

    private static String normalizeCode(String code) {
        return code.strip().toUpperCase(Locale.ROOT);
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.strip();
    }
}
