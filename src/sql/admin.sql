create table admins(
    id uuid primary key default gen_random_uuid(),
    email varchar not null unique,
    password varchar not null,
    name varchar,
    role varchar default 'master_admin',
    is_active boolean default true,
    locked_at timestamp,
    last_login_at timestamp
);

create table admin_refresh_tokens(
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    token varchar not null unique,
    admin_id uuid not null,
    expires_at timestamp with time zone not null,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

create table admin_user_assignments(
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    admin_id uuid not null,
    user_id uuid not null,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);