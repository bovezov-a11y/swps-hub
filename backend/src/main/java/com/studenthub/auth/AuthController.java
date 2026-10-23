package com.studenthub.auth;

import com.studenthub.auth.AuthDtos.AuthResponse;
import com.studenthub.auth.AuthDtos.LoginRequest;
import com.studenthub.auth.AuthDtos.RegisterRequest;
import com.studenthub.auth.AuthDtos.RegistrationResponse;
import com.studenthub.auth.AuthDtos.ResendVerificationRequest;
import com.studenthub.auth.AuthDtos.VerifyEmailRequest;
import jakarta.validation.Valid;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@EnableConfigurationProperties(RegistrationProperties.class)
class AuthController {

    private final AuthService authService;

    AuthController(AuthService authService) {
        this.authService = authService;
    }

    /** Creates the account and emails a confirmation link; the user can log in once they confirm. */
    @PostMapping("/register")
    @ResponseStatus(HttpStatus.ACCEPTED)
    RegistrationResponse register(@Valid @RequestBody RegisterRequest request) {
        return authService.register(request);
    }

    /** Confirms the email address with the token from the link and logs the user in. */
    @PostMapping("/verify-email")
    AuthResponse verifyEmail(@Valid @RequestBody VerifyEmailRequest request) {
        return authService.verifyEmail(request.token());
    }

    @PostMapping("/resend-verification")
    @ResponseStatus(HttpStatus.ACCEPTED)
    void resendVerification(@Valid @RequestBody ResendVerificationRequest request) {
        authService.resendVerification(request.email());
    }

    @PostMapping("/login")
    AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }
}
