package com.studenthub.auth;

import com.studenthub.auth.AuthDtos.AuthResponse;
import com.studenthub.auth.AuthDtos.LoginRequest;
import com.studenthub.auth.AuthDtos.RegisterRequest;
import com.studenthub.auth.AuthDtos.RegistrationResponse;
import com.studenthub.common.CodedException;
import com.studenthub.common.ConflictException;
import com.studenthub.common.InvalidRequestException;
import com.studenthub.user.Role;
import com.studenthub.user.RoleAssignment;
import com.studenthub.user.User;
import com.studenthub.user.UserRepository;
import com.studenthub.user.UserResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;
import java.util.Optional;

@Service
class AuthService {

    private final UserRepository users;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final TokenService tokenService;
    private final EmailVerificationService verification;
    private final RegistrationProperties registration;
    private final String privacyPolicyVersion;
    private final RoleAssignment roles;

    AuthService(UserRepository users, PasswordEncoder passwordEncoder, AuthenticationManager authenticationManager,
                TokenService tokenService, EmailVerificationService verification, RegistrationProperties registration,
                @Value("${app.privacy.policy-version}") String privacyPolicyVersion, RoleAssignment roles) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.tokenService = tokenService;
        this.verification = verification;
        this.registration = registration;
        this.privacyPolicyVersion = privacyPolicyVersion;
        this.roles = roles;
    }

    @Transactional
    RegistrationResponse register(RegisterRequest request) {
        String email = normalizeEmail(request.email());
        if (!isUniversityEmail(email)) {
            throw new InvalidRequestException("email",
                    "use your SWPS university email (@" + registration.allowedEmailDomains().getFirst() + ")");
        }
        if (!privacyPolicyVersion.equals(request.privacyPolicyVersion())) {
            // The page was loaded before the policy changed; the user must read and accept the current one.
            throw new InvalidRequestException("privacyPolicyVersion",
                    "the privacy policy has been updated; reload the page and accept the current version");
        }
        Optional<User> existing = users.findByEmail(email);
        if (existing.isPresent()) {
            if (existing.get().isEmailVerified()) {
                throw new ConflictException("An account with this email already exists");
            }
            // Someone registered but never confirmed: send them a fresh link instead of an error.
            verification.sendLink(existing.get());
            return new RegistrationResponse(email);
        }
        User user = new User(email, passwordEncoder.encode(request.password()), request.displayName().strip(),
                Role.STUDENT);
        user.acceptPrivacyPolicy(privacyPolicyVersion);
        users.save(user);
        verification.sendLink(user);
        return new RegistrationResponse(email);
    }

    @Transactional
    AuthResponse verifyEmail(String token) {
        User user = verification.consume(token)
                .flatMap(users::findById)
                .orElseThrow(() -> new CodedException(HttpStatus.BAD_REQUEST, "INVALID_VERIFICATION_TOKEN",
                        "This confirmation link is invalid or has expired. Request a new one."));
        user.markEmailVerified();
        return toResponse(user);
    }

    /** Always succeeds, so the endpoint cannot be used to find out which addresses have accounts. */
    @Transactional
    void resendVerification(String email) {
        users.findByEmail(normalizeEmail(email))
                .filter(user -> !user.isEmailVerified())
                .ifPresent(verification::sendLink);
    }

    @Transactional
    AuthResponse login(LoginRequest request) {
        String email = normalizeEmail(request.email());
        // The password is checked first, so the verification state is only revealed to the account owner.
        authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(email, request.password()));
        User user = users.findByEmail(email).orElseThrow();
        if (!user.isEmailVerified()) {
            throw new CodedException(HttpStatus.FORBIDDEN, "EMAIL_NOT_VERIFIED",
                    "Confirm your email address first. We sent you a link when you registered.");
        }
        return toResponse(user);
    }

    private boolean isUniversityEmail(String email) {
        String domain = email.substring(email.lastIndexOf('@') + 1);
        return registration.allowedEmailDomains().stream().anyMatch(domain::equalsIgnoreCase);
    }

    private AuthResponse toResponse(User user) {
        roles.apply(user);
        TokenService.IssuedToken token = tokenService.issue(user);
        return new AuthResponse(token.value(), token.expiresAt(), UserResponse.from(user));
    }

    private static String normalizeEmail(String email) {
        return email.strip().toLowerCase(Locale.ROOT);
    }
}
