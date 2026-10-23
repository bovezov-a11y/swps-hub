package com.studenthub.auth;

import com.jayway.jsonpath.JsonPath;
import com.studenthub.ApiTest;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.assertj.MvcTestResult;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class AuthControllerTest extends ApiTest {

    @Test
    void registerCreatesAnUnverifiedAccountAndEmailsALink() {
        String email = uniqueEmail();

        MvcTestResult result = registerRequest(email.toUpperCase(), "correct-horse", "Anna Nowak");

        assertThat(result).hasStatus(HttpStatus.ACCEPTED);
        assertThat(result).bodyJson().extractingPath("$.email").isEqualTo(email);
        assertThat(body(result)).doesNotContain("token");
        assertThat(emails.lastEmailTo(email)).hasValueSatisfying(message ->
                assertThat(message).contains("Anna Nowak", "/verify-email?token="));
    }

    @Test
    void registerOnlyAcceptsUniversityEmails() {
        MvcTestResult result = registerRequest("anna@gmail.com", "correct-horse", "Anna Nowak");

        assertThat(result).hasStatus(HttpStatus.BAD_REQUEST);
        assertThat(result).bodyJson().extractingPath("$.errors.email").asString().contains("st.swps.edu.pl");
    }

    @Test
    void registerRequiresAcceptingTheCurrentPrivacyPolicy() {
        MvcTestResult missing = mvc.post().uri("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"email": "%s", "password": "correct-horse", "displayName": "Anna Nowak"}
                        """.formatted(uniqueEmail()))
                .exchange();
        assertThat(missing).hasStatus(HttpStatus.BAD_REQUEST);
        assertThat(missing).bodyJson().extractingPath("$.errors.privacyPolicyVersion").isNotNull();

        MvcTestResult outdated = registerRequest(uniqueEmail(), "correct-horse", "Anna Nowak", "0.9");
        assertThat(outdated).hasStatus(HttpStatus.BAD_REQUEST);
        assertThat(outdated).bodyJson().extractingPath("$.errors.privacyPolicyVersion").asString().contains("updated");
    }

    @Test
    void confirmingTheEmailLogsTheUserInOnce() {
        String email = uniqueEmail();
        registerRequest(email, "correct-horse", "Anna Nowak");
        String token = verificationToken(email);

        MvcTestResult verified = verifyEmail(token);
        assertThat(verified).hasStatus(HttpStatus.OK);
        assertThat(verified).bodyJson().extractingPath("$.user.email").isEqualTo(email);
        assertThat(verified).bodyJson().extractingPath("$.token").asString().isNotBlank();

        MvcTestResult reused = verifyEmail(token);
        assertThat(reused).hasStatus(HttpStatus.BAD_REQUEST);
        assertThat(reused).bodyJson().extractingPath("$.code").isEqualTo("INVALID_VERIFICATION_TOKEN");
    }

    @Test
    void unverifiedUsersCannotLogInButLearnWhyOnlyWithTheRightPassword() {
        String email = uniqueEmail();
        registerRequest(email, "correct-horse", "Anna Nowak");

        MvcTestResult login = login(email, "correct-horse");
        assertThat(login).hasStatus(HttpStatus.FORBIDDEN);
        assertThat(login).bodyJson().extractingPath("$.code").isEqualTo("EMAIL_NOT_VERIFIED");
        assertThat(login(email, "wrong-password")).hasStatus(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void registerRejectsAnEmailThatIsAlreadyVerified() {
        TestUser existing = registerUser();

        assertThat(registerRequest(existing.email(), "another-password", "Someone Else"))
                .hasStatus(HttpStatus.CONFLICT);
    }

    @Test
    void resendingNeverRevealsWhetherAnAccountExists() {
        MvcTestResult result = mvc.post().uri("/api/auth/resend-verification")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"email": "nobody-%s@st.swps.edu.pl"}
                        """.formatted(UUID.randomUUID()))
                .exchange();

        assertThat(result).hasStatus(HttpStatus.ACCEPTED);
    }

    @Test
    void registerValidatesInput() {
        MvcTestResult result = registerRequest("not-an-email", "short", "Anna");

        assertThat(result).hasStatus(HttpStatus.BAD_REQUEST);
        assertThat(result).bodyJson().extractingPath("$.errors.email").isNotNull();
        assertThat(result).bodyJson().extractingPath("$.errors.password").isNotNull();
    }

    @Test
    void loginReturnsTokenThatAuthenticatesRequests() throws Exception {
        TestUser user = registerUser();

        MvcTestResult login = login(user.email(), "correct-horse");
        assertThat(login).hasStatus(HttpStatus.OK);
        String token = JsonPath.read(login.getResponse().getContentAsString(), "$.token");

        assertThat(mvc.get().uri("/api/users/me").header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .hasStatus(HttpStatus.OK)
                .bodyJson().extractingPath("$.email").isEqualTo(user.email());
    }

    @Test
    void loginRejectsWrongPassword() {
        assertThat(login(registerUser().email(), "wrong-password")).hasStatus(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void protectedEndpointRequiresToken() {
        assertThat(mvc.get().uri("/api/users/me")).hasStatus(HttpStatus.UNAUTHORIZED);
    }

    private MvcTestResult registerRequest(String email, String password, String displayName) {
        return registerRequest(email, password, displayName, "1.0");
    }

    private MvcTestResult registerRequest(String email, String password, String displayName, String policyVersion) {
        return mvc.post().uri("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"email": "%s", "password": "%s", "displayName": "%s", "privacyPolicyVersion": "%s"}
                        """.formatted(email, password, displayName, policyVersion))
                .exchange();
    }

    private MvcTestResult login(String email, String password) {
        return mvc.post().uri("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"email": "%s", "password": "%s"}
                        """.formatted(email, password))
                .exchange();
    }

    private static String uniqueEmail() {
        return "student-" + UUID.randomUUID() + "@st.swps.edu.pl";
    }
}
