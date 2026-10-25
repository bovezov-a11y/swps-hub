package com.studenthub.group;

import com.studenthub.auth.CurrentUser;
import com.studenthub.group.StudyGroupService.GroupRequest;
import com.studenthub.group.StudyGroupService.GroupResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
class StudyGroupController {

    private final StudyGroupService groups;

    StudyGroupController(StudyGroupService groups) {
        this.groups = groups;
    }

    @GetMapping("/api/courses/{courseId}/groups")
    List<GroupResponse> list(CurrentUser user, @PathVariable UUID courseId) {
        return groups.list(user, courseId);
    }

    @PostMapping("/api/courses/{courseId}/groups")
    @ResponseStatus(HttpStatus.CREATED)
    GroupResponse create(CurrentUser user, @PathVariable UUID courseId, @Valid @RequestBody CreateGroupRequest request) {
        return groups.create(user, courseId, new GroupRequest(request.name(), request.description(),
                request.meetingDetails(), request.capacity()));
    }

    @PutMapping("/api/groups/{groupId}/membership")
    GroupResponse join(CurrentUser user, @PathVariable UUID groupId) {
        return groups.join(user, groupId);
    }

    @DeleteMapping("/api/groups/{groupId}/membership")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void leave(CurrentUser user, @PathVariable UUID groupId) {
        groups.leave(user, groupId);
    }

    @DeleteMapping("/api/groups/{groupId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void delete(CurrentUser user, @PathVariable UUID groupId) {
        groups.delete(user, groupId);
    }

    record CreateGroupRequest(@NotBlank @Size(max = 100) String name, @Size(max = 1000) String description,
                              @Size(max = 300) String meetingDetails, @Min(2) @Max(50) int capacity) {
    }
}
