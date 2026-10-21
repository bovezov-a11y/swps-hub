package com.studenthub.auth;

import com.jayway.jsonpath.JsonPath;
import com.studenthub.TestcontainersConfiguration;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.assertj.MockMvcTester;
import org.springframework.test.web.servlet.assertj.MvcTestResult;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
class AuthControllerTest {

    @Autowired
    MockMvcTester mvc;

    @Test
    void registerCreatesStudentAccountAndReturnsToken() {
        String email = uniqueEmail();

        MvcTestResult result = register(email.toUpperCase(), "correct-horse", "Anna Nowak");

        assertThat(result).hasStatus(HttpStatus.CREATED);
        assertThat(result).bodyJson().extractingPath("$.token").asString().isNotBlank();
        assertThat(result).bodyJson().extractingPath("$.user.email").isEqualTo(email);
        assertThat(result).bodyJson().extractingPath("$.user.displayName").isEqualTo("Anna Nowak");
        assertThat(result).bodyJson().extractingPath("$.user.role").isEqualTo("STUDENT");
    }

    @Test
    void registerRejectsDuplicateEmail() {
        String email = uniqueEmail();
        register(email, "correct-horse", "Anna Nowak");

        assertThat(register(email, "another-password", "Someone Else")).hasStatus(HttpStatus.CONFLICT);
    }

    @Test
    void registerValidatesInput() {
        MvcTestResult result = register("not-an-email", "short", "Anna");

        assertThat(result).hasStatus(HttpStatus.BAD_REQUEST);
        assertThat(result).bodyJson().extractingPath("$.errors.email").isNotNull();
        assertThat(result).bodyJson().extractingPath("$.errors.password").isNotNull();
    }

    @Test
    void loginReturnsTokenThatAuthenticatesRequests() throws Exception {
        String email = uniqueEmail();
        register(email, "correct-horse", "Anna Nowak");

        MvcTestResult login = login(email, "correct-horse");
        assertThat(login).hasStatus(HttpStatus.OK);
        String token = JsonPath.read(login.getResponse().getContentAsString(), "$.token");

        assertThat(mvc.get().uri("/api/users/me").header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .hasStatus(HttpStatus.OK)
                .bodyJson().extractingPath("$.email").isEqualTo(email);
    }

    @Test
    void loginRejectsWrongPassword() {
        String email = uniqueEmail();
        register(email, "correct-horse", "Anna Nowak");

        assertThat(login(email, "wrong-password")).hasStatus(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void protectedEndpointRequiresToken() {
        assertThat(mvc.get().uri("/api/users/me")).hasStatus(HttpStatus.UNAUTHORIZED);
    }

    private MvcTestResult register(String email, String password, String displayName) {
        return mvc.post().uri("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"email": "%s", "password": "%s", "displayName": "%s"}
                        """.formatted(email, password, displayName))
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
        return "student-" + UUID.randomUUID() + "@swps.edu.pl";
    }
}
