package com.studenthub.auth;

import com.studenthub.user.UserResponse;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.Instant;

final class AuthDtos {

    private AuthDtos() {
    }

    record RegisterRequest(
            @NotBlank @Email @Size(max = 255) String email,
            @NotBlank @Size(min = 8, max = 72, message = "must be between 8 and 72 characters") String password,
            @NotBlank @Size(max = 100) String displayName) {
    }

    record LoginRequest(@NotBlank @Email String email, @NotBlank String password) {
    }

    record AuthResponse(String token, Instant expiresAt, UserResponse user) {
    }
}
