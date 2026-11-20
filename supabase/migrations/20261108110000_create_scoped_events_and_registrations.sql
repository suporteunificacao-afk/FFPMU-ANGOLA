create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches(id) on delete cascade,
  region_id uuid references public.regions(id) on delete restrict,
  community_id uuid references public.communities(id) on delete restrict,
  branch_id uuid references public.branches(id) on delete restrict,
  title text not null check (char_length(title) between 2 and 180),
  description text,
  event_type text not null default 'Outro',
  starts_at timestamptz not null,
  ends_at timestamptz,
  location text,
  is_public boolean not null default false,
  registration_required boolean not null default false,
  capacity integer check (capacity is null or capacity > 0),
  status text not null default 'Agendado' check (status in ('Agendado','Em curso','Realizado','Cancelado')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint events_end_after_start check (ends_at is null or ends_at > starts_at),
  constraint events_church_id_id_unique unique (church_id,id)
);

create index if not exists events_church_starts_idx on public.events(church_id,starts_at desc);
create index if not exists events_branch_starts_idx on public.events(branch_id,starts_at desc);

create table if not exists public.event_registrations (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null,
  event_id uuid not null,
  member_id uuid,
  participant_name text not null check (char_length(participant_name) between 2 and 180),
  phone text,
  email text,
  notes text,
  status text not null default 'Inscrito' check (status in ('Inscrito','Confirmado','Presente','Cancelado')),
  registered_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint event_registrations_event_same_church foreign key (church_id,event_id)
    references public.events(church_id,id) on delete cascade,
  constraint event_registrations_member_same_church foreign key (church_id,member_id)
    references public.members(church_id,id) on delete set null (member_id)
);

create index if not exists event_registrations_event_idx on public.event_registrations(church_id,event_id,created_at desc);
create unique index if not exists event_registrations_member_once_idx on public.event_registrations(event_id,member_id) where member_id is not null;

alter table public.events enable row level security;
alter table public.event_registrations enable row level security;

insert into public.permissions(permission_key,description) values
 ('events.read','Consultar eventos e inscrições'),
 ('events.create','Criar eventos e inscrever participantes'),
 ('events.update','Actualizar eventos e inscrições'),
 ('events.delete','Eliminar eventos e inscrições')
on conflict(permission_key) do nothing;

insert into public.role_permissions(role_id,permission_id)
select r.id,p.id from public.roles r cross join public.permissions p
where r.name in ('Administrador Nacional','Responsável Regional','Responsável Local','Administrador principal')
and p.permission_key in ('events.read','events.create','events.update','events.delete')
on conflict(role_id,permission_id) do nothing;

drop policy if exists events_read_scoped on public.events;
create policy events_read_scoped on public.events for select to authenticated using (
 private.has_permission_for_scope(church_id,'events.read',region_id,community_id,branch_id)
);
drop policy if exists events_create_scoped on public.events;
create policy events_create_scoped on public.events for insert to authenticated with check (
 private.has_permission_for_scope(church_id,'events.create',region_id,community_id,branch_id)
);
drop policy if exists events_update_scoped on public.events;
create policy events_update_scoped on public.events for update to authenticated using (
 private.has_permission_for_scope(church_id,'events.update',region_id,community_id,branch_id)
) with check (
 private.has_permission_for_scope(church_id,'events.update',region_id,community_id,branch_id)
);
drop policy if exists events_delete_scoped on public.events;
create policy events_delete_scoped on public.events for delete to authenticated using (
 private.has_permission_for_scope(church_id,'events.delete',region_id,community_id,branch_id)
);

drop policy if exists event_registrations_read_scoped on public.event_registrations;
create policy event_registrations_read_scoped on public.event_registrations for select to authenticated using (
 exists (select 1 from public.events e where e.id=event_id and e.church_id=church_id
 and private.has_permission_for_scope(e.church_id,'events.read',e.region_id,e.community_id,e.branch_id))
);
drop policy if exists event_registrations_create_scoped on public.event_registrations;
create policy event_registrations_create_scoped on public.event_registrations for insert to authenticated with check (
 exists (select 1 from public.events e where e.id=event_id and e.church_id=church_id
 and private.has_permission_for_scope(e.church_id,'events.create',e.region_id,e.community_id,e.branch_id))
);
drop policy if exists event_registrations_update_scoped on public.event_registrations;
create policy event_registrations_update_scoped on public.event_registrations for update to authenticated using (
 exists (select 1 from public.events e where e.id=event_id and e.church_id=church_id
 and private.has_permission_for_scope(e.church_id,'events.update',e.region_id,e.community_id,e.branch_id))
) with check (
 exists (select 1 from public.events e where e.id=event_id and e.church_id=church_id
 and private.has_permission_for_scope(e.church_id,'events.update',e.region_id,e.community_id,e.branch_id))
);
drop policy if exists event_registrations_delete_scoped on public.event_registrations;
create policy event_registrations_delete_scoped on public.event_registrations for delete to authenticated using (
 exists (select 1 from public.events e where e.id=event_id and e.church_id=church_id
 and private.has_permission_for_scope(e.church_id,'events.delete',e.region_id,e.community_id,e.branch_id))
);
