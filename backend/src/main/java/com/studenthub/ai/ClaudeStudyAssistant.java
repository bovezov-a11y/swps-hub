package com.studenthub.ai;

import com.anthropic.client.AnthropicClient;
import com.anthropic.client.okhttp.AnthropicOkHttpClient;
import com.anthropic.core.JsonSchemaLocalValidation;
import com.anthropic.core.JsonValue;
import com.anthropic.errors.AnthropicException;
import com.anthropic.errors.AnthropicServiceException;
import com.anthropic.errors.InternalServerException;
import com.anthropic.errors.RateLimitException;
import com.anthropic.models.messages.Base64ImageSource;
import com.anthropic.models.messages.Base64PdfSource;
import com.anthropic.models.messages.ContentBlockParam;
import com.anthropic.models.messages.DocumentBlockParam;
import com.anthropic.models.messages.ImageBlockParam;
import com.anthropic.models.messages.MessageCreateParams;
import com.anthropic.models.messages.OutputConfig;
import com.anthropic.models.messages.PlainTextSource;
import com.anthropic.models.messages.StopReason;
import com.anthropic.models.messages.StructuredMessage;
import com.anthropic.models.messages.StructuredMessageCreateParams;
import com.anthropic.models.messages.StructuredOutputConfig;
import com.studenthub.ai.StudyAids.Quiz;
import com.studenthub.ai.StudyAids.Summary;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.Base64;
import java.util.List;
import java.util.Optional;

@Component
@EnableConfigurationProperties(AiProperties.class)
class ClaudeStudyAssistant implements StudyAssistant {

    private static final String SYSTEM_PROMPT = """
            You create study aids for SWPS University students from course materials that students share: lecture \
            notes, summaries, assignments and past exams.

            Write in the language the material is written in, usually Polish or English. Use only what the material \
            contains and do not add facts from elsewhere; if the material is thin, produce fewer, accurate items \
            rather than padding. When the material is a past exam, focus on the topics and skills it tests.""";

    private static final String SUMMARY_TASK = """
            Summarize this material for a student preparing for the exam in this course.""";

    private static final String FLASHCARDS_TASK = """
            Turn this material into flashcards for spaced-repetition study. Each card tests one fact or concept, \
            the front is short, and the back answers it without needing the other cards.""";

    private static final String SYLLABUS_TASK = """
            This file is the course syllabus. List every graded assessment with its date, so the student can put \
            them in a calendar. Today is %s; a date without a year belongs to the academic year that contains \
            the semester described. Copy dates exactly as the syllabus states them and leave the date empty when \
            only a week or period is given.""";

    private static final String QUIZ_TASK = """
            Write a practice quiz that checks whether a student understands this material. Each question has \
            exactly one correct option.""";

    // Opt into Anthropic's server-side fallback so a request declined by a safety classifier is retried on the
    // recommended model instead of failing.
    private static final String FALLBACK_BETA = "server-side-fallback-2026-07-01";

    private final AiProperties properties;
    private final AnthropicClient client;

    @Autowired
    ClaudeStudyAssistant(AiProperties properties) {
        this(properties, properties.apiKey() == null || properties.apiKey().isBlank()
                ? null
                : AnthropicOkHttpClient.builder().apiKey(properties.apiKey()).build());
    }

    /** For tests that point the client at a stub server. */
    ClaudeStudyAssistant(AiProperties properties, AnthropicClient client) {
        this.properties = properties;
        this.client = client;
    }

    @Override
    public boolean isEnabled() {
        return client != null;
    }

    @Override
    public String model() {
        return properties.model();
    }

    @Override
    public Summary summarize(StudyMaterial material) {
        return ask(material, Summary.class, OutputConfig.Effort.MEDIUM, SUMMARY_TASK);
    }

    @Override
    public Quiz quiz(StudyMaterial material) {
        // Wrong answer keys would teach students the wrong thing, so the quiz gets more thinking than the summary.
        return ask(material, Quiz.class, OutputConfig.Effort.HIGH, QUIZ_TASK);
    }

    @Override
    public StudyAids.FlashcardSet flashcards(StudyMaterial material) {
        return ask(material, StudyAids.FlashcardSet.class, OutputConfig.Effort.MEDIUM, FLASHCARDS_TASK);
    }

    @Override
    public StudyAids.SyllabusPlan syllabus(StudyMaterial syllabus, LocalDate today) {
        // Dates go straight into calendars, so reading them carefully is worth the extra thinking.
        return ask(syllabus, StudyAids.SyllabusPlan.class, OutputConfig.Effort.HIGH, SYLLABUS_TASK.formatted(today));
    }

    private <T> T ask(StudyMaterial material, Class<T> type, OutputConfig.Effort effort, String task) {
        if (client == null) {
            throw new IllegalStateException("AI study tools are disabled");
        }
        String context = "Course: %s %s. Material: \"%s\" (%s)."
                .formatted(material.courseCode(), material.courseName(), material.title(), material.typeLabel());
        StructuredMessageCreateParams<T> params = MessageCreateParams.builder()
                .model(properties.model())
                .maxTokens(16000L)
                .system(SYSTEM_PROMPT)
                .outputConfig(StructuredOutputConfig.<T>builder()
                        .effort(effort)
                        .format(type, JsonSchemaLocalValidation.YES)
                        .build())
                .putAdditionalHeader("anthropic-beta", FALLBACK_BETA)
                .putAdditionalBodyProperty("fallbacks", JsonValue.from("default"))
                .addUserMessageOfContentBlockParams(List.of(
                        materialBlock(material),
                        ContentBlockParam.ofText(context + "\n\n" + task)))
                .build();

        StructuredMessage<T> response;
        try {
            response = client.messages().create(params);
        } catch (RateLimitException | InternalServerException e) {
            throw new StudyAssistantException("The AI service is busy", true, e);
        } catch (AnthropicServiceException e) {
            throw new StudyAssistantException("The AI service rejected the request: " + e.getMessage(), false, e);
        } catch (AnthropicException e) {
            throw new StudyAssistantException("Could not reach the AI service", true, e);
        }

        Optional<StopReason> stopReason = response.stopReason();
        if (stopReason.filter(StopReason.REFUSAL::equals).isPresent()) {
            throw new StudyAssistantException("The AI declined to process this material", false, null);
        }
        if (stopReason.filter(StopReason.MAX_TOKENS::equals).isPresent()) {
            throw new StudyAssistantException("The AI response was cut off", true, null);
        }
        return response.content().stream()
                .flatMap(block -> block.text().stream())
                .map(text -> text.text())
                .findFirst()
                .orElseThrow(() -> new StudyAssistantException("The AI returned no result", true, null));
    }

    private static ContentBlockParam materialBlock(StudyMaterial material) {
        String base64 = Base64.getEncoder().encodeToString(material.content());
        return switch (material.contentType()) {
            case "application/pdf" -> ContentBlockParam.ofDocument(DocumentBlockParam.builder()
                    .source(Base64PdfSource.builder().data(base64).build())
                    .title(material.title())
                    .build());
            case "text/plain", "text/markdown" -> ContentBlockParam.ofDocument(DocumentBlockParam.builder()
                    .source(PlainTextSource.builder()
                            .data(new String(material.content(), StandardCharsets.UTF_8))
                            .build())
                    .title(material.title())
                    .build());
            default -> ContentBlockParam.ofImage(ImageBlockParam.builder()
                    .source(Base64ImageSource.builder()
                            .data(base64)
                            .mediaType(Base64ImageSource.MediaType.of(material.contentType()))
                            .build())
                    .build());
        };
    }
}
