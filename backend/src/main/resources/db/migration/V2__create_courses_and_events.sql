create table courses (
    id          uuid primary key,
    code        varchar(20)   not null,
    name        varchar(200)  not null,
    semester    varchar(20)   not null,
    lecturer    varchar(100),
    description varchar(2000),
    created_by  uuid          not null references users (id),
    created_at  timestamptz   not null,
    constraint courses_code_semester_key unique (code, semester)
);

create table enrollments (
    user_id   uuid        not null references users (id) on delete cascade,
    course_id uuid        not null references courses (id) on delete cascade,
    joined_at timestamptz not null,
    primary key (user_id, course_id)
);

create index enrollments_course_id_idx on enrollments (course_id);

create table course_events (
    id         uuid primary key,
    course_id  uuid         not null references courses (id) on delete cascade,
    type       varchar(20)  not null,
    title      varchar(200) not null,
    starts_at  timestamptz  not null,
    ends_at    timestamptz  not null,
    location   varchar(200),
    created_by uuid         not null references users (id),
    created_at timestamptz  not null,
    constraint course_events_time_check check (ends_at >= starts_at)
);

create index course_events_course_id_starts_at_idx on course_events (course_id, starts_at);

-- Secret token for the personal .ics calendar feed, created on first use.
alter table users add column calendar_token varchar(64) unique;
