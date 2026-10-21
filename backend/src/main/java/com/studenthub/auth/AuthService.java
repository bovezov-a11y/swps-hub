package com.studenthub.auth;

import com.studenthub.auth.AuthDtos.AuthResponse;
import com.studenthub.auth.AuthDtos.LoginRequest;
import com.studenthub.auth.AuthDtos.RegisterRequest;
import com.studenthub.common.ConflictException;
import com.studenthub.user.Role;
import com.studenthub.user.User;
import com.studenthub.user.UserRepository;
import com.studenthub.user.UserResponse;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

@Service
class AuthService {

    private final UserRepository users;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final TokenService tokenService;

    AuthService(UserRepository users, PasswordEncoder passwordEncoder,
                AuthenticationManager authenticationManager, TokenService tokenService) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.tokenService = tokenService;
    }

    @Transactional
    AuthResponse register(RegisterRequest request) {
        String email = normalizeEmail(request.email());
        if (users.existsByEmail(email)) {
            throw new ConflictException("An account with this email already exists");
        }
        User user = users.save(new User(email, passwordEncoder.encode(request.password()),
                request.displayName().strip(), Role.STUDENT));
        return toResponse(user);
    }

    @Transactional(readOnly = true)
    AuthResponse login(LoginRequest request) {
        String email = normalizeEmail(request.email());
        authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(email, request.password()));
        return toResponse(users.findByEmail(email).orElseThrow());
    }

    private AuthResponse toResponse(User user) {
        TokenService.IssuedToken token = tokenService.issue(user);
        return new AuthResponse(token.value(), token.expiresAt(), UserResponse.from(user));
    }

    private static String normalizeEmail(String email) {
        return email.strip().toLowerCase(Locale.ROOT);
    }
}
