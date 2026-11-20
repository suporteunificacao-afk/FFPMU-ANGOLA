begin;

alter table public.visitors
  add constraint visitors_id_church_unique unique (id, church_id);

create table public.service_attendance (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches(id) on delete cascade,
  branch_id uuid,
  service_id uuid not null,
  member_id uuid,
  visitor_id uuid,
  guest_name text check (guest_name is null or char_length(btrim(guest_name)) between 2 and 160),
  status text not null default 'Presente' check (status in ('Presente', 'Ausente', 'Justificada')),
  notes text check (notes is null or char_length(notes) <= 1000),
  marked_by uuid references auth.users(id) on delete set null,
  marked_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint service_attendance_service_same_church
    foreign key (service_id, church_id) references public.church_services(id, church_id) on delete cascade,
  constraint service_attendance_member_same_church
    foreign key (member_id, church_id) references public.members(id, church_id) on delete restrict,
  constraint service_attendance_visitor_same_church
    foreign key (visitor_id, church_id) references public.visitors(id, church_id) on delete restrict,
  constraint service_attendance_branch_same_church
    foreign key (branch_id, church_id) references public.branches(id, church_id) on delete cascade,
  constraint service_attendance_exactly_one_person
    check (num_nonnulls(member_id, visitor_id, guest_name) = 1)
);

create unique index service_attendance_member_once
  on public.service_attendance (service_id, member_id) where member_id is not null;
create unique index service_attendance_visitor_once
  on public.service_attendance (service_id, visitor_id) where visitor_id is not null;
create unique index service_attendance_guest_once
  on public.service_attendance (service_id, lower(guest_name)) where guest_name is not null;
create index service_attendance_service_scope_idx
  on public.service_attendance (church_id, branch_id, service_id, status);
create index service_attendance_member_idx
  on public.service_attendance (church_id, member_id) where member_id is not null;

alter table public.service_attendance enable row level security;
grant select, insert, update, delete on public.service_attendance to authenticated;

create policy "scoped users read service attendance"
  on public.service_attendance for select to authenticated
  using (private.has_permission_for_scope(church_id, 'members.read', null, null, branch_id));
create policy "scoped users create service attendance"
  on public.service_attendance for insert to authenticated
  with check (private.has_permission_for_scope(church_id, 'members.create', null, null, branch_id));
create policy "scoped users update service attendance"
  on public.service_attendance for update to authenticated
  using (private.has_permission_for_scope(church_id, 'members.update', null, null, branch_id))
  with check (private.has_permission_for_scope(church_id, 'members.update', null, null, branch_id));
create policy "scoped users delete service attendance"
  on public.service_attendance for delete to authenticated
  using (private.has_permission_for_scope(church_id, 'members.delete', null, null, branch_id));

commit;
