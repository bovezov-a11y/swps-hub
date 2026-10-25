package com.studenthub.qa;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

interface AnswerRepository extends JpaRepository<Answer, UUID> {

    @Query("select a from Answer a where a.question.id = :questionId order by a.createdAt")
    List<Answer> findForQuestion(UUID questionId);

    @Query("""
            select a.question.id as questionId, count(a) as answers from Answer a
            where a.question.id in :questionIds and a.hidden = false
            group by a.question.id
            """)
    List<AnswerCount> countVisible(Collection<UUID> questionIds);

    @Query("select a from Answer a join fetch a.question q join fetch q.course where a.id = :id")
    Optional<Answer> findWithQuestionById(UUID id);

    @Modifying(clearAutomatically = true)
    @Query("update Answer a set a.voteCount = a.voteCount + :delta where a.id = :id")
    void adjustVoteCount(UUID id, int delta);

    @Modifying
    @Query(value = "insert into answer_votes (answer_id, user_id) values (:id, :userId) on conflict do nothing",
            nativeQuery = true)
    int insertVote(UUID id, UUID userId);

    @Modifying
    @Query(value = "delete from answer_votes where answer_id = :id and user_id = :userId", nativeQuery = true)
    int deleteVote(UUID id, UUID userId);

    @Query(value = "select answer_id from answer_votes where user_id = :userId and answer_id in :ids",
            nativeQuery = true)
    Set<UUID> findVoted(UUID userId, Collection<UUID> ids);

    interface AnswerCount {
        UUID getQuestionId();

        long getAnswers();
    }
}
