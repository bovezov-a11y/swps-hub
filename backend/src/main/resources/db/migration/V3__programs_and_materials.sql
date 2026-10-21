-- Fields of study. Courses are grouped by program and year of study so materials collect over the years.
create table programs (
    id         uuid primary key default gen_random_uuid(),
    slug       varchar(60)  not null unique,
    name       varchar(120) not null,
    sort_order int          not null
);

insert into programs (slug, name, sort_order) values
    ('psychology', 'Psychology', 10),
    ('computer-science', 'Computer Science', 20),
    ('cognitive-science', 'Cognitive Science', 30),
    ('law', 'Law', 40),
    ('management', 'Management', 50),
    ('english-studies', 'English Studies', 60),
    ('design', 'Design', 70),
    ('journalism', 'Journalism and Social Communication', 80),
    ('sociology', 'Sociology', 90),
    ('cultural-studies', 'Cultural Studies', 100);

-- A course is now a subject that persists across academic years instead of one semester's edition.
alter table courses add column program_id uuid references programs (id);
alter table courses add column study_year integer;
alter table courses add column term varchar(10);

update courses
set program_id = (select id from programs where slug = 'psychology'),
    study_year = 1,
    term       = case when semester like '%Summer' then 'SUMMER' else 'WINTER' end;

alter table courses alter column program_id set not null;
alter table courses alter column study_year set not null;
alter table courses alter column term set not null;
alter table courses add constraint courses_study_year_check check (study_year between 1 and 5);
alter table courses drop constraint courses_code_semester_key;
alter table courses drop column semester;
alter table courses add constraint courses_program_code_key unique (program_id, code);

create index courses_program_id_study_year_idx on courses (program_id, study_year);

create table materials (
    id            uuid primary key,
    course_id     uuid          not null references courses (id) on delete cascade,
    type          varchar(20)   not null,
    title         varchar(200)  not null,
    description   varchar(2000),
    academic_year varchar(7)    not null,
    file_key      varchar(100)  not null unique,
    file_name     varchar(255)  not null,
    content_type  varchar(100)  not null,
    file_size     bigint        not null,
    vote_count    int           not null default 0,
    uploaded_by   uuid          not null references users (id),
    created_at    timestamptz   not null
);

create index materials_course_id_idx on materials (course_id);
create index materials_created_at_idx on materials (created_at desc);

create table material_votes (
    material_id uuid        not null references materials (id) on delete cascade,
    user_id     uuid        not null references users (id) on delete cascade,
    created_at  timestamptz not null,
    primary key (material_id, user_id)
);
