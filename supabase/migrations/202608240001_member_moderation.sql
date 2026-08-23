begin;

alter table members add column if not exists status text default 'pending';
alter table members add column if not exists rejection_reason text;
alter table members add column if not exists reviewed_at timestamp with time zone;
alter table members add column if not exists reviewed_by uuid references members(id) on delete set null;

update members
set status = case when is_approved then 'approved' else 'pending' end
where status is null or (is_approved and status = 'pending');

alter table members alter column status set default 'pending';
alter table members alter column status set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'members_status_check'
  ) then
    alter table members
      add constraint members_status_check
      check (status in ('pending', 'approved', 'rejected', 'revoked'));
  end if;
end $$;

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

commit;
