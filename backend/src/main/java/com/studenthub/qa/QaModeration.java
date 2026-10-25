package com.studenthub.qa;

import com.studenthub.moderation.ContentType;
import com.studenthub.moderation.ModeratedContent;
import org.springframework.stereotype.Component;

import java.util.Optional;
import java.util.UUID;

/** Moderation for questions and answers, registered as two {@link ModeratedContent} beans. */
final class QaModeration {

    private QaModeration() {
    }

    @Component
    static class Questions implements ModeratedContent {

        private final QuestionRepository questions;

        Questions(QuestionRepository questions) {
            this.questions = questions;
        }

        @Override
        public ContentType type() {
            return ContentType.QUESTION;
        }

        @Override
        public Optional<Summary> describe(UUID id) {
            return questions.findWithCourseById(id).map(question -> new Summary(question.getTitle(),
                    QaService.excerpt(question.getBody()), question.getCourse().getCode(),
                    "/questions/" + question.getId(), question.isHidden()));
        }

        @Override
        public void setHidden(UUID id, boolean hidden) {
            questions.findById(id).ifPresent(question -> question.setHidden(hidden));
        }

        @Override
        public void delete(UUID id) {
            questions.deleteById(id);
        }
    }

    @Component
    static class Answers implements ModeratedContent {

        private final AnswerRepository answers;
        private final QaService qa;

        Answers(AnswerRepository answers, QaService qa) {
            this.answers = answers;
            this.qa = qa;
        }

        @Override
        public ContentType type() {
            return ContentType.ANSWER;
        }

        @Override
        public Optional<Summary> describe(UUID id) {
            return answers.findWithQuestionById(id).map(answer -> new Summary(
                    "Answer to: " + answer.getQuestion().getTitle(), QaService.excerpt(answer.getBody()),
                    answer.getQuestion().getCourse().getCode(), "/questions/" + answer.getQuestion().getId(),
                    answer.isHidden()));
        }

        @Override
        public void setHidden(UUID id, boolean hidden) {
            answers.findById(id).ifPresent(answer -> answer.setHidden(hidden));
        }

        @Override
        public void delete(UUID id) {
            answers.findWithQuestionById(id).ifPresent(qa::removeAnswer);
        }
    }
}
