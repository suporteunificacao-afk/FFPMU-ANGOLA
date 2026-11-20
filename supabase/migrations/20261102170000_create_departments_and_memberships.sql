-- Department teams reference existing member records; no duplicate member profiles are created.
alter table public.members
  add constraint members_id_church_unique unique (id, church_id);

create table public.departments (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches(id),
  branch_id uuid,
  name text not null check (char_length(btrim(name)) between 2 and 120),
  description text,
  is_active boolean not null default true,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint departments_id_church_unique unique (id, church_id),
  constraint departments_branch_same_church foreign key (branch_id, church_id) references public.branches(id, church_id)
);
create unique index departments_church_name_lower_idx on public.departments(church_id, lower(name));

create table public.department_members (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches(id),
  department_id uuid not null,
  member_id uuid not null,
  position_title text not null check (char_length(btrim(position_title)) between 1 and 120),
  display_order integer not null default 1 check (display_order > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint department_members_department_same_church foreign key (department_id, church_id) references public.departments(id, church_id),
  constraint department_members_member_same_church foreign key (member_id, church_id) references public.members(id, church_id),
  constraint department_members_unique_member unique (department_id, member_id),
  constraint department_members_unique_order unique (department_id, display_order)
);
create index department_members_church_department_idx on public.department_members(church_id, department_id, display_order);

alter table public.departments enable row level security;
alter table public.department_members enable row level security;
create policy "authorized users read departments" on public.departments for select to authenticated using (private.has_permission(church_id, 'members.read'));
create policy "authorized users create departments" on public.departments for insert to authenticated with check (private.has_permission(church_id, 'members.create'));
create policy "authorized users update departments" on public.departments for update to authenticated using (private.has_permission(church_id, 'members.update')) with check (private.has_permission(church_id, 'members.update'));
create policy "authorized users delete departments" on public.departments for delete to authenticated using (private.has_permission(church_id, 'members.delete'));
create policy "authorized users read department members" on public.department_members for select to authenticated using (private.has_permission(church_id, 'members.read'));
create policy "authorized users create department members" on public.department_members for insert to authenticated with check (private.has_permission(church_id, 'members.create'));
create policy "authorized users update department members" on public.department_members for update to authenticated using (private.has_permission(church_id, 'members.update')) with check (private.has_permission(church_id, 'members.update'));
create policy "authorized users delete department members" on public.department_members for delete to authenticated using (private.has_permission(church_id, 'members.delete'));
