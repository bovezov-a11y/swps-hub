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
