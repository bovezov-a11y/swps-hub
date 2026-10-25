-- Personal study time planned before exams and deadlines. Visible only to the student who planned it.
create table study_sessions (
    id            uuid primary key,
    user_id       uuid         not null references users (id) on delete cascade,
    course_id     uuid         not null references courses (id) on delete cascade,
    exam_event_id uuid         references course_events (id) on delete set null,
    title         varchar(200) not null,
    starts_at     timestamptz  not null,
    ends_at       timestamptz  not null,
    created_at    timestamptz  not null
);

create index study_sessions_user_id_starts_at_idx on study_sessions (user_id, starts_at);
