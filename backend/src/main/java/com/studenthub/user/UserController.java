package com.studenthub.user;

import com.studenthub.auth.CurrentUser;
import com.studenthub.common.NotFoundException;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
class UserController {

    private final UserRepository users;

    UserController(UserRepository users) {
        this.users = users;
    }

    @GetMapping("/me")
    UserResponse me(CurrentUser currentUser) {
        return users.findById(currentUser.id())
                .map(UserResponse::from)
                .orElseThrow(() -> new NotFoundException("User not found"));
    }
}
