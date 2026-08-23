-- Members table
create table members (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  slug text unique not null,
  bio text,
  image_url text,
  twitter text,
  github text,
  linkedin text,
  website text,
  email text unique not null,
  is_approved boolean default false,
  status text default 'pending',
  rejection_reason text,
  reviewed_at timestamp with time zone,
  reviewed_by uuid references members(id) on delete set null,
  created_at timestamp with time zone default now()
);

-- Moderation columns for existing installations
alter table members add column if not exists status text default 'pending';
alter table members add column if not exists rejection_reason text;
alter table members add column if not exists reviewed_at timestamp with time zone;
alter table members add column if not exists reviewed_by uuid references members(id) on delete set null;

update members
set status = case when is_approved then 'approved' else 'pending' end
where status is null or (is_approved and status = 'pending');

alter table members alter column status set default 'pending';
alter table members alter column status set not null;

-- Projects table
create table projects (
  id uuid default gen_random_uuid() primary key,
  member_id uuid references members(id) on delete cascade,
  title text not null,
  description text,
  url text not null,
  web_url text,
  apple_url text,
  android_url text,
  clicks integer default 0,
  is_archived boolean default false,
  created_at timestamp with time zone default now()
);

-- Data constraints (safe to run multiple times)
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'members_slug_format_check'
  ) then
    alter table members
      add constraint members_slug_format_check
      check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$');
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'members_bio_length_check'
  ) then
    alter table members
      add constraint members_bio_length_check
      check (bio is null or length(bio) <= 280);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'members_status_check'
  ) then
    alter table members
      add constraint members_status_check
      check (status in ('pending', 'approved', 'rejected', 'revoked'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'projects_title_length_check'
  ) then
    alter table projects
      add constraint projects_title_length_check
      check (length(title) <= 80);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'projects_description_length_check'
  ) then
    alter table projects
      add constraint projects_description_length_check
      check (description is null or length(description) <= 200);
  end if;
end $$;

create unique index if not exists projects_member_url_idx on projects(member_id, url);
create unique index if not exists projects_member_web_url_idx on projects(member_id, web_url);
create unique index if not exists projects_member_apple_url_idx on projects(member_id, apple_url);
create unique index if not exists projects_member_android_url_idx on projects(member_id, android_url);

-- Enable Row Level Security
alter table members enable row level security;
alter table projects enable row level security;

-- Public can view approved members
create policy "Public can view approved members"
  on members for select
  using (is_approved = true);

-- Members can view their own profile (even if not approved)
create policy "Members can view own profile"
  on members for select
  using (auth.email() = email);

-- Admins can view ALL members (replace with your admin emails)
-- To add admins: UPDATE this policy or add emails to NEXT_PUBLIC_ADMIN_EMAILS env var
create policy "Admins can view all members"
  on members for select
  using (
    auth.email() = any(string_to_array(current_setting('app.admin_emails', true), ','))
    OR auth.email() IN ('admin@example.com')  -- Add your admin email here
  );

-- Admins can update any member (for approval/revoke)
create policy "Admins can update all members"
  on members for update
  using (
    auth.email() IN ('admin@example.com')  -- Add your admin email here
  );

-- Admins can delete any member
create policy "Admins can delete all members"
  on members for delete
  using (
    auth.email() IN ('admin@example.com')  -- Add your admin email here
  );

-- Public can view projects of approved members
create policy "Public can view projects of approved members"
  on projects for select
  using (
    exists (
      select 1 from members
      where members.id = projects.member_id
      and members.is_approved = true
    )
  );

-- Members can view their own projects (even if not approved)
create policy "Members can view own projects"
  on projects for select
  using (
    exists (
      select 1 from members
      where members.id = projects.member_id
      and members.email = auth.email()
    )
  );

-- Authenticated users can insert their own member profile
create policy "Users can insert own profile"
  on members for insert
  with check (auth.email() = email);

-- Members can update their own profile
create policy "Members can update own profile"
  on members for update
  using (auth.email() = email);

-- Moderation audit log
create table if not exists member_moderation_logs (
  id uuid default gen_random_uuid() primary key,
  member_id uuid references members(id) on delete set null,
  action text not null check (action in ('approved', 'rejected', 'revoked')),
  reason text,
  actor_email text not null,
  created_at timestamp with time zone default now()
);

alter table member_moderation_logs alter column member_id drop not null;
alter table member_moderation_logs
  drop constraint if exists member_moderation_logs_member_id_fkey;
alter table member_moderation_logs
  add constraint member_moderation_logs_member_id_fkey
  foreign key (member_id) references members(id) on delete set null;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'member_moderation_logs_action_check'
  ) then
    alter table member_moderation_logs
      add constraint member_moderation_logs_action_check
      check (action in ('approved', 'rejected', 'revoked'));
  end if;
end $$;

alter table member_moderation_logs enable row level security;

drop policy if exists "Admins can view moderation logs" on member_moderation_logs;
create policy "Admins can view moderation logs"
  on member_moderation_logs for select
  using (
    auth.email() = any(regexp_split_to_array(current_setting('app.admin_emails', true), '\s*,\s*'))
  );

drop policy if exists "Admins can insert moderation logs" on member_moderation_logs;

-- Prevent authenticated members from changing moderation-only fields through the public client.
create or replace function protect_member_moderation_fields()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if auth.role() = 'authenticated' and tg_op = 'INSERT' and (
    new.is_approved is distinct from false
    or new.status is distinct from 'pending'
    or new.rejection_reason is not null
    or new.reviewed_at is not null
    or new.reviewed_by is not null
  ) then
    raise exception 'new members must start with pending moderation state'
      using errcode = '42501';
  end if;

  if auth.role() = 'authenticated' and tg_op = 'UPDATE' and (
    new.is_approved is distinct from old.is_approved
    or new.status is distinct from old.status
    or new.rejection_reason is distinct from old.rejection_reason
    or new.reviewed_at is distinct from old.reviewed_at
    or new.reviewed_by is distinct from old.reviewed_by
  ) then
    raise exception 'moderation fields can only be changed by the admin API'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists protect_member_moderation_fields on members;
create trigger protect_member_moderation_fields
before insert or update on members
for each row execute function protect_member_moderation_fields();

-- Atomically change moderation state and append its audit record. Only the
-- server-side service role can invoke this function.
create or replace function moderate_member(
  p_member_id uuid,
  p_action text,
  p_reason text,
  p_actor_email text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_member members%rowtype;
  reviewer_id uuid;
begin
  if p_action not in ('approved', 'rejected', 'revoked') then
    raise exception 'invalid moderation action' using errcode = '22023';
  end if;

  if p_action = 'rejected' and nullif(btrim(p_reason), '') is null then
    raise exception 'a rejection reason is required' using errcode = '22023';
  end if;

  if p_action = 'rejected' and char_length(btrim(p_reason)) > 500 then
    raise exception 'rejection reason is too long' using errcode = '22023';
  end if;

  if p_actor_email is null or nullif(btrim(p_actor_email), '') is null then
    raise exception 'actor email is required' using errcode = '22023';
  end if;

  select id into reviewer_id
  from members
  where lower(email) = lower(p_actor_email)
  limit 1;

  update members
  set is_approved = (p_action = 'approved'),
      status = p_action,
      rejection_reason = case when p_action = 'rejected' then btrim(p_reason) else null end,
      reviewed_at = now(),
      reviewed_by = reviewer_id
  where id = p_member_id
  returning * into updated_member;

  if not found then
    return null;
  end if;

  insert into member_moderation_logs (member_id, action, reason, actor_email)
  values (
    p_member_id,
    p_action,
    case when p_action = 'rejected' then btrim(p_reason) else null end,
    lower(p_actor_email)
  );

  return jsonb_build_object(
    'id', updated_member.id,
    'is_approved', updated_member.is_approved,
    'status', updated_member.status,
    'rejection_reason', updated_member.rejection_reason,
    'reviewed_at', updated_member.reviewed_at,
    'reviewed_by', updated_member.reviewed_by
  );
end;
$$;

revoke all on function moderate_member(uuid, text, text, text) from public, anon, authenticated;
grant execute on function moderate_member(uuid, text, text, text) to service_role;

-- Members can insert their own projects
create policy "Members can insert own projects"
  on projects for insert
  with check (
    exists (
      select 1 from members
      where members.id = projects.member_id
      and members.email = auth.email()
    )
  );

-- Members can update their own projects
create policy "Members can update own projects"
  on projects for update
  using (
    exists (
      select 1 from members
      where members.id = projects.member_id
      and members.email = auth.email()
    )
  );

-- Members can delete their own projects
create policy "Members can delete own projects"
  on projects for delete
  using (
    exists (
      select 1 from members
      where members.id = projects.member_id
      and members.email = auth.email()
    )
  );

-- Create index for faster slug lookups
create index members_slug_idx on members(slug);
create index projects_member_id_idx on projects(member_id);

-- Project votes table (tracks who voted and when)
create table if not exists project_votes (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references projects(id) on delete cascade,
  voter_ip text not null,
  voted_at timestamp with time zone default now(),
  unique(project_id, voter_ip)
);

-- Enable RLS on votes
alter table project_votes enable row level security;

-- Anyone can insert votes
create policy "Anyone can vote"
  on project_votes for insert
  with check (true);

-- Anyone can view votes
create policy "Anyone can view votes"
  on project_votes for select
  using (true);

-- Index for faster vote queries by month
create index if not exists project_votes_project_id_idx on project_votes(project_id);
create index if not exists project_votes_voted_at_idx on project_votes(voted_at);

-- Function to increment clicks
create or replace function increment_clicks(project_id uuid)
returns void as $$
begin
  update projects set clicks = clicks + 1 where id = project_id;
end;
$$ language plpgsql;

-- Function to get monthly vote count for a project
create or replace function get_monthly_votes(p_project_id uuid)
returns integer as $$
begin
  return (
    select count(*)::integer
    from project_votes
    where project_id = p_project_id
    and voted_at >= date_trunc('month', now())
    and voted_at < date_trunc('month', now()) + interval '1 month'
  );
end;
$$ language plpgsql;

-- View for projects with monthly vote counts
create or replace view projects_with_monthly_votes as
select
  p.*,
  coalesce((
    select count(*)
    from project_votes pv
    where pv.project_id = p.id
    and pv.voted_at >= date_trunc('month', now())
    and pv.voted_at < date_trunc('month', now()) + interval '1 month'
  ), 0)::integer as monthly_votes
from projects p;

-- ==========================================
-- POINTS SYSTEM
-- ==========================================

-- Add points column to members table
alter table members add column if not exists points integer default 0;

-- Point transactions table (audit trail)
create table if not exists point_transactions (
  id uuid default gen_random_uuid() primary key,
  member_id uuid references members(id) on delete cascade,
  points integer not null,
  reason text not null,
  source text not null, -- 'vote', 'click', 'project', 'admin', 'joined'
  project_id uuid references projects(id) on delete set null,
  awarded_by uuid references members(id) on delete set null, -- for admin awards
  created_at timestamp with time zone default now()
);

-- Enable RLS on point_transactions
alter table point_transactions enable row level security;

-- Public can view all transactions
create policy "Public can view point transactions"
  on point_transactions for select
  using (true);

-- System can insert point transactions (via function)
create policy "System can insert point transactions"
  on point_transactions for insert
  with check (true);

-- Index for faster point transaction queries
create index if not exists point_transactions_member_id_idx on point_transactions(member_id);
create index if not exists point_transactions_created_at_idx on point_transactions(created_at);

-- Function to award points to a member
create or replace function award_points(
  p_member_id uuid,
  p_points integer,
  p_reason text,
  p_source text,
  p_project_id uuid default null,
  p_awarded_by uuid default null
)
returns void as $$
declare
  daily_cap integer;
  daily_total integer;
begin
  -- Caps for automated sources
  if p_source = 'click' then
    daily_cap := 50;
  elsif p_source = 'vote' then
    daily_cap := 100;
  else
    daily_cap := null;
  end if;

  if daily_cap is not null then
    select coalesce(sum(points), 0)
      into daily_total
      from point_transactions
     where member_id = p_member_id
       and source = p_source
       and created_at >= date_trunc('day', now())
       and created_at < date_trunc('day', now()) + interval '1 day';

    if daily_total + p_points > daily_cap then
      return;
    end if;
  end if;

  -- Insert transaction record
  insert into point_transactions (member_id, points, reason, source, project_id, awarded_by)
  values (p_member_id, p_points, p_reason, p_source, p_project_id, p_awarded_by);

  -- Update member's total points
  update members set points = points + p_points where id = p_member_id;
end;
$$ language plpgsql security definer;
