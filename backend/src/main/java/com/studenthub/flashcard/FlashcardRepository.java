package com.studenthub.flashcard;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.UUID;

interface FlashcardRepository extends JpaRepository<Flashcard, UUID> {

    List<Flashcard> findAllByDeckIdOrderByPosition(UUID deckId);

    @Query("select coalesce(max(f.position), -1) from Flashcard f where f.deckId = :deckId")
    int findLastPosition(UUID deckId);
}
