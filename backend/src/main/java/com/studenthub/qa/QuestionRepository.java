package com.studenthub.qa;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

interface QuestionRepository extends JpaRepository<Question, UUID> {

    @Query("""
            select q from Question q
            where q.course.id = :courseId
              and (q.hidden = false or q.authorId = :viewerId or :viewerIsModerator = true)
            """)
    List<Question> findForCourse(UUID courseId, UUID viewerId, boolean viewerIsModerator);

    @Query("select q from Question q join fetch q.course where q.id = :id")
    Optional<Question> findWithCourseById(UUID id);

    @Modifying(clearAutomatically = true)
    @Query("update Question q set q.voteCount = q.voteCount + :delta where q.id = :id")
    void adjustVoteCount(UUID id, int delta);

    @Modifying
    @Query(value = "insert into question_votes (question_id, user_id) values (:id, :userId) on conflict do nothing",
            nativeQuery = true)
    int insertVote(UUID id, UUID userId);

    @Modifying
    @Query(value = "delete from question_votes where question_id = :id and user_id = :userId", nativeQuery = true)
    int deleteVote(UUID id, UUID userId);

    @Query(value = "select question_id from question_votes where user_id = :userId and question_id in :ids",
            nativeQuery = true)
    Set<UUID> findVoted(UUID userId, Collection<UUID> ids);
}
