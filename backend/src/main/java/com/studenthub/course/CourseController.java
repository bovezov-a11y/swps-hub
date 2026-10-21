package com.studenthub.course;

import com.studenthub.auth.CurrentUser;
import com.studenthub.common.PageResponse;
import com.studenthub.course.CourseDtos.CourseDetail;
import com.studenthub.course.CourseDtos.CourseRequest;
import com.studenthub.course.CourseDtos.CourseSummary;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/courses")
class CourseController {

    private final CourseService courseService;

    CourseController(CourseService courseService) {
        this.courseService = courseService;
    }

    @GetMapping
    PageResponse<CourseSummary> search(CurrentUser user,
                                       @RequestParam(required = false) String q,
                                       @RequestParam(required = false) String semester,
                                       @RequestParam(defaultValue = "false") boolean mine,
                                       @RequestParam(defaultValue = "0") int page,
                                       @RequestParam(defaultValue = "20") int size) {
        return courseService.search(user, q, semester, mine, page, size);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    CourseDetail create(CurrentUser user, @Valid @RequestBody CourseRequest request) {
        return courseService.create(user, request);
    }

    @GetMapping("/{courseId}")
    CourseDetail get(CurrentUser user, @PathVariable UUID courseId) {
        return courseService.get(user, courseId);
    }

    @PutMapping("/{courseId}")
    CourseDetail update(CurrentUser user, @PathVariable UUID courseId, @Valid @RequestBody CourseRequest request) {
        return courseService.update(user, courseId, request);
    }

    /** Joins the course. Idempotent: joining twice has no further effect. */
    @PutMapping("/{courseId}/enrollment")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void join(CurrentUser user, @PathVariable UUID courseId) {
        courseService.join(user, courseId);
    }

    @DeleteMapping("/{courseId}/enrollment")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void leave(CurrentUser user, @PathVariable UUID courseId) {
        courseService.leave(user, courseId);
    }
}
