package com.studenthub.user;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Locale;

/**
 * Grants the admin role to the addresses listed in {@code app.roles.admin-emails}, so the first university staff
 * account can be set up without database access. Admins then appoint moderators in the app.
 */
@Component
public class RoleAssignment {

    private final List<String> adminEmails;

    RoleAssignment(@Value("${app.roles.admin-emails:}") List<String> adminEmails) {
        this.adminEmails = adminEmails.stream().map(email -> email.strip().toLowerCase(Locale.ROOT))
                .filter(email -> !email.isEmpty()).toList();
    }

    public void apply(User user) {
        if (user.getRole() != Role.ADMIN && adminEmails.contains(user.getEmail())) {
            user.changeRole(Role.ADMIN);
        }
    }
}
