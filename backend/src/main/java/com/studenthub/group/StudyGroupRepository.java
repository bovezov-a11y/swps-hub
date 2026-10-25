package com.studenthub.group;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

interface StudyGroupRepository extends JpaRepository<StudyGroup, UUID> {

    List<StudyGroup> findAllByCourseIdOrderByCreatedAt(UUID courseId);

    /** Locks the group row so concurrent joins are counted one after another. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select g from StudyGroup g where g.id = :id")
    Optional<StudyGroup> findForUpdate(UUID id);

    @Query(value = "select user_id from study_group_members where group_id = :groupId order by joined_at",
            nativeQuery = true)
    List<UUID> findMemberIds(UUID groupId);

    @Query(value = "select count(*) from study_group_members where group_id = :groupId", nativeQuery = true)
    int countMembers(UUID groupId);

    @Modifying
    @Query(value = """
            insert into study_group_members (group_id, user_id, joined_at) values (:groupId, :userId, now())
            on conflict do nothing
            """, nativeQuery = true)
    int addMember(UUID groupId, UUID userId);

    @Modifying
    @Query(value = "delete from study_group_members where group_id = :groupId and user_id = :userId",
            nativeQuery = true)
    int removeMember(UUID groupId, UUID userId);
}
