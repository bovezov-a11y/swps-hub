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
import java.util.UUID;

/**
 * Base class for API tests: a full application context on a real PostgreSQL, plus helpers for authenticated calls.
 * Tests share one database, so they create their own users and unique names instead of relying on a clean state.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
public abstract class ApiTest {

    @Autowired
    protected MockMvcTester mvc;

    protected record TestUser(String id, String email, String token) {
    }

    protected TestUser registerUser() {
        String email = "student-" + UUID.randomUUID() + "@swps.edu.pl";
        MvcTestResult result = mvc.post().uri("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"email": "%s", "password": "correct-horse", "displayName": "Test Student"}
                        """.formatted(email))
                .exchange();
        String body = body(result);
        return new TestUser(JsonPath.read(body, "$.user.id"), email, JsonPath.read(body, "$.token"));
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

    /** Creates a course with a unique code and returns its id. The author is enrolled automatically. */
    protected String createCourse(TestUser author, String code) {
        MvcTestResult result = post(author, "/api/courses", """
                {"code": "%s", "name": "Course %s", "semester": "2026/27 Winter"}
                """.formatted(code, code));
        return JsonPath.read(body(result), "$.id");
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
