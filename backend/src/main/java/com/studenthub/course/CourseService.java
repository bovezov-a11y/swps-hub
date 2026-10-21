package com.studenthub.course;

import com.studenthub.auth.CurrentUser;
import com.studenthub.common.ConflictException;
import com.studenthub.common.ForbiddenException;
import com.studenthub.common.NotFoundException;
import com.studenthub.common.PageResponse;
import com.studenthub.course.CourseDtos.CourseDetail;
import com.studenthub.course.CourseDtos.CourseRequest;
import com.studenthub.course.CourseDtos.CourseSummary;
import com.studenthub.program.Program;
import com.studenthub.program.ProgramRef;
import com.studenthub.program.ProgramService;
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

    private static final int MAX_PAGE_SIZE = 100;

    private final CourseRepository courses;
    private final EnrollmentRepository enrollments;
    private final ProgramService programService;

    CourseService(CourseRepository courses, EnrollmentRepository enrollments, ProgramService programService) {
        this.courses = courses;
        this.enrollments = enrollments;
        this.programService = programService;
    }

    @Transactional(readOnly = true)
    PageResponse<CourseSummary> search(CurrentUser user, String text, String programSlug, Integer studyYear,
                                       boolean onlyMine, int page, int size) {
        UUID programId = isBlank(programSlug) ? null : programService.requireBySlug(programSlug).getId();
        var pageable = PageRequest.of(Math.max(page, 0), Math.clamp(size, 1, MAX_PAGE_SIZE),
                Sort.by("studyYear", "term", "name"));
        Page<Course> result = courses.findAll(
                CourseRepository.search(blankToNull(text), programId, studyYear, onlyMine ? user.id() : null), pageable);

        List<UUID> ids = result.getContent().stream().map(Course::getId).toList();
        Counts counts = counts(user, ids);
        Map<UUID, Program> programs = programService.byId();
        return PageResponse.of(result, course -> new CourseSummary(course.getId(), course.getCode(), course.getName(),
                ProgramRef.from(programs.get(course.getProgramId())), course.getStudyYear(), course.getTerm(),
                course.getLecturer(), counts.members(course.getId()), counts.materials(course.getId()),
                counts.enrolled().contains(course.getId())));
    }

    @Transactional(readOnly = true)
    CourseDetail get(CurrentUser user, UUID courseId) {
        return toDetail(user, require(courseId));
    }

    @Transactional
    CourseDetail create(CurrentUser user, CourseRequest request) {
        Program program = programService.requireForInput(request.programId());
        String code = normalizeCode(request.code());
        if (courses.existsByProgramIdAndCode(program.getId(), code)) {
            throw new ConflictException("%s already has a course with code %s".formatted(program.getName(), code));
        }
        Course course = courses.save(new Course(program.getId(), request.studyYear(), request.term(), code,
                request.name().strip(), blankToNull(request.lecturer()), blankToNull(request.description()), user.id()));
        enrollments.save(new Enrollment(user.id(), course.getId()));
        return toDetail(user, course);
    }

    @Transactional
    CourseDetail update(CurrentUser user, UUID courseId, CourseRequest request) {
        Course course = require(courseId);
        if (!canEdit(user, course)) {
            throw new ForbiddenException("Only the course author or a moderator can edit this course");
        }
        Program program = programService.requireForInput(request.programId());
        String code = normalizeCode(request.code());
        if (courses.existsByProgramIdAndCodeAndIdNot(program.getId(), code, courseId)) {
            throw new ConflictException("%s already has a course with code %s".formatted(program.getName(), code));
        }
        course.update(program.getId(), request.studyYear(), request.term(), code, request.name().strip(),
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
        Counts counts = counts(user, List.of(course.getId()));
        Program program = programService.byId().get(course.getProgramId());
        return new CourseDetail(course.getId(), course.getCode(), course.getName(), ProgramRef.from(program),
                course.getStudyYear(), course.getTerm(), course.getLecturer(), course.getDescription(),
                counts.members(course.getId()), counts.materials(course.getId()),
                counts.enrolled().contains(course.getId()), canEdit(user, course), course.getCreatedAt());
    }

    private Counts counts(CurrentUser user, List<UUID> courseIds) {
        if (courseIds.isEmpty()) {
            return new Counts(Map.of(), Map.of(), Set.of());
        }
        return new Counts(
                enrollments.countMembers(courseIds).stream().collect(Collectors.toMap(
                        EnrollmentRepository.MemberCount::getCourseId, EnrollmentRepository.MemberCount::getMembers)),
                courses.countMaterials(courseIds).stream().collect(Collectors.toMap(
                        CourseRepository.MaterialCount::getCourseId, CourseRepository.MaterialCount::getMaterials)),
                enrollments.findEnrolledCourseIds(user.id(), courseIds));
    }

    private record Counts(Map<UUID, Long> memberCounts, Map<UUID, Long> materialCounts, Set<UUID> enrolled) {

        long members(UUID courseId) {
            return memberCounts.getOrDefault(courseId, 0L);
        }

        long materials(UUID courseId) {
            return materialCounts.getOrDefault(courseId, 0L);
        }
    }

    private static boolean canEdit(CurrentUser user, Course course) {
        return course.getCreatedBy().equals(user.id()) || user.isModerator();
    }

    private static String normalizeCode(String code) {
        return code.strip().toUpperCase(Locale.ROOT);
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private static String blankToNull(String value) {
        return isBlank(value) ? null : value.strip();
    }
}
