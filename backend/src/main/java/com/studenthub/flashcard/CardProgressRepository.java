package com.studenthub.flashcard;

import org.springframework.data.jpa.repository.JpaRepository;

interface CardProgressRepository extends JpaRepository<CardProgress, CardProgress.Id> {
}
