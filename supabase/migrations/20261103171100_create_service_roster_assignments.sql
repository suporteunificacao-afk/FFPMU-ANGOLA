create table public.service_roster_assignments (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches(id),
  branch_id uuid,
  service_id uuid not null,
  member_id uuid not null,
  position_title text not null check (char_length(btrim(position_title)) between 2 and 120),
  notes text,
  display_order integer not null default 0,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint service_roster_assignments_member_church_fk foreign key (member_id, church_id) references public.members(id, church_id),
  constraint service_roster_assignments_service_church_fk foreign key (service_id, church_id) references public.church_services(id, church_id) on delete cascade,
  constraint service_roster_assignments_branch_fk foreign key (branch_id, church_id) references public.branches(id, church_id),
  constraint service_roster_assignments_member_unique unique (service_id, member_id, position_title)
);
create index service_roster_assignments_service_order_idx on public.service_roster_assignments(church_id, branch_id, service_id, display_order);
alter table public.service_roster_assignments enable row level security;
create policy "authorized users read service rosters" on public.service_roster_assignments for select to authenticated using (private.has_permission(church_id, 'members.read'));
create policy "authorized users create service rosters" on public.service_roster_assignments for insert to authenticated with check (private.has_permission(church_id, 'members.create'));
create policy "authorized users update service rosters" on public.service_roster_assignments for update to authenticated using (private.has_permission(church_id, 'members.update')) with check (private.has_permission(church_id, 'members.update'));
create policy "authorized users delete service rosters" on public.service_roster_assignments for delete to authenticated using (private.has_permission(church_id, 'members.delete'));