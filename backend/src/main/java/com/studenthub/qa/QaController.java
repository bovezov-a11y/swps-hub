package com.studenthub.qa;

import com.studenthub.auth.CurrentUser;
import com.studenthub.qa.QaService.QuestionDetail;
import com.studenthub.qa.QaService.QuestionSummary;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
class QaController {

    private final QaService qa;

    QaController(QaService qa) {
        this.qa = qa;
    }

    /** Questions of a course, most helpful first unless {@code sort=new}; {@code filter=unanswered} narrows the list. */
    @GetMapping("/api/courses/{courseId}/questions")
    List<QuestionSummary> list(CurrentUser user, @PathVariable UUID courseId,
                               @RequestParam(defaultValue = "all") String filter,
                               @RequestParam(defaultValue = "top") String sort) {
        return qa.list(user, courseId, "unanswered".equals(filter), "new".equals(sort));
    }

    @PostMapping("/api/courses/{courseId}/questions")
    @ResponseStatus(HttpStatus.CREATED)
    Created ask(CurrentUser user, @PathVariable UUID courseId, @Valid @RequestBody QuestionRequest request) {
        return new Created(qa.ask(user, courseId, request.title(), request.body()));
    }

    @GetMapping("/api/questions/{questionId}")
    QuestionDetail get(CurrentUser user, @PathVariable UUID questionId) {
        return qa.get(user, questionId);
    }

    @DeleteMapping("/api/questions/{questionId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void deleteQuestion(CurrentUser user, @PathVariable UUID questionId) {
        qa.deleteQuestion(user, questionId);
    }

    @PutMapping("/api/questions/{questionId}/vote")
    Votes upvoteQuestion(CurrentUser user, @PathVariable UUID questionId) {
        return new Votes(qa.voteQuestion(user, questionId, true));
    }

    @DeleteMapping("/api/questions/{questionId}/vote")
    Votes removeQuestionVote(CurrentUser user, @PathVariable UUID questionId) {
        return new Votes(qa.voteQuestion(user, questionId, false));
    }

    @PostMapping("/api/questions/{questionId}/answers")
    @ResponseStatus(HttpStatus.CREATED)
    Created answer(CurrentUser user, @PathVariable UUID questionId, @Valid @RequestBody AnswerRequest request) {
        return new Created(qa.answer(user, questionId, request.body()));
    }

    @PutMapping("/api/questions/{questionId}/accepted-answer")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void accept(CurrentUser user, @PathVariable UUID questionId, @Valid @RequestBody AcceptRequest request) {
        qa.accept(user, questionId, request.answerId());
    }

    @DeleteMapping("/api/questions/{questionId}/accepted-answer")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void unaccept(CurrentUser user, @PathVariable UUID questionId) {
        qa.accept(user, questionId, null);
    }

    @DeleteMapping("/api/answers/{answerId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void deleteAnswer(CurrentUser user, @PathVariable UUID answerId) {
        qa.deleteAnswer(user, answerId);
    }

    @PutMapping("/api/answers/{answerId}/vote")
    Votes upvoteAnswer(CurrentUser user, @PathVariable UUID answerId) {
        return new Votes(qa.voteAnswer(user, answerId, true));
    }

    @DeleteMapping("/api/answers/{answerId}/vote")
    Votes removeAnswerVote(CurrentUser user, @PathVariable UUID answerId) {
        return new Votes(qa.voteAnswer(user, answerId, false));
    }

    record QuestionRequest(@NotBlank @Size(max = 200) String title, @NotBlank @Size(max = 5000) String body) {
    }

    record AnswerRequest(@NotBlank @Size(max = 5000) String body) {
    }

    record AcceptRequest(UUID answerId) {
    }

    record Created(UUID id) {
    }

    record Votes(int voteCount) {
    }
}
