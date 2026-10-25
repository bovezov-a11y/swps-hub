alter table materials add column hidden boolean not null default false;

-- Reports never reveal who made them: only moderation code reads reporter_id, to keep one report per person.
create table reports (
    id          uuid primary key,
    target_type varchar(20)   not null,
    target_id   uuid          not null,
    reporter_id uuid          not null references users (id) on delete cascade,
    reason      varchar(30)   not null,
    details     varchar(1000),
    created_at  timestamptz   not null,
    resolved_at timestamptz,
    constraint reports_one_per_reporter unique (target_type, target_id, reporter_id)
);

create index reports_open_idx on reports (target_type, target_id) where resolved_at is null;

-- What moderators did, kept even after the content is gone so decisions can be reviewed.
create table moderation_actions (
    id           uuid primary key,
    moderator_id uuid references users (id) on delete set null,
    target_type  varchar(20)  not null,
    target_id    uuid         not null,
    action       varchar(20)  not null,
    summary      varchar(300) not null,
    created_at   timestamptz  not null
);

create index moderation_actions_created_at_idx on moderation_actions (created_at desc);
