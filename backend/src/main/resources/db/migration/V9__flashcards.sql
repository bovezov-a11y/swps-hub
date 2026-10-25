-- Flashcard decks are shared within a course; review progress is private to each student.
create table flashcard_decks (
    id                 uuid primary key,
    course_id          uuid         not null references courses (id) on delete cascade,
    created_by         uuid         references users (id) on delete set null,
    title              varchar(150) not null,
    description        varchar(500),
    source_material_id uuid         references materials (id) on delete set null,
    created_at         timestamptz  not null
);

create index flashcard_decks_course_id_idx on flashcard_decks (course_id);

create table flashcards (
    id         uuid primary key,
    deck_id    uuid          not null references flashcard_decks (id) on delete cascade,
    front      varchar(500)  not null,
    back       varchar(2000) not null,
    position   integer       not null,
    created_at timestamptz   not null
);

create index flashcards_deck_id_position_idx on flashcards (deck_id, position);

create table flashcard_progress (
    user_id          uuid             not null references users (id) on delete cascade,
    card_id          uuid             not null references flashcards (id) on delete cascade,
    ease             double precision not null,
    interval_days    integer          not null,
    repetitions      integer          not null,
    due_at           timestamptz      not null,
    last_reviewed_at timestamptz      not null,
    primary key (user_id, card_id)
);

create index flashcard_progress_user_id_due_at_idx on flashcard_progress (user_id, due_at);

create table flashcard_review_log (
    id          bigserial primary key,
    user_id     uuid        not null references users (id) on delete cascade,
    card_id     uuid        not null references flashcards (id) on delete cascade,
    grade       varchar(10) not null,
    reviewed_at timestamptz not null
);

create index flashcard_review_log_user_id_reviewed_at_idx on flashcard_review_log (user_id, reviewed_at);
