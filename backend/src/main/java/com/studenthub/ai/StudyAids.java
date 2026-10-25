package com.studenthub.ai;

import com.fasterxml.jackson.annotation.JsonPropertyDescription;

import java.util.List;

/**
 * Study aids generated from a course material. The model fills these records directly through structured outputs,
 * so the field descriptions double as instructions.
 */
public final class StudyAids {

    private StudyAids() {
    }

    public record Summary(
            @JsonPropertyDescription("Two or three sentences on what the material covers")
            String overview,
            @JsonPropertyDescription("The 4 to 8 most important points a student must remember, one sentence each")
            List<String> keyPoints,
            @JsonPropertyDescription("Up to 8 important terms from the material with one-sentence definitions")
            List<KeyTerm> keyTerms) {
    }

    public record KeyTerm(String term, String definition) {
    }

    public record Quiz(
            @JsonPropertyDescription("Six multiple-choice questions, from basic recall to applying concepts")
            List<Question> questions) {
    }

    public record FlashcardSet(
            @JsonPropertyDescription("Between 10 and 25 flashcards covering the most important facts and concepts")
            List<Card> cards) {
    }

    public record Card(
            @JsonPropertyDescription("A short question or term, answerable from memory")
            String front,
            @JsonPropertyDescription("The answer in one to three sentences")
            String back) {
    }

    public record SyllabusPlan(
            @JsonPropertyDescription("Every graded assessment the syllabus mentions: exams, tests, colloquia, "
                    + "projects, essays, presentations and other hand-in deadlines, in chronological order")
            List<Assessment> assessments,
            @JsonPropertyDescription("How the final grade is calculated, in one or two sentences, or an empty "
                    + "string if the syllabus does not say")
            String gradingSummary) {
    }

    public record Assessment(
            @JsonPropertyDescription("A short name such as \"Midterm exam\" or \"Essay 1\"")
            String title,
            @JsonPropertyDescription("EXAM for exams, tests and colloquia; DEADLINE for anything handed in or "
                    + "presented")
            AssessmentKind kind,
            @JsonPropertyDescription("The date as YYYY-MM-DD if the syllabus gives an exact day, otherwise an "
                    + "empty string. Never guess a date")
            String date,
            @JsonPropertyDescription("The start time as HH:mm if the syllabus gives one, otherwise an empty string")
            String time,
            @JsonPropertyDescription("Its share of the final grade in percent, or 0 if the syllabus does not say")
            int weightPercent,
            @JsonPropertyDescription("When it happens if there is no exact date, such as \"week 8\" or \"exam "
                    + "session\"; otherwise an empty string")
            String timing) {
    }

    public enum AssessmentKind {
        EXAM, DEADLINE
    }

    public record Question(
            String question,
            @JsonPropertyDescription("Exactly four answer options; the wrong ones should be plausible")
            List<String> options,
            @JsonPropertyDescription("Zero-based index of the correct option in options")
            int correctOptionIndex,
            @JsonPropertyDescription("One or two sentences explaining why the correct option is right")
            String explanation) {
    }
}
