create table public."user"
(
    id                     uuid      default uuid_generate_v4() not null
        constraint "PK_cace4a159ff9f2512dd42373760"
            primary key,
    email                  varchar                              not null
        constraint "UQ_e12875dfb3b1d92d7d7c5377e22"
            unique,
    password               varchar                              not null,
    name                   varchar,
    "isVerified"           boolean   default false              not null,
    "verificationToken"    varchar,
    "resetPasswordToken"   varchar,
    "resetPasswordExpires" timestamp,
    "createdAt"            timestamp default now()              not null,
    "updatedAt"            timestamp default now()              not null
);

alter table public."user"
    owner to postgres;

create table public.refresh_token
(
    id          uuid      default uuid_generate_v4() not null
        constraint "PK_b575dd3c21fb0831013c909e7fe"
            primary key,
    token       varchar                              not null,
    "expiresAt" timestamp                            not null,
    "createdAt" timestamp default now()              not null,
    "userId"    uuid                                 not null
        constraint "FK_8e913e288156c133999341156ad"
            references public."user"
            on delete cascade
);

alter table public.refresh_token
    owner to postgres;




-- Create profiles table for user information
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE not null,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  date_of_birth DATE,
  employment_status TEXT,
  employer_name TEXT,
  job_title TEXT,
  annual_income DECIMAL(12, 2),
  employment_duration_months INTEGER,
  cv_file_path TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create credit assessments table
CREATE TABLE IF NOT EXISTS public.credit_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  credit_score INTEGER,
  max_loan_amount DECIMAL(12, 2),
  interest_rate DECIMAL(5, 2),
  assessment_details JSONB,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS monthly_expenses DECIMAL(12, 2),
ADD COLUMN IF NOT EXISTS existing_debts DECIMAL(12, 2),
ADD COLUMN IF NOT EXISTS housing_status TEXT, -- 'rent', 'own', 'mortgage', 'living_with_family'
ADD COLUMN IF NOT EXISTS monthly_rent_mortgage DECIMAL(12, 2),
ADD COLUMN IF NOT EXISTS dependents INTEGER DEFAULT 0;

-- Add employment history field to store detailed employment records
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS employment_history JSONB DEFAULT '[]'::jsonb;

-- Add calculated fields for employment analysis
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS total_years_experience DECIMAL(5, 2),
ADD COLUMN IF NOT EXISTS average_job_duration_months DECIMAL(5, 2),
ADD COLUMN IF NOT EXISTS longest_employment_gap_months INTEGER,
ADD COLUMN IF NOT EXISTS number_of_employers INTEGER DEFAULT 0;

-- Create chat threads and messages tables with RLS
create extension if not exists pgcrypto;


create table if not exists public.thread_groups (
    id int GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    label text,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

INSERT INTO "public"."thread_groups" ("label", "created_at", "updated_at") VALUES ('Weekly plans', now(), now()), ('Milestones', now(), now()), ('Projects', now(), now()), ('General', now(), now());

create table if not exists public.chat_threads (
  id uuid primary key default gen_random_uuid(),
  group_id int references public.thread_groups(id) on delete cascade,
  user_id uuid not null,
  title varchar(255),
  status varchar(20) check (status in ('active', 'completed', 'archived')),
  last_message_date timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_chat_threads_group_id on public.chat_threads(group_id);

create table if not exists public.chat_messages (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  thread_id uuid references public.chat_threads(id) on delete cascade,
  role varchar(20) check (role in ('user','assistant')),
  content text,
  created_at timestamptz default now()
);
create index if not exists idx_chat_messages_thread_id_created on public.chat_messages(thread_id, created_at);


create table if not exists public.message_actions (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    message_id bigint references public.chat_messages(id) on delete cascade,
    action_type varchar(100),
    label text,
    action_data JSONB DEFAULT '{}'::jsonb,
    created_at timestamptz default now()
);
create index if not exists idx_message_actions_message_id on public.message_actions(message_id);


create table if not exists public.weekly_planning_threads (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    thread_id uuid references public.chat_threads(id) on delete cascade,
    week_number smallint not null,
    date_range varchar(50) not null
);
create index if not exists idx_weekly_planning_threads_thread_id on public.weekly_planning_threads(thread_id);

CREATE TABLE if not exists public.milestones (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id uuid not null,
    name VARCHAR(300) NOT NULL,
    status varchar(50) check (status in ('approved', 'under-review', 'pending')),
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);
CREATE INDEX if not exists idx_milestones_user_id ON milestones(user_id);


CREATE TABLE if not exists public.milestone_threads (
   id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
   thread_id UUID REFERENCES public.chat_threads(id) ON DELETE CASCADE,
   milestone_id bigint references milestones(id) on delete cascade
);

CREATE INDEX if not exists idx_milestone_threads_thread_id ON milestone_threads(thread_id);


CREATE TABLE if not exists public.projects (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id uuid not null,
    name varchar(300) NOT NULL,
    status varchar(50),
    description text,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);
CREATE INDEX if not exists idx_projects_user_id ON projects(user_id);


CREATE TABLE if not exists project_threads (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    thread_id UUID REFERENCES public.chat_threads(id) ON DELETE CASCADE,
    project_id bigint references projects(id) on delete cascade
);

CREATE INDEX if not exists idx_project_threads_thread_id ON project_threads(thread_id);



CREATE TABLE if not exists thread_badges (
   id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
   thread_id UUID NOT NULL REFERENCES public.chat_threads(id) ON DELETE CASCADE,
   type varchar(50) NOT NULL,
   label VARCHAR(100) NOT NULL,
   created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
   CONSTRAINT unique_thread_badge UNIQUE(thread_id, type)
);

CREATE INDEX if not exists idx_thread_badges_thread ON thread_badges(thread_id);



-- Add message_count to chat_threads
ALTER TABLE public.chat_threads
ADD COLUMN IF NOT EXISTS message_count integer NOT NULL DEFAULT 0;
create index if not exists idx_chat_threads_user_id_last_message_date on public.chat_threads(user_id, last_message_date);


ALTER TABLE public.milestones
    ADD COLUMN IF NOT EXISTS progress SMALLINT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS deadline TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS evidence_submitted BOOLEAN NOT NULL DEFAULT FALSE;


ALTER TABLE public.projects
    ADD COLUMN IF NOT EXISTS steps_remaining SMALLINT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS estimated_hours DECIMAL(8,2),
    ADD COLUMN IF NOT EXISTS last_action VARCHAR(500);


CREATE TABLE if not exists public.weekly_plans (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id uuid default null,
    week_number smallint not null,
    date_range varchar(50) not null,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);
CREATE INDEX if not exists idx_weekly_plans_user_id ON weekly_plans(user_id);



ALTER TABLE public.weekly_planning_threads
    ADD COLUMN IF NOT EXISTS weekly_plan_id bigint references weekly_plans(id) on delete cascade;


-- Function to bump last_message_date and increment message_count atomically
create or replace function public.bump_thread_activity(
  p_thread_id uuid,
  p_user_id uuid
) returns void
language sql
security definer
as $$
  update public.chat_threads
  set last_message_date = now(),
      message_count = coalesce(message_count, 0) + 1,
      updated_at = now()
  where id = p_thread_id and user_id = p_user_id;
$$;

revoke all on function public.bump_thread_activity(uuid, uuid) from public;



-- Add onboarding fields to profiles for dashboard generation
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS career_path TEXT,
ADD COLUMN IF NOT EXISTS onboarding_timeline_months INTEGER,
ADD COLUMN IF NOT EXISTS trial_opt_in BOOLEAN,
ADD COLUMN IF NOT EXISTS skills_profile JSONB,
ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS idv_submitted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS idv_status TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_user_id_uidx ON public.profiles(user_id);

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS photo_id_path TEXT,
ADD COLUMN IF NOT EXISTS selfie_path TEXT;


CREATE table skill_profiles (
    id int GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    profile_id uuid UNIQUE not null,
    career_path text not null default '',
    overall_progress integer not null default 0,
    gap_closed integer not null default 0,
    last_assessment_date timestamptz not null default now(),
    strength_areas JSONB not null default '[]',
    improvement_areas JSONB not null default '[]',
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    foreign key (profile_id) references profiles (id)
);


create table skill_profiles_skills(
    id int GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    skill_profile_id int not null,
    skill_id text not null default '',
    name text not null default '',
    category text not null default '',
    current_level int not null default 0,
    target_level int not null default 0,
    required_for_role boolean not null default false,
    related_courses JSONB not null default '[]',
    last_updated timestamptz default now(),
    foreign key (skill_profile_id) references skill_profiles (id)
);

ALTER TABLE skill_profiles_skills
ADD CONSTRAINT skill_profile_skill_unique UNIQUE (skill_profile_id, skill_id);

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS skills JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS education JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS certifications JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS languages JSONB DEFAULT '[]'::jsonb;


-- Enhance milestones table
ALTER TABLE public.milestones
ADD COLUMN IF NOT EXISTS category VARCHAR(100),
ADD COLUMN IF NOT EXISTS priority VARCHAR(20) CHECK (priority IN ('mandatory', 'optional')),
ADD COLUMN IF NOT EXISTS estimated_time VARCHAR(50),
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS verification_method VARCHAR(50) CHECK (verification_method IN ('upload', 'api', 'auto', 'review')),
ADD COLUMN IF NOT EXISTS type VARCHAR(20) DEFAULT 'mandatory';

-- Enhance projects table
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS priority VARCHAR(20),
ADD COLUMN IF NOT EXISTS impact VARCHAR(50),
ADD COLUMN IF NOT EXISTS category VARCHAR(100);

-- Enhance weekly_plans table
ALTER TABLE public.weekly_plans
ADD COLUMN IF NOT EXISTS summary TEXT,
ADD COLUMN IF NOT EXISTS priority_task_title VARCHAR(300),
ADD COLUMN IF NOT EXISTS priority_task_description TEXT,
ADD COLUMN IF NOT EXISTS impact VARCHAR(50),
ADD COLUMN IF NOT EXISTS estimated_time VARCHAR(50);


alter table chat_threads
    add group_object_id bigint;

comment on column chat_threads.group_object_id is 'Id milestones/project/weekly_plan';

CREATE OR REPLACE FUNCTION trigger_set_timestamp_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;



create table daily_actions (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    profile_id uuid not null,
    weekly_plan_id bigint not null,
    title varchar(300) not null,
    description varchar(500),
    priority varchar(50),
    category varchar(50),
    estimated_time varchar(50),
    action_date timestamptz,
    completed boolean default false,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);
create index if not exists idx_daily_actions_profile_id on daily_actions(profile_id);
create index if not exists idx_daily_actions_weekly_plan_id on daily_actions(weekly_plan_id);

CREATE TRIGGER set_timestamp_updated_at_daily_actions
    BEFORE UPDATE ON daily_actions
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp_updated_at();

create table public.milestone_steps
(
    id           bigint generated always as identity constraint milestone_tasks_pkey primary key,
    profile_id   uuid                                   not null,
    milestone_id bigint                                 not null,
    label        varchar(300)                           not null,
    description  text,
    step_number  smallint,
    is_completed boolean                  default false not null,
    created_at   timestamp with time zone default now(),
    updated_at   timestamp with time zone default now()
);

alter table public.milestone_steps
    owner to postgres;

create index idx_milestone_steps_profile_id
    on public.milestone_steps (profile_id);

create index idx_milestone_steps_milestone_id
    on public.milestone_steps (milestone_id);


CREATE TRIGGER set_timestamp_updated_at_milestone_steps
    BEFORE UPDATE ON milestone_steps
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp_updated_at();


alter table weekly_plans
    alter column impact type text using impact::text;





create table stored_events (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    event_type varchar(50) not null,
    event_data jsonb not null,
    retry_count int default 0,
    status smallint default 0,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);
create index if not exists idx_stored_events_event_type on stored_events(event_type, status, retry_count);

-- Add project_id to milestones table to establish projects > milestones relationship
ALTER TABLE public.milestones
ADD COLUMN IF NOT EXISTS project_id bigint REFERENCES projects(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_milestones_project_id ON milestones(project_id);

-- Add milestone_id to weekly_plans table to establish milestones > weekly_plans relationship
ALTER TABLE public.weekly_plans
ADD COLUMN IF NOT EXISTS milestone_id bigint REFERENCES milestones(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_weekly_plans_milestone_id ON weekly_plans(milestone_id);

-- Rename profile_id to user_id in daily_actions table
ALTER TABLE public.daily_actions 
RENAME COLUMN profile_id TO user_id;

-- Drop old index and create new one with correct column name
DROP INDEX IF EXISTS idx_daily_actions_profile_id;
CREATE INDEX IF NOT EXISTS idx_daily_actions_user_id ON daily_actions(user_id);

-- Rename profile_id to user_id in milestone_steps table
ALTER TABLE public.milestone_steps 
RENAME COLUMN profile_id TO user_id;

-- Drop old index and create new one with correct column name
DROP INDEX IF EXISTS idx_milestone_steps_profile_id;
CREATE INDEX IF NOT EXISTS idx_milestone_steps_user_id ON milestone_steps(user_id);

-- Add start_date to milestones table
ALTER TABLE public.milestones
ADD COLUMN IF NOT EXISTS start_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS evidence varchar(255);

-- Add start_date and deadline to weekly_plans table
ALTER TABLE public.weekly_plans
ADD COLUMN IF NOT EXISTS start_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deadline TIMESTAMPTZ;

alter table public.profiles
add column if not exists plan_generation_status smallint default 0;