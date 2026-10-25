package com.studenthub.ai;

import com.anthropic.client.okhttp.AnthropicOkHttpClient;
import com.jayway.jsonpath.JsonPath;
import com.studenthub.ai.StudyAids.Summary;
import com.studenthub.ai.StudyAssistant.StudyAssistantException;
import com.studenthub.ai.StudyAssistant.StudyMaterial;
import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.util.unit.DataSize;

import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.List;
import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Checks the request sent to the Messages API and how the response is read, against a local stub server instead of
 * the real API.
 */
class ClaudeStudyAssistantTest {

    private static final StudyMaterial PDF = new StudyMaterial("ADS-201", "Algorithms", "Final exam", "past exam",
            "application/pdf", "%PDF-1.7".getBytes(StandardCharsets.UTF_8));

    private HttpServer server;
    private final AtomicReference<String> requestBody = new AtomicReference<>();
    private final AtomicReference<String> betaHeader = new AtomicReference<>();
    private volatile String responseBody;

    @BeforeEach
    void startServer() throws IOException {
        server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/v1/messages", exchange -> {
            requestBody.set(new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8));
            betaHeader.set(exchange.getRequestHeaders().getFirst("anthropic-beta"));
            byte[] bytes = responseBody.getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().add("Content-Type", "application/json");
            exchange.sendResponseHeaders(200, bytes.length);
            try (OutputStream out = exchange.getResponseBody()) {
                out.write(bytes);
            }
        });
        server.start();
    }

    @AfterEach
    void stopServer() {
        server.stop(0);
    }

    @Test
    void sendsThePdfWithAStructuredOutputSchemaAndFallbacks() {
        respondWith("end_turn", """
                {"overview": "Sorting and graphs.", "keyPoints": ["Quicksort is O(n log n) on average"], \
                "keyTerms": [{"term": "Heap", "definition": "A tree-based priority queue."}]}""");

        Summary summary = assistant().summarize(PDF);

        assertThat(summary.overview()).isEqualTo("Sorting and graphs.");
        assertThat(summary.keyTerms()).singleElement().satisfies(term -> assertThat(term.term()).isEqualTo("Heap"));

        String body = requestBody.get();
        assertThat(JsonPath.<String>read(body, "$.model")).isEqualTo("claude-opus-5-5");
        assertThat(JsonPath.<String>read(body, "$.fallbacks")).isEqualTo("default");
        assertThat(betaHeader.get()).contains("server-side-fallback-2026-07-01");
        assertThat(JsonPath.<String>read(body, "$.output_config.effort")).isEqualTo("medium");
        assertThat(JsonPath.<String>read(body, "$.output_config.format.type")).isEqualTo("json_schema");
        assertThat(JsonPath.<List<String>>read(body, "$.output_config.format.schema.required"))
                .contains("overview", "keyPoints", "keyTerms");
        assertThat(JsonPath.<String>read(body, "$.messages[0].content[0].type")).isEqualTo("document");
        assertThat(JsonPath.<String>read(body, "$.messages[0].content[0].source.data"))
                .isEqualTo(Base64.getEncoder().encodeToString(PDF.content()));
        assertThat(JsonPath.<String>read(body, "$.messages[0].content[1].text")).contains("ADS-201", "Final exam");
    }

    @Test
    void readsASyllabusWithTodaysDateAndAKindEnum() {
        respondWith("end_turn", """
                {"assessments": [{"title": "Midterm", "kind": "EXAM", "date": "2026-11-18", "time": "10:00", \
                "weightPercent": 30, "timing": ""}], "gradingSummary": "Midterm 30%."}""");

        StudyAids.SyllabusPlan plan = assistant().syllabus(PDF, java.time.LocalDate.of(2026, 10, 25));

        assertThat(plan.assessments()).singleElement()
                .satisfies(item -> assertThat(item.kind()).isEqualTo(StudyAids.AssessmentKind.EXAM));
        String body = requestBody.get();
        assertThat(JsonPath.<String>read(body, "$.output_config.effort")).isEqualTo("high");
        assertThat(JsonPath.<List<String>>read(body,
                "$.output_config.format.schema.properties.assessments.items.properties.kind.enum"))
                .containsExactly("EXAM", "DEADLINE");
        assertThat(JsonPath.<String>read(body, "$.messages[0].content[1].text")).contains("Today is 2026-10-25");
    }

    @Test
    void aRefusalBecomesANonRetryableError() {
        respondWith("refusal", null);

        assertThatThrownBy(() -> assistant().quiz(PDF))
                .isInstanceOf(StudyAssistantException.class)
                .satisfies(e -> assertThat(((StudyAssistantException) e).isRetryable()).isFalse());
    }

    private ClaudeStudyAssistant assistant() {
        var properties = new AiProperties("test-key", "claude-opus-5-5", 20, DataSize.ofMegabytes(20));
        var client = AnthropicOkHttpClient.builder()
                .apiKey("test-key")
                .baseUrl("http://127.0.0.1:" + server.getAddress().getPort())
                .maxRetries(0)
                .build();
        return new ClaudeStudyAssistant(properties, client);
    }

    private void respondWith(String stopReason, String json) {
        String content = json == null ? "[]" : "[{\"type\": \"text\", \"text\": %s}]"
                .formatted(com.fasterxml.jackson.databind.node.TextNode.valueOf(json).toString());
        responseBody = """
                {"id": "msg_test", "type": "message", "role": "assistant", "model": "claude-opus-5-5",
                 "content": %s, "stop_reason": "%s", "stop_sequence": null,
                 "usage": {"input_tokens": 100, "output_tokens": 50}}
                """.formatted(content, stopReason);
    }
}
