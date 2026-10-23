package com.studenthub.ai;

import com.studenthub.ai.StudyAids.Quiz;
import com.studenthub.ai.StudyAids.Summary;
import com.studenthub.ai.StudyAssistant.StudyAssistantException;
import com.studenthub.ai.StudyAssistant.StudyMaterial;
import com.studenthub.auth.CurrentUser;
import com.studenthub.common.CodedException;
import com.studenthub.common.InvalidRequestException;
import com.studenthub.common.NotFoundException;
import com.studenthub.material.Material;
import com.studenthub.material.MaterialRepository;
import com.studenthub.storage.FileStorage;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import tools.jackson.databind.json.JsonMapper;

import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.util.Optional;
import java.util.UUID;
import java.util.function.Function;

/**
 * Generates study aids for materials. Each aid is generated once and then served from the database, and the model
 * call happens outside any database transaction because it can take tens of seconds.
 */
@Service
class AiService {

    private static final String SUMMARY = "SUMMARY";
    private static final String QUIZ = "QUIZ";

    private final StudyAssistant assistant;
    private final MaterialRepository materials;
    private final MaterialAiResultRepository results;
    private final AiUsageTracker usage;
    private final FileStorage storage;
    private final AiProperties properties;
    private final JsonMapper json;

    AiService(StudyAssistant assistant, MaterialRepository materials, MaterialAiResultRepository results,
              AiUsageTracker usage, FileStorage storage, AiProperties properties, JsonMapper json) {
        this.assistant = assistant;
        this.materials = materials;
        this.results = results;
        this.usage = usage;
        this.storage = storage;
        this.properties = properties;
        this.json = json;
    }

    AiStatus status(CurrentUser user) {
        return new AiStatus(assistant.isEnabled(), properties.dailyLimit(),
                assistant.isEnabled() ? usage.usedToday(user.id()) : 0);
    }

    Summary summary(CurrentUser user, UUID materialId) {
        return studyAid(user, materialId, SUMMARY, Summary.class, assistant::summarize);
    }

    Quiz quiz(CurrentUser user, UUID materialId) {
        return studyAid(user, materialId, QUIZ, Quiz.class, assistant::quiz);
    }

    private <T> T studyAid(CurrentUser user, UUID materialId, String kind, Class<T> type,
                           Function<StudyMaterial, T> generate) {
        if (!assistant.isEnabled()) {
            throw new CodedException(HttpStatus.SERVICE_UNAVAILABLE, "AI_DISABLED",
                    "AI study tools are not set up on this server.");
        }
        Material material = materials.findWithCourseById(materialId)
                .orElseThrow(() -> new NotFoundException("Material not found"));
        Optional<MaterialAiResult> cached = results.findById(new MaterialAiResult.Id(materialId, kind));
        if (cached.isPresent()) {
            return json.readValue(cached.get().getContent(), type);
        }

        StudyMaterial input = toStudyMaterial(material);
        usage.consume(user.id(), properties.dailyLimit());
        T result;
        try {
            result = generate.apply(input);
        } catch (StudyAssistantException e) {
            throw new CodedException(e.isRetryable() ? HttpStatus.SERVICE_UNAVAILABLE : HttpStatus.UNPROCESSABLE_ENTITY,
                    "AI_FAILED", e.isRetryable()
                    ? "The AI service is not available right now. Please try again in a minute."
                    : "The AI could not work with this material.");
        }

        try {
            results.save(new MaterialAiResult(materialId, kind, json.writeValueAsString(result), assistant.model()));
        } catch (DataIntegrityViolationException e) {
            // Another student generated the same aid at the same moment; theirs is already stored.
        }
        return result;
    }

    private StudyMaterial toStudyMaterial(Material material) {
        if (!StudyAssistant.supports(material.getContentType())) {
            throw new InvalidRequestException("material", "AI study tools work with PDF, image and text files");
        }
        if (material.getFileSize() > properties.maxFileSize().toBytes()) {
            throw new InvalidRequestException("material",
                    "AI study tools work with files up to " + properties.maxFileSize().toMegabytes() + " MB");
        }
        byte[] content;
        try (InputStream stream = storage.load(material.getFileKey()).getInputStream()) {
            content = stream.readAllBytes();
        } catch (IOException e) {
            throw new UncheckedIOException("Could not read material " + material.getId(), e);
        }
        return new StudyMaterial(material.getCourse().getCode(), material.getCourse().getName(), material.getTitle(),
                material.getType().name().replace('_', ' ').toLowerCase(), material.getContentType(), content);
    }

    record AiStatus(boolean enabled, int dailyLimit, int usedToday) {
    }
}
