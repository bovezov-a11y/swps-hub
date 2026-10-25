package com.studenthub.moderation;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

interface ReportRepository extends JpaRepository<Report, UUID> {

    boolean existsByTargetTypeAndTargetIdAndReporterId(ContentType targetType, UUID targetId, UUID reporterId);

    @Query("select count(r) from Report r where r.targetType = :type and r.targetId = :id and r.resolvedAt is null")
    long countOpen(ContentType type, UUID id);

    @Query("select r from Report r where r.resolvedAt is null order by r.createdAt")
    List<Report> findOpen();

    @Modifying
    @Query("update Report r set r.resolvedAt = :at where r.targetType = :type and r.targetId = :id and r.resolvedAt is null")
    void resolve(ContentType type, UUID id, Instant at);
}
