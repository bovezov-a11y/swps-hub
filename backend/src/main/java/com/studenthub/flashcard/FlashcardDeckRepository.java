package com.studenthub.flashcard;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;
import java.util.UUID;

interface FlashcardDeckRepository extends JpaRepository<FlashcardDeck, UUID> {

    @Query("select d from FlashcardDeck d join fetch d.course where d.id = :id")
    Optional<FlashcardDeck> findWithCourseById(UUID id);

    Optional<FlashcardDeck> findFirstBySourceMaterialId(UUID sourceMaterialId);
}
