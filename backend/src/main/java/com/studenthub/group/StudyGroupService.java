package com.studenthub.group;

import com.studenthub.auth.CurrentUser;
import com.studenthub.common.ConflictException;
import com.studenthub.common.ForbiddenException;
import com.studenthub.common.NotFoundException;
import com.studenthub.course.CourseService;
import com.studenthub.user.User;
import com.studenthub.user.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Study groups inside a course. Joining is how students choose to be seen: members see each other's names and the
 * meeting details, while everyone else only sees the group and how full it is.
 */
@Service
class StudyGroupService {

    private final StudyGroupRepository groups;
    private final CourseService courseService;
    private final UserRepository users;

    StudyGroupService(StudyGroupRepository groups, CourseService courseService, UserRepository users) {
        this.groups = groups;
        this.courseService = courseService;
        this.users = users;
    }

    @Transactional(readOnly = true)
    List<GroupResponse> list(CurrentUser user, UUID courseId) {
        courseService.require(courseId);
        return groups.findAllByCourseIdOrderByCreatedAt(courseId).stream().map(group -> toResponse(user, group))
                .toList();
    }

    @Transactional
    GroupResponse create(CurrentUser user, UUID courseId, GroupRequest request) {
        courseService.require(courseId);
        requireEnrolled(user, courseId);
        StudyGroup group = groups.save(new StudyGroup(courseId, user.id(), request.name().strip(),
                blankToNull(request.description()), blankToNull(request.meetingDetails()), request.capacity()));
        groups.addMember(group.getId(), user.id());
        return toResponse(user, group);
    }

    /** Joins the group. The group row is locked while counting, so two students cannot take the last seat. */
    @Transactional
    GroupResponse join(CurrentUser user, UUID groupId) {
        StudyGroup group = groups.findForUpdate(groupId)
                .orElseThrow(() -> new NotFoundException("Study group not found"));
        requireEnrolled(user, group.getCourseId());
        List<UUID> members = groups.findMemberIds(groupId);
        if (!members.contains(user.id())) {
            if (members.size() >= group.getCapacity()) {
                throw new ConflictException("This group is full");
            }
            groups.addMember(groupId, user.id());
        }
        return toResponse(user, group);
    }

    /** Leaves the group; a group nobody is left in is removed. */
    @Transactional
    void leave(CurrentUser user, UUID groupId) {
        StudyGroup group = require(groupId);
        groups.removeMember(groupId, user.id());
        if (groups.countMembers(groupId) == 0) {
            groups.delete(group);
        }
    }

    @Transactional
    void delete(CurrentUser user, UUID groupId) {
        StudyGroup group = require(groupId);
        if (!group.getCreatedBy().equals(user.id()) && !user.isModerator()) {
            throw new ForbiddenException("Only the person who created the group or a moderator can delete it");
        }
        groups.delete(group);
    }

    private GroupResponse toResponse(CurrentUser user, StudyGroup group) {
        List<UUID> memberIds = groups.findMemberIds(group.getId());
        boolean member = memberIds.contains(user.id());
        List<String> memberNames = List.of();
        if (member) {
            Map<UUID, User> byId = users.findAllById(memberIds).stream()
                    .collect(Collectors.toMap(User::getId, Function.identity()));
            memberNames = memberIds.stream().map(byId::get).filter(found -> found != null)
                    .map(found -> found.getId().equals(user.id()) ? found.getDisplayName() + " (you)"
                            : found.getDisplayName())
                    .toList();
        }
        return new GroupResponse(group.getId(), group.getName(), group.getDescription(),
                member ? group.getMeetingDetails() : null, group.getCapacity(), memberIds.size(), member,
                group.getCreatedBy().equals(user.id()), memberNames, group.getCreatedAt(),
                group.getCreatedBy().equals(user.id()) || user.isModerator());
    }

    private StudyGroup require(UUID groupId) {
        return groups.findById(groupId).orElseThrow(() -> new NotFoundException("Study group not found"));
    }

    private void requireEnrolled(CurrentUser user, UUID courseId) {
        if (!courseService.isEnrolled(user.id(), courseId)) {
            throw new ForbiddenException("Join the course to take part in its study groups");
        }
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.strip();
    }

    record GroupRequest(String name, String description, String meetingDetails, int capacity) {
    }

    /**
     * @param meetingDetails null unless the viewer is a member
     * @param members        names of the members, empty unless the viewer is a member
     */
    record GroupResponse(UUID id, String name, String description, String meetingDetails, int capacity,
                         int memberCount, boolean member, boolean mine, List<String> members, Instant createdAt,
                         boolean canDelete) {
    }
}
