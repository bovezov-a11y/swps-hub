package com.studenthub;

import com.jayway.jsonpath.JsonPath;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.assertj.MockMvcTester;
import org.springframework.test.web.servlet.assertj.MvcTestResult;

import java.io.UnsupportedEncodingException;
import java.util.List;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Base class for API tests: a full application context on a real PostgreSQL, plus helpers for authenticated calls.
 * Tests share one database, so they create their own users and unique names instead of relying on a clean state.
 */
@SpringBootTest(properties = {"app.storage.local-dir=target/test-uploads", "app.ai.daily-limit=3",
        "app.roles.admin-emails=" + ApiTest.ADMIN_EMAIL})
@AutoConfigureMockMvc
@Import({TestcontainersConfiguration.class, TestDoubles.class})
public abstract class ApiTest {

    protected static final String ADMIN_EMAIL = "staff-admin@swps.edu.pl";

    private static final Pattern VERIFICATION_TOKEN = Pattern.compile("verify-email\\?token=([A-Za-z0-9_-]+)");

    @Autowired
    protected MockMvcTester mvc;

    @Autowired
    protected TestDoubles.RecordingEmailSender emails;

    @Autowired
    protected TestDoubles.FakeStudyAssistant studyAssistant;

    protected record TestUser(String id, String email, String token) {
    }

    /** Registers a student and confirms their email through the link they were sent, the way a real user would. */
    protected TestUser registerUser() {
        return registerUser("student-" + UUID.randomUUID() + "@st.swps.edu.pl");
    }

    protected TestUser registerUser(String email) {
        mvc.post().uri("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"email": "%s", "password": "correct-horse", "displayName": "Test Student",
                         "privacyPolicyVersion": "1.1"}
                        """.formatted(email))
                .exchange();
        String body = body(verifyEmail(verificationToken(email)));
        return new TestUser(JsonPath.read(body, "$.user.id"), email, JsonPath.read(body, "$.token"));
    }

    /** Logs in again, for example to pick up a role granted after the previous token was issued. */
    protected TestUser login(TestUser user) {
        MvcTestResult result = mvc.post().uri("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"email": "%s", "password": "correct-horse"}
                        """.formatted(user.email()))
                .exchange();
        return new TestUser(user.id(), user.email(), JsonPath.read(body(result), "$.token"));
    }

    /** The configured admin account; tests share one database, so it is created once and reused. */
    protected TestUser admin() {
        MvcTestResult result = mvc.post().uri("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"email": "%s", "password": "correct-horse"}
                        """.formatted(ADMIN_EMAIL))
                .exchange();
        if (result.getResponse().getStatus() == 200) {
            String body = body(result);
            return new TestUser(JsonPath.read(body, "$.user.id"), ADMIN_EMAIL, JsonPath.read(body, "$.token"));
        }
        return registerUser(ADMIN_EMAIL);
    }

    /** A fresh moderator, appointed by the admin. */
    protected TestUser moderator() {
        TestUser user = registerUser();
        post(admin(), "/api/admin/moderators", """
                {"email": "%s"}
                """.formatted(user.email()));
        return login(user);
    }

    protected String verificationToken(String email) {
        String message = emails.lastEmailTo(email).orElseThrow(() -> new AssertionError("No email sent to " + email));
        Matcher matcher = VERIFICATION_TOKEN.matcher(message);
        if (!matcher.find()) {
            throw new AssertionError("No verification link in: " + message);
        }
        return matcher.group(1);
    }

    protected MvcTestResult verifyEmail(String token) {
        return mvc.post().uri("/api/auth/verify-email")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"token": "%s"}
                        """.formatted(token))
                .exchange();
    }

    protected MvcTestResult get(TestUser user, String uri) {
        return mvc.get().uri(uri).header(HttpHeaders.AUTHORIZATION, "Bearer " + user.token()).exchange();
    }

    protected MvcTestResult post(TestUser user, String uri, String json) {
        return mvc.post().uri(uri).header(HttpHeaders.AUTHORIZATION, "Bearer " + user.token())
                .contentType(MediaType.APPLICATION_JSON).content(json).exchange();
    }

    protected MvcTestResult put(TestUser user, String uri, String json) {
        return mvc.put().uri(uri).header(HttpHeaders.AUTHORIZATION, "Bearer " + user.token())
                .contentType(MediaType.APPLICATION_JSON).content(json).exchange();
    }

    protected MvcTestResult put(TestUser user, String uri) {
        return mvc.put().uri(uri).header(HttpHeaders.AUTHORIZATION, "Bearer " + user.token()).exchange();
    }

    protected MvcTestResult delete(TestUser user, String uri) {
        return mvc.delete().uri(uri).header(HttpHeaders.AUTHORIZATION, "Bearer " + user.token()).exchange();
    }

    /** Creates a first-year Psychology course and returns its id. The author is enrolled automatically. */
    protected String createCourse(TestUser author, String code) {
        return createCourse(author, code, "psychology", 1);
    }

    protected String createCourse(TestUser author, String code, String programSlug, int studyYear) {
        MvcTestResult result = post(author, "/api/courses", """
                {"programId": "%s", "studyYear": %d, "term": "WINTER", "code": "%s", "name": "Course %s"}
                """.formatted(programId(author, programSlug), studyYear, code, code));
        return JsonPath.read(body(result), "$.id");
    }

    protected String programId(TestUser user, String slug) {
        List<String> ids = JsonPath.read(body(get(user, "/api/programs")), "$[?(@.slug == '%s')].id".formatted(slug));
        return ids.getFirst();
    }

    protected static String uniqueCode() {
        return "T" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }

    protected static String body(MvcTestResult result) {
        try {
            return result.getResponse().getContentAsString();
        } catch (UnsupportedEncodingException e) {
            throw new IllegalStateException(e);
        }
    }
}
