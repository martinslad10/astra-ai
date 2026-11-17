-- Autonomous Business Engine: isolated workspaces, leads, tasks and approval gates.
create table if not exists public.business_workspaces (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 120),
  business_type text not null default 'other' check (business_type in ('agency','digital_products','ecommerce','services','other')),
  description text not null default '' check (char_length(description) <= 2000),
  status text not null default 'planning' check (status in ('planning','active','paused','archived')),
  monthly_budget numeric(12,2) not null default 0 check (monthly_budget >= 0),
  autonomy_level text not null default 'approval' check (autonomy_level in ('approval','guarded_autonomous')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id)
);
create table if not exists public.business_leads (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  company_name text not null check (char_length(company_name) between 1 and 200),
  contact_name text,
  email text,
  website text,
  source text not null default 'manual',
  status text not null default 'new' check (status in ('new','qualified','contacted','replied','won','lost','do_not_contact')),
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (workspace_id, user_id) references public.business_workspaces(id, user_id) on delete cascade
);
create table if not exists public.business_tasks (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 240),
  description text not null default '',
  category text not null default 'operations' check (category in ('research','sales','delivery','marketing','finance','operations')),
  status text not null default 'todo' check (status in ('todo','in_progress','blocked','done')),
  priority text not null default 'normal' check (priority in ('low','normal','high','urgent')),
  due_at timestamptz,
  created_by text not null default 'user' check (created_by in ('user','ai')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (workspace_id, user_id) references public.business_workspaces(id, user_id) on delete cascade
);
create table if not exists public.business_approvals (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  action_type text not null check (action_type in ('outbound_campaign','send_message','contract','spend','refund','publish','other')),
  title text not null check (char_length(title) between 1 and 240),
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending','approved','rejected','executed','expired')),
  risk_level text not null default 'medium' check (risk_level in ('low','medium','high')),
  requested_at timestamptz not null default now(),
  decided_at timestamptz,
  decision_note text,
  foreign key (workspace_id, user_id) references public.business_workspaces(id, user_id) on delete cascade
);
create index if not exists business_workspaces_user_updated_idx on public.business_workspaces(user_id, updated_at desc);
create index if not exists business_leads_workspace_created_idx on public.business_leads(workspace_id, created_at desc);
create index if not exists business_tasks_workspace_status_idx on public.business_tasks(workspace_id, status, created_at desc);
create index if not exists business_approvals_user_status_idx on public.business_approvals(user_id, status, requested_at desc);
alter table public.business_workspaces enable row level security;
alter table public.business_leads enable row level security;
alter table public.business_tasks enable row level security;
alter table public.business_approvals enable row level security;
create policy "Users manage own business workspaces" on public.business_workspaces for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users manage own business leads" on public.business_leads for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users manage own business tasks" on public.business_tasks for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users manage own business approvals" on public.business_approvals for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
grant select, insert, update, delete on public.business_workspaces, public.business_leads, public.business_tasks, public.business_approvals to authenticated;
