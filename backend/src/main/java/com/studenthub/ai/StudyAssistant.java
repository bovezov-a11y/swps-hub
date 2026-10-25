package com.studenthub.ai;

import com.studenthub.ai.StudyAids.Quiz;
import com.studenthub.ai.StudyAids.Summary;

import java.time.LocalDate;

/** Turns a course material into study aids with a language model. */
public interface StudyAssistant {

    boolean isEnabled();

    /** Identifies the model, stored next to each result so outputs can be traced and regenerated later. */
    String model();

    Summary summarize(StudyMaterial material);

    Quiz quiz(StudyMaterial material);

    StudyAids.FlashcardSet flashcards(StudyMaterial material);

    /** Reads the assessments and their dates out of a course syllabus. */
    StudyAids.SyllabusPlan syllabus(StudyMaterial syllabus, LocalDate today);

    /**
     * The file and the context the model needs.
     *
     * @param contentType one of the types {@link #supports} accepts
     */
    record StudyMaterial(String courseCode, String courseName, String title, String typeLabel,
                         String contentType, byte[] content) {
    }

    /** File types the model can read directly. Office documents and archives would need converting first. */
    static boolean supports(String contentType) {
        return switch (contentType) {
            case "application/pdf", "image/png", "image/jpeg", "image/webp", "text/plain", "text/markdown" -> true;
            default -> false;
        };
    }

    /** The model could not produce a result, for example because the service is down or declined the request. */
    class StudyAssistantException extends RuntimeException {

        private final boolean retryable;

        public StudyAssistantException(String message, boolean retryable, Throwable cause) {
            super(message, cause);
            this.retryable = retryable;
        }

        public boolean isRetryable() {
            return retryable;
        }
    }
}
