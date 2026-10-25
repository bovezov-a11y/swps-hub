package com.studenthub.moderation;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

interface ModerationActionRepository extends JpaRepository<ModerationAction, UUID> {

    List<ModerationAction> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
