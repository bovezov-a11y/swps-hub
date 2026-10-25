package com.studenthub.ai;

import com.studenthub.ai.StudyAids.Quiz;
import com.studenthub.ai.StudyAids.Summary;
import com.studenthub.ai.StudyAssistant.StudyAssistantException;
import com.studenthub.ai.StudyAssistant.StudyMaterial;
import com.studenthub.auth.CurrentUser;
import com.studenthub.common.CodedException;
import com.studenthub.common.ForbiddenException;
import com.studenthub.common.InvalidRequestException;
import com.studenthub.common.NotFoundException;
import com.studenthub.course.Course;
import com.studenthub.course.CourseService;
import com.studenthub.flashcard.FlashcardService;
import com.studenthub.material.FileTypes;
import com.studenthub.material.Material;
import com.studenthub.material.MaterialRepository;
import com.studenthub.storage.FileStorage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import tools.jackson.databind.json.JsonMapper;

import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.format.DateTimeParseException;
import java.util.List;
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
    private final FlashcardService flashcards;
    private final CourseService courses;
    private final ZoneId zone;

    AiService(StudyAssistant assistant, MaterialRepository materials, MaterialAiResultRepository results,
              AiUsageTracker usage, FileStorage storage, AiProperties properties, JsonMapper json,
              FlashcardService flashcards, CourseService courses, @Value("${app.time-zone}") ZoneId zone) {
        this.assistant = assistant;
        this.materials = materials;
        this.results = results;
        this.usage = usage;
        this.storage = storage;
        this.properties = properties;
        this.json = json;
        this.flashcards = flashcards;
        this.courses = courses;
        this.zone = zone;
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

    /** Returns the material's AI flashcard deck, generating it on first use; every student shares the deck. */
    UUID flashcardDeck(CurrentUser user, UUID materialId) {
        requireEnabled();
        Material material = materials.findWithCourseById(materialId)
                .orElseThrow(() -> new NotFoundException("Material not found"));
        Optional<UUID> existing = flashcards.deckForMaterial(materialId);
        if (existing.isPresent()) {
            return existing.get();
        }
        StudyMaterial input = toStudyMaterial(material);
        usage.consume(user.id(), properties.dailyLimit());
        StudyAids.FlashcardSet set = generate(() -> assistant.flashcards(input));
        if (set.cards().isEmpty()) {
            throw new CodedException(HttpStatus.UNPROCESSABLE_ENTITY, "AI_FAILED",
                    "The AI could not make flashcards from this material.");
        }
        return flashcards.createGeneratedDeck(material.getCourse().getId(), "Flashcards: " + material.getTitle(),
                materialId, set.cards().stream()
                        .map(card -> new FlashcardService.CardInput(card.front(), card.back())).toList());
    }

    /**
     * Reads the assessments out of a syllabus so the student can review them before adding them to the course.
     * Nothing is stored: the file is only sent to the model, and the student decides what goes in the calendar.
     */
    SyllabusImport readSyllabus(CurrentUser user, UUID courseId, MultipartFile file) {
        requireEnabled();
        Course course = courses.require(courseId);
        if (!courses.isEnrolled(user.id(), courseId) && !user.isModerator()) {
            throw new ForbiddenException("Join the course to add dates from its syllabus");
        }
        if (file == null || file.isEmpty()) {
            throw new InvalidRequestException("file", "choose the syllabus file");
        }
        String fileName = Optional.ofNullable(file.getOriginalFilename()).filter(name -> !name.isBlank())
                .orElse("syllabus");
        String contentType = FileTypes.contentTypeFor(fileName).filter(StudyAssistant::supports)
                .orElseThrow(() -> new InvalidRequestException("file", "upload the syllabus as a PDF, image or text file"));
        if (file.getSize() > properties.maxFileSize().toBytes()) {
            throw new InvalidRequestException("file",
                    "the syllabus must be at most " + properties.maxFileSize().toMegabytes() + " MB");
        }
        byte[] content;
        try {
            content = file.getBytes();
        } catch (IOException e) {
            throw new UncheckedIOException("Could not read the uploaded syllabus", e);
        }

        StudyMaterial input = new StudyMaterial(course.getCode(), course.getName(), fileName, "syllabus",
                contentType, content);
        usage.consume(user.id(), properties.dailyLimit());
        StudyAids.SyllabusPlan plan = generate(() -> assistant.syllabus(input, LocalDate.now(zone)));
        return new SyllabusImport(blankToNull(plan.gradingSummary()), plan.assessments().stream()
                .map(assessment -> new SyllabusImport.Item(assessment.title().strip(), assessment.kind(),
                        parse(assessment.date(), LocalDate::parse), parse(assessment.time(), LocalTime::parse),
                        assessment.weightPercent() > 0 ? assessment.weightPercent() : null,
                        blankToNull(assessment.timing())))
                .toList());
    }

    /** What the model found in a syllabus. Dates it could not read exactly are left empty for the student. */
    record SyllabusImport(String gradingSummary, List<Item> items) {

        record Item(String title, StudyAids.AssessmentKind type, LocalDate date, LocalTime time,
                    Integer weightPercent, String timing) {
        }
    }

    private static <T> T parse(String value, Function<String, T> parser) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return parser.apply(value.strip());
        } catch (DateTimeParseException e) {
            return null;
        }
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.strip();
    }

    private void requireEnabled() {
        if (!assistant.isEnabled()) {
            throw new CodedException(HttpStatus.SERVICE_UNAVAILABLE, "AI_DISABLED",
                    "AI study tools are not set up on this server.");
        }
    }

    private static <T> T generate(java.util.function.Supplier<T> call) {
        try {
            return call.get();
        } catch (StudyAssistantException e) {
            throw new CodedException(e.isRetryable() ? HttpStatus.SERVICE_UNAVAILABLE : HttpStatus.UNPROCESSABLE_ENTITY,
                    "AI_FAILED", e.isRetryable()
                    ? "The AI service is not available right now. Please try again in a minute."
                    : "The AI could not work with this material.");
        }
    }

    private <T> T studyAid(CurrentUser user, UUID materialId, String kind, Class<T> type,
                           Function<StudyMaterial, T> generate) {
        requireEnabled();
        Material material = materials.findWithCourseById(materialId)
                .orElseThrow(() -> new NotFoundException("Material not found"));
        Optional<MaterialAiResult> cached = results.findById(new MaterialAiResult.Id(materialId, kind));
        if (cached.isPresent()) {
            return json.readValue(cached.get().getContent(), type);
        }

        StudyMaterial input = toStudyMaterial(material);
        usage.consume(user.id(), properties.dailyLimit());
        T result = generate(() -> generate.apply(input));

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
