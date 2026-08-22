create table if not exists plans (
  id uuid primary key default gen_random_uuid(),
  scene_name text not null,
  budget text not null,
  precision_requirement text not null,
  communication text not null,
  power_supply text not null,
  devices jsonb not null default '[]'::jsonb,
  topology text not null default '',
  total_cost numeric not null default 0,
  code_suggestion jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table plans enable row level security;

-- Anonymous users can view and insert plans (open IoT tool, no login required)
create policy "anon_select_plans" on plans
  for select to anon using (true);

create policy "anon_insert_plans" on plans
  for insert to anon with check (true);

-- Authenticated users have full access
create policy "auth_select_plans" on plans
  for select to authenticated using (true);

create policy "auth_insert_plans" on plans
  for insert to authenticated with check (true);

create policy "auth_update_plans" on plans
  for update to authenticated using (true) with check (true);

create policy "auth_delete_plans" on plans
  for delete to authenticated using (true);

-- Admin service role bypasses RLS by default, but explicit policy for completeness
create policy "admin_all_plans" on plans
  for all to authenticated using (true) with check (true);