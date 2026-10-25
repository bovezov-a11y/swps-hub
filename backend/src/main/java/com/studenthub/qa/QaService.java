package com.studenthub.qa;

import com.studenthub.auth.CurrentUser;
import com.studenthub.common.ForbiddenException;
import com.studenthub.common.InvalidRequestException;
import com.studenthub.common.NotFoundException;
import com.studenthub.course.Course;
import com.studenthub.course.CourseService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Course Q&A. Authors are used for permissions and votes but are never revealed: everyone appears as "you",
 * "the asker" or "a student".
 */
@Service
public class QaService {

    private static final int EXCERPT_LENGTH = 180;

    private final QuestionRepository questions;
    private final AnswerRepository answers;
    private final CourseService courseService;

    QaService(QuestionRepository questions, AnswerRepository answers, CourseService courseService) {
        this.questions = questions;
        this.answers = answers;
        this.courseService = courseService;
    }

    @Transactional(readOnly = true)
    List<QuestionSummary> list(CurrentUser user, UUID courseId, boolean unansweredOnly, boolean newestFirst) {
        courseService.require(courseId);
        List<Question> found = questions.findForCourse(courseId, user.id(), user.isModerator());
        if (found.isEmpty()) {
            return List.of();
        }
        List<UUID> ids = found.stream().map(Question::getId).toList();
        Map<UUID, Long> answerCounts = answers.countVisible(ids).stream().collect(Collectors.toMap(
                AnswerRepository.AnswerCount::getQuestionId, AnswerRepository.AnswerCount::getAnswers));
        Set<UUID> voted = questions.findVoted(user.id(), ids);
        Comparator<QuestionSummary> order = newestFirst
                ? Comparator.comparing(QuestionSummary::createdAt).reversed()
                : Comparator.comparing(QuestionSummary::voteCount).reversed()
                        .thenComparing(Comparator.comparing(QuestionSummary::createdAt).reversed());
        return found.stream()
                .map(question -> new QuestionSummary(question.getId(), question.getTitle(), excerpt(question.getBody()),
                        question.getVoteCount(), voted.contains(question.getId()),
                        answerCounts.getOrDefault(question.getId(), 0L), question.getAcceptedAnswerId() != null,
                        question.getAuthorId().equals(user.id()), question.isHidden(), question.getCreatedAt()))
                .filter(summary -> !unansweredOnly || summary.answerCount() == 0)
                .sorted(order)
                .toList();
    }

    @Transactional(readOnly = true)
    QuestionDetail get(CurrentUser user, UUID questionId) {
        Question question = requireVisible(user, questionId);
        List<Answer> all = answers.findForQuestion(questionId).stream()
                .filter(answer -> !answer.isHidden() || answer.getAuthorId().equals(user.id()) || user.isModerator())
                .toList();
        Set<UUID> votedAnswers = all.isEmpty() ? Set.of()
                : answers.findVoted(user.id(), all.stream().map(Answer::getId).toList());
        List<AnswerResponse> answerResponses = all.stream()
                .map(answer -> new AnswerResponse(answer.getId(), answer.getBody(), answer.getVoteCount(),
                        votedAnswers.contains(answer.getId()), author(user, question, answer.getAuthorId()),
                        answer.getId().equals(question.getAcceptedAnswerId()), answer.isHidden(),
                        answer.getCreatedAt(), canDelete(user, answer.getAuthorId())))
                // The accepted answer first, then the most helpful.
                .sorted(Comparator.comparing(AnswerResponse::accepted).reversed()
                        .thenComparing(Comparator.comparing(AnswerResponse::voteCount).reversed())
                        .thenComparing(AnswerResponse::createdAt))
                .toList();
        Course course = question.getCourse();
        boolean mine = question.getAuthorId().equals(user.id());
        return new QuestionDetail(question.getId(), new CourseRef(course.getId(), course.getCode(), course.getName()),
                question.getTitle(), question.getBody(), question.getVoteCount(),
                questions.findVoted(user.id(), List.of(questionId)).contains(questionId), mine,
                question.isHidden(), question.getCreatedAt(), canDelete(user, question.getAuthorId()), answerResponses);
    }

    @Transactional
    UUID ask(CurrentUser user, UUID courseId, String title, String body) {
        Course course = courseService.require(courseId);
        return questions.save(new Question(course, user.id(), title.strip(), body.strip())).getId();
    }

    @Transactional
    UUID answer(CurrentUser user, UUID questionId, String body) {
        Question question = requireVisible(user, questionId);
        return answers.save(new Answer(question, user.id(), body.strip())).getId();
    }

    @Transactional
    int voteQuestion(CurrentUser user, UUID questionId, boolean upvote) {
        requireVisible(user, questionId);
        boolean changed = upvote ? questions.insertVote(questionId, user.id()) == 1
                : questions.deleteVote(questionId, user.id()) == 1;
        if (changed) {
            questions.adjustVoteCount(questionId, upvote ? 1 : -1);
        }
        return questions.findById(questionId).orElseThrow().getVoteCount();
    }

    @Transactional
    int voteAnswer(CurrentUser user, UUID answerId, boolean upvote) {
        requireAnswer(answerId);
        boolean changed = upvote ? answers.insertVote(answerId, user.id()) == 1
                : answers.deleteVote(answerId, user.id()) == 1;
        if (changed) {
            answers.adjustVoteCount(answerId, upvote ? 1 : -1);
        }
        return answers.findById(answerId).orElseThrow().getVoteCount();
    }

    /** Marks the answer that solved the question; only the asker can, and {@code null} clears it. */
    @Transactional
    void accept(CurrentUser user, UUID questionId, UUID answerId) {
        Question question = requireVisible(user, questionId);
        if (!question.getAuthorId().equals(user.id())) {
            throw new ForbiddenException("Only the person who asked can accept an answer");
        }
        if (answerId != null) {
            Answer answer = requireAnswer(answerId);
            if (!answer.getQuestion().getId().equals(questionId)) {
                throw new InvalidRequestException("answerId", "the answer belongs to another question");
            }
        }
        question.setAcceptedAnswerId(answerId);
    }

    @Transactional
    void deleteQuestion(CurrentUser user, UUID questionId) {
        Question question = questions.findById(questionId)
                .orElseThrow(() -> new NotFoundException("Question not found"));
        if (!canDelete(user, question.getAuthorId())) {
            throw new ForbiddenException("Only the author or a moderator can delete this question");
        }
        questions.delete(question);
    }

    @Transactional
    void deleteAnswer(CurrentUser user, UUID answerId) {
        Answer answer = requireAnswer(answerId);
        if (!canDelete(user, answer.getAuthorId())) {
            throw new ForbiddenException("Only the author or a moderator can delete this answer");
        }
        removeAnswer(answer);
    }

    /** Clears the acceptance first so the question does not point at a missing answer. */
    void removeAnswer(Answer answer) {
        Question question = answer.getQuestion();
        if (answer.getId().equals(question.getAcceptedAnswerId())) {
            question.setAcceptedAnswerId(null);
        }
        answers.delete(answer);
    }

    private Question requireVisible(CurrentUser user, UUID questionId) {
        return questions.findWithCourseById(questionId)
                .filter(question -> !question.isHidden() || question.getAuthorId().equals(user.id())
                        || user.isModerator())
                .orElseThrow(() -> new NotFoundException("Question not found"));
    }

    private Answer requireAnswer(UUID answerId) {
        return answers.findWithQuestionById(answerId).orElseThrow(() -> new NotFoundException("Answer not found"));
    }

    private static AuthorLabel author(CurrentUser user, Question question, UUID authorId) {
        if (authorId.equals(user.id())) {
            return AuthorLabel.YOU;
        }
        return authorId.equals(question.getAuthorId()) ? AuthorLabel.ASKER : AuthorLabel.STUDENT;
    }

    private static boolean canDelete(CurrentUser user, UUID authorId) {
        return authorId.equals(user.id()) || user.isModerator();
    }

    static String excerpt(String body) {
        String flat = body.replaceAll("\\s+", " ").strip();
        return flat.length() <= EXCERPT_LENGTH ? flat : flat.substring(0, EXCERPT_LENGTH - 1) + "…";
    }

    enum AuthorLabel {
        YOU,
        ASKER,
        STUDENT
    }

    record CourseRef(UUID id, String code, String name) {
    }

    record QuestionSummary(UUID id, String title, String excerpt, int voteCount, boolean voted, long answerCount,
                           boolean solved, boolean mine, boolean hidden, Instant createdAt) {
    }

    record QuestionDetail(UUID id, CourseRef course, String title, String body, int voteCount, boolean voted,
                          boolean mine, boolean hidden, Instant createdAt, boolean canDelete,
                          List<AnswerResponse> answers) {
    }

    record AnswerResponse(UUID id, String body, int voteCount, boolean voted, AuthorLabel author, boolean accepted,
                          boolean hidden, Instant createdAt, boolean canDelete) {
    }
}
