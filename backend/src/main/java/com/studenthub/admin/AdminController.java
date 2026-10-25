package com.studenthub.admin;

import com.studenthub.common.InvalidRequestException;
import com.studenthub.common.NotFoundException;
import com.studenthub.user.Role;
import com.studenthub.user.User;
import com.studenthub.user.UserRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Locale;
import java.util.UUID;

/** Staff management for admins (secured to the ADMIN role in the security configuration). */
@RestController
class AdminController {

    private final UserRepository users;

    AdminController(UserRepository users) {
        this.users = users;
    }

    @GetMapping("/api/admin/moderators")
    @Transactional(readOnly = true)
    List<StaffMember> moderators() {
        return users.findAllByRoleInOrderByDisplayName(List.of(Role.MODERATOR, Role.ADMIN)).stream()
                .map(StaffMember::from).toList();
    }

    /** Makes an existing, confirmed account a moderator. */
    @PostMapping("/api/admin/moderators")
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    StaffMember addModerator(@Valid @RequestBody AddModeratorRequest request) {
        User user = users.findByEmail(request.email().strip().toLowerCase(Locale.ROOT))
                .filter(User::isEmailVerified)
                .orElseThrow(() -> new InvalidRequestException("email", "no confirmed account uses this email"));
        if (user.getRole() == Role.STUDENT) {
            user.changeRole(Role.MODERATOR);
        }
        return StaffMember.from(user);
    }

    @DeleteMapping("/api/admin/moderators/{userId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional
    void removeModerator(@PathVariable UUID userId) {
        User user = users.findById(userId).orElseThrow(() -> new NotFoundException("User not found"));
        if (user.getRole() == Role.MODERATOR) {
            user.changeRole(Role.STUDENT);
        }
    }

    record AddModeratorRequest(@NotBlank @Email String email) {
    }

    record StaffMember(UUID id, String displayName, String email, Role role) {

        static StaffMember from(User user) {
            return new StaffMember(user.getId(), user.getDisplayName(), user.getEmail(), user.getRole());
        }
    }
}
