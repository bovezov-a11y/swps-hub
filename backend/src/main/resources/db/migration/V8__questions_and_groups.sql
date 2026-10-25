-- Course Q&A. Authors are stored for permissions and voting but never shown to other students.
create table questions (
    id                 uuid primary key,
    course_id          uuid          not null references courses (id) on delete cascade,
    author_id          uuid          not null references users (id) on delete cascade,
    title              varchar(200)  not null,
    body               varchar(5000) not null,
    vote_count         integer       not null default 0,
    accepted_answer_id uuid,
    hidden             boolean       not null default false,
    created_at         timestamptz   not null
);

create index questions_course_id_created_at_idx on questions (course_id, created_at desc);

create table answers (
    id          uuid primary key,
    question_id uuid          not null references questions (id) on delete cascade,
    author_id   uuid          not null references users (id) on delete cascade,
    body        varchar(5000) not null,
    vote_count  integer       not null default 0,
    hidden      boolean       not null default false,
    created_at  timestamptz   not null
);

create index answers_question_id_idx on answers (question_id);

alter table questions add constraint questions_accepted_answer_fk
    foreign key (accepted_answer_id) references answers (id) on delete set null;

create table question_votes (
    question_id uuid not null references questions (id) on delete cascade,
    user_id     uuid not null references users (id) on delete cascade,
    primary key (question_id, user_id)
);

create table answer_votes (
    answer_id uuid not null references answers (id) on delete cascade,
    user_id   uuid not null references users (id) on delete cascade,
    primary key (answer_id, user_id)
);

-- Study groups. Members see each other's names; everyone else only sees how many joined.
create table study_groups (
    id              uuid primary key,
    course_id       uuid          not null references courses (id) on delete cascade,
    created_by      uuid          not null references users (id) on delete cascade,
    name            varchar(100)  not null,
    description     varchar(1000),
    meeting_details varchar(300),
    capacity        integer       not null,
    created_at      timestamptz   not null,
    constraint study_groups_capacity_check check (capacity between 2 and 50)
);

create index study_groups_course_id_idx on study_groups (course_id);

create table study_group_members (
    group_id  uuid        not null references study_groups (id) on delete cascade,
    user_id   uuid        not null references users (id) on delete cascade,
    joined_at timestamptz not null,
    primary key (group_id, user_id)
);
