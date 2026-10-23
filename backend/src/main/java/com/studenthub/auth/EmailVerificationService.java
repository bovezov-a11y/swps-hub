package com.studenthub.auth;

import com.studenthub.mail.EmailSender;
import com.studenthub.user.User;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Optional;
import java.util.UUID;

/**
 * Issues and checks one-time email verification links. Only a hash of each token is stored, so a database leak does
 * not expose working links.
 */
@Service
class EmailVerificationService {

    private static final SecureRandom RANDOM = new SecureRandom();

    private final EmailVerificationTokenRepository tokens;
    private final EmailSender emailSender;
    private final RegistrationProperties properties;

    EmailVerificationService(EmailVerificationTokenRepository tokens, EmailSender emailSender,
                             RegistrationProperties properties) {
        this.tokens = tokens;
        this.emailSender = emailSender;
        this.properties = properties;
    }

    /** Sends a new link unless one was sent moments ago, which stops the endpoint from being used to spam inboxes. */
    void sendLink(User user) {
        Instant now = Instant.now();
        boolean sentRecently = tokens.findFirstByUserIdOrderByCreatedAtDesc(user.getId())
                .map(last -> last.getCreatedAt().plus(properties.resendCooldown()).isAfter(now))
                .orElse(false);
        if (sentRecently) {
            return;
        }

        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        tokens.save(new EmailVerificationToken(hash(token), user.getId(), now, now.plus(properties.verificationTtl())));

        String link = properties.publicUrl() + "/verify-email?token=" + token;
        emailSender.send(user.getEmail(), "Confirm your SWPS Hub account", """
                Hi %s,

                Confirm your email address to finish creating your SWPS Hub account:

                %s

                The link is valid for %d hours. If you did not sign up, you can ignore this email.

                SWPS Hub is an unofficial project built by students and is not affiliated with SWPS University.
                """.formatted(user.getDisplayName(), link, properties.verificationTtl().toHours()));
    }

    /** Returns the user the token belongs to, or empty when the token is unknown or expired. */
    Optional<UUID> consume(String token) {
        Optional<EmailVerificationToken> found = tokens.findById(hash(token));
        if (found.isEmpty() || found.get().isExpired(Instant.now())) {
            return Optional.empty();
        }
        UUID userId = found.get().getUserId();
        tokens.deleteAllForUser(userId);
        return Optional.of(userId);
    }

    private static String hash(String token) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(token.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 is always available", e);
        }
    }
}
