package com.studenthub.auth;

import jakarta.validation.constraints.NotEmpty;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

import java.time.Duration;
import java.util.List;

/**
 * @param allowedEmailDomains only addresses in these domains can register, e.g. {@code st.swps.edu.pl}
 * @param publicUrl           base URL of the web app, used for links in emails
 */
@Validated
@ConfigurationProperties("app.registration")
record RegistrationProperties(@NotEmpty List<String> allowedEmailDomains, String publicUrl,
                              Duration verificationTtl, Duration resendCooldown) {
}
