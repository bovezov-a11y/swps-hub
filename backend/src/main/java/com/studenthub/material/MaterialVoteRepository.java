package com.studenthub.material;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.Collection;
import java.util.Set;
import java.util.UUID;

public interface MaterialVoteRepository extends JpaRepository<MaterialVote, MaterialVote.Id> {

    @Query("select v.id.materialId from MaterialVote v where v.id.userId = :userId and v.id.materialId in :materialIds")
    Set<UUID> findVotedMaterialIds(UUID userId, Collection<UUID> materialIds);

    /** Inserts the vote unless it exists; returns the number of rows inserted, so 0 means it was already there. */
    @Modifying
    @Query(value = """
            insert into material_votes (material_id, user_id, created_at) values (:materialId, :userId, now())
            on conflict do nothing
            """, nativeQuery = true)
    int insertIfAbsent(UUID materialId, UUID userId);

    @Modifying
    @Query("delete from MaterialVote v where v.id.materialId = :materialId and v.id.userId = :userId")
    int deleteVote(UUID materialId, UUID userId);
}
