import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migrationUrl = new URL(
  "../supabase/migrations/202608240001_member_moderation.sql",
  import.meta.url
);
const migration = await readFile(migrationUrl, "utf8");

test("migration upgrades existing member rows without losing approval state", () => {
  assert.match(migration, /alter table members add column if not exists status/);
  assert.match(migration, /case when is_approved then 'approved' else 'pending' end/);
  assert.match(migration, /members_status_check/);
});

test("moderation update and audit insert share one database function", () => {
  const functionBody = migration.match(
    /create or replace function moderate_member[\s\S]+?\n\$\$;/
  )?.[0];
  assert.ok(functionBody);
  assert.match(functionBody, /update members/);
  assert.match(functionBody, /insert into member_moderation_logs/);
  assert.match(functionBody, /p_actor_email/);
});

test("public roles cannot invoke the privileged moderation function", () => {
  assert.match(
    migration,
    /revoke all on function moderate_member\(uuid, text, text, text\) from public, anon, authenticated;/
  );
  assert.match(
    migration,
    /grant execute on function moderate_member\(uuid, text, text, text\) to service_role;/
  );
  assert.match(migration, /create trigger protect_member_moderation_fields/);
});
