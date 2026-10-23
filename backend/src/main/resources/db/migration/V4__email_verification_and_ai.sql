-- Only verified university addresses can log in. Accounts created before verification existed stay usable.
alter table users add column email_verified boolean not null default false;
update users set email_verified = true;

create table email_verification_tokens (
    -- SHA-256 of the token sent by email; the token itself is never stored.
    token_hash varchar(64) primary key,
    user_id    uuid        not null references users (id) on delete cascade,
    expires_at timestamptz not null,
    created_at timestamptz not null
);

create index email_verification_tokens_user_id_idx on email_verification_tokens (user_id);

-- AI study aids are generated once per material and shared by every student.
create table material_ai_results (
    material_id uuid        not null references materials (id) on delete cascade,
    kind        varchar(20) not null,
    content     text        not null,
    model       varchar(60) not null,
    created_at  timestamptz not null,
    primary key (material_id, kind)
);

-- AI generations per user and day, to keep costs predictable.
create table ai_usage (
    user_id  uuid    not null references users (id) on delete cascade,
    day      date    not null,
    requests integer not null,
    primary key (user_id, day)
);
