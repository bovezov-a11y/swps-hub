package com.studenthub.auth;

import org.springframework.security.oauth2.jwt.Jwt;

import java.util.List;
import java.util.UUID;

/**
 * The authenticated caller, resolved from the access token. Declare it as a controller method parameter to receive it.
 */
public record CurrentUser(UUID id, List<String> roles) {

    public static CurrentUser from(Jwt jwt) {
        List<String> roles = jwt.getClaimAsStringList("roles");
        return new CurrentUser(UUID.fromString(jwt.getSubject()), roles == null ? List.of() : roles);
    }

    public boolean isModerator() {
        return roles.contains("MODERATOR") || roles.contains("ADMIN");
    }
}
