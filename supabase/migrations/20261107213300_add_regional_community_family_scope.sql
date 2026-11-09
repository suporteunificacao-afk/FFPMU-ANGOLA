-- Estrutura organizacional nacional, regional e local com escopo de autorização.
create table public.regions (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches(id) on delete cascade,
  name text not null,
  code text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (church_id, name),
  unique (id, church_id)
);

create table public.communities (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches(id) on delete cascade,
  region_id uuid not null,
  name text not null,
  code text,
  address text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint communities_region_same_church foreign key (region_id, church_id) references public.regions(id, church_id) on delete restrict,
  unique (region_id, name),
  unique (id, church_id)
);

alter table public.branches add column region_id uuid, add column community_id uuid;
alter table public.branches
  add constraint branches_region_same_church foreign key (region_id, church_id) references public.regions(id, church_id) on delete restrict,
  add constraint branches_community_same_church foreign key (community_id, church_id) references public.communities(id, church_id) on delete restrict;

alter table public.role_assignments add column region_id uuid, add column community_id uuid;
alter table public.role_assignments
  add constraint role_assignments_region_same_church foreign key (region_id, church_id) references public.regions(id, church_id) on delete restrict,
  add constraint role_assignments_community_same_church foreign key (community_id, church_id) references public.communities(id, church_id) on delete restrict;

create sequence if not exists public.family_code_seq start 1;
alter table public.families
  add column family_code text,
  add column status text not null default 'active' check (status in ('pending','validation','active','incomplete','suspended','archived')),
  add column phone text,
  add column email text,
  add column address text,
  add column blessing_date date,
  add column notes text,
  add column region_id uuid,
  add column community_id uuid;
alter table public.families
  add constraint families_region_same_church foreign key (region_id, church_id) references public.regions(id, church_id) on delete restrict,
  add constraint families_community_same_church foreign key (community_id, church_id) references public.communities(id, church_id) on delete restrict;

create or replace function private.assign_family_code()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.family_code is null or btrim(new.family_code) = '' then
    new.family_code := 'FFPMU-' || lpad(nextval('public.family_code_seq')::text, 6, '0');
  end if;
  return new;
end;
$$;

update public.families
set family_code = 'FFPMU-' || lpad(nextval('public.family_code_seq')::text, 6, '0')
where family_code is null;
create unique index families_church_family_code_uidx on public.families(church_id, family_code);
create trigger families_assign_code_before_insert before insert on public.families
for each row execute function private.assign_family_code();

create index communities_region_idx on public.communities(region_id);
create index branches_community_idx on public.branches(community_id);
create index families_region_idx on public.families(region_id);
create index families_community_idx on public.families(community_id);
create index role_assignments_scope_idx on public.role_assignments(user_id, church_id, region_id, community_id, branch_id);

create or replace function private.has_permission_for_scope(
  _church_id uuid, _permission_key text,
  _region_id uuid default null, _community_id uuid default null, _branch_id uuid default null
)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.role_assignments ra
    join public.role_permissions rp on rp.role_id = ra.role_id
    join public.permissions p on p.id = rp.permission_id
    join public.profiles pr on pr.id = ra.user_id
    where ra.user_id = (select auth.uid())
      and ra.church_id = _church_id and pr.is_active = true
      and p.permission_key = _permission_key
      and (
        (ra.region_id is null and ra.community_id is null and ra.branch_id is null)
        or (ra.region_id is not null and ra.region_id = _region_id and ra.community_id is null and ra.branch_id is null)
        or (ra.community_id is not null and ra.community_id = _community_id and ra.branch_id is null)
        or (ra.branch_id is not null and ra.branch_id = _branch_id)
      )
  );
$$;
revoke all on function private.has_permission_for_scope(uuid,text,uuid,uuid,uuid) from public;
grant execute on function private.has_permission_for_scope(uuid,text,uuid,uuid,uuid) to authenticated;

alter table public.regions enable row level security;
alter table public.communities enable row level security;
create policy "authorized users read regions" on public.regions for select to authenticated
using (private.has_permission_for_scope(church_id,'organization.read',id,null,null) or private.has_permission(church_id,'branches.read'));
create policy "authorized users manage regions" on public.regions for all to authenticated
using (private.has_permission(church_id,'organization.manage'))
with check (private.has_permission(church_id,'organization.manage'));
create policy "authorized users read communities" on public.communities for select to authenticated
using (private.has_permission_for_scope(church_id,'organization.read',region_id,id,null) or private.has_permission(church_id,'branches.read'));
create policy "authorized users manage communities" on public.communities for all to authenticated
using (private.has_permission(church_id,'organization.manage'))
with check (private.has_permission(church_id,'organization.manage'));

drop policy if exists "authorized users read branches" on public.branches;
create policy "authorized users read branches" on public.branches for select to authenticated
using (private.has_permission_for_scope(church_id,'branches.read',region_id,community_id,id) or private.has_permission(church_id,'organization.manage'));

drop policy if exists "authorized users read families" on public.families;
drop policy if exists "authorized users create families" on public.families;
drop policy if exists "authorized users update families" on public.families;
create policy "authorized users read families" on public.families for select to authenticated
using (private.has_permission_for_scope(church_id,'families.read',region_id,community_id,branch_id));
create policy "authorized users create families" on public.families for insert to authenticated
with check (private.has_permission_for_scope(church_id,'families.create',region_id,community_id,branch_id));
create policy "authorized users update families" on public.families for update to authenticated
using (private.has_permission_for_scope(church_id,'families.update',region_id,community_id,branch_id))
with check (private.has_permission_for_scope(church_id,'families.update',region_id,community_id,branch_id));
create policy "authorized users archive families" on public.families for delete to authenticated
using (private.has_permission_for_scope(church_id,'families.archive',region_id,community_id,branch_id));

drop policy if exists "authorized users read members" on public.members;
drop policy if exists "authorized users create members" on public.members;
drop policy if exists "authorized users update members" on public.members;
drop policy if exists "authorized users archive members" on public.members;
create policy "authorized users read members" on public.members for select to authenticated
using (private.has_permission_for_scope(church_id,'members.read',null,null,branch_id));
create policy "authorized users create members" on public.members for insert to authenticated
with check (private.has_permission_for_scope(church_id,'members.create',null,null,branch_id));
create policy "authorized users update members" on public.members for update to authenticated
using (private.has_permission_for_scope(church_id,'members.update',null,null,branch_id))
with check (private.has_permission_for_scope(church_id,'members.update',null,null,branch_id));
create policy "authorized users archive members" on public.members for delete to authenticated
using (private.has_permission_for_scope(church_id,'members.delete',null,null,branch_id));

insert into public.permissions(permission_key,description) values
('organization.read','Consultar regiões e comunidades'),
('organization.manage','Gerir regiões, comunidades e congregações'),
('families.read','Consultar famílias na área atribuída'),
('families.create','Criar famílias na área atribuída'),
('families.update','Actualizar famílias na área atribuída'),
('families.archive','Arquivar famílias na área atribuída'),
('families.sensitive.read','Consultar registos familiares sensíveis')
on conflict(permission_key) do nothing;

insert into public.role_permissions(role_id,permission_id)
select r.id,p.id from public.roles r cross join public.permissions p
where r.is_system = true and p.permission_key in (
  'organization.read','organization.manage','families.read','families.create',
  'families.update','families.archive','families.sensitive.read'
) on conflict do nothing;

grant select, insert, update, delete on public.regions, public.communities to authenticated;
grant select, update on public.branches to authenticated;
grant select, insert, update, delete on public.families to authenticated;
