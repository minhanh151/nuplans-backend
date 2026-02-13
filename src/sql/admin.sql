create table admins(
    id uuid primary key default gen_random_uuid(),
    email varchar not null unique,
    password varchar not null,
    name varchar,
    role varchar default 'master_admin',
    is_active boolean default true,
    locked_at timestamp,
    last_login_at timestamp,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

create index idx_admins_email on admins(email);

create table admin_refresh_tokens(
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    token varchar not null unique,
    admin_id uuid not null,
    expires_at timestamp with time zone not null,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

create index idx_admin_refresh_tokens_admin_id_token on admin_refresh_tokens(admin_id, token);

create table admin_user_assignments(
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    admin_id uuid not null,
    user_id uuid not null,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

create index idx_admin_user_assignments_admin_id on admin_user_assignments(admin_id);
create index idx_admin_user_assignments_user_id on admin_user_assignments(user_id);

create table user_submissions(
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id uuid not null,
    submission_type varchar(20) not null, -- 'milestone' or 'daily_action'
    reference_id bigint not null,         -- milestone id or daily_action id
    evidence_path text,
    status varchar(20) default 'submitted', -- submitted, approved, rejected
    reviewed_by uuid,                      -- admin id who reviewed
    reviewed_at timestamp with time zone,
    review_note text,
    submitted_at timestamp with time zone default now(),
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

create index idx_user_submissions_user_id on user_submissions(user_id);
create index idx_user_submissions_type_ref on user_submissions(submission_type, reference_id);
create index idx_user_submissions_status on user_submissions(status);


create table user_at_risks(
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id uuid not null,
    reasons jsonb not null default '[]',
    status varchar(20) default 'active', -- active, resolved
    risk_level varchar(20) default 'medium', -- low, medium, high
    resolved_by uuid, -- admin id who resolved
    resolved_at timestamp with time zone,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

create index idx_user_at_risks_user_id on user_at_risks(user_id);
create index idx_user_at_risks_status on user_at_risks(status);