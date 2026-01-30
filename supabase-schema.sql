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
  created_at timestamp with time zone default now()
);

-- Projects table
create table projects (
  id uuid default gen_random_uuid() primary key,
  member_id uuid references members(id) on delete cascade,
  title text not null,
  description text,
  url text not null,
  clicks integer default 0,
  created_at timestamp with time zone default now()
);

-- Enable Row Level Security
alter table members enable row level security;
alter table projects enable row level security;

-- Public can view approved members
create policy "Public can view approved members"
  on members for select
  using (is_approved = true);

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

-- Authenticated users can insert their own member profile
create policy "Users can insert own profile"
  on members for insert
  with check (auth.email() = email);

-- Members can update their own profile
create policy "Members can update own profile"
  on members for update
  using (auth.email() = email);

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
