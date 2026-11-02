-- Fase 1: núcleo multi-igreja e autorização por permissões.
-- Não executar antes de rever o projeto Supabase de destino.
create extension if not exists pgcrypto;

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create table public.churches (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  timezone text not null default 'Africa/Luanda',
  currency char(3) not null default 'AOA',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.branches (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches(id) on delete cascade,
  name text not null,
  address text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (church_id, name),
  unique (id, church_id)
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  church_id uuid references public.churches(id) on delete restrict,
  branch_id uuid,
  full_name text not null,
  phone text,
  avatar_path text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_branch_same_church
    foreign key (branch_id, church_id) references public.branches(id, church_id)
);

create table public.roles (
  id uuid primary key default gen_random_uuid(),
  church_id uuid references public.churches(id) on delete cascade,
  name text not null,
  description text,
  is_system boolean not null default false,
  created_at timestamptz not null default now(),
  unique (church_id, name)
);

create table public.permissions (
  id uuid primary key default gen_random_uuid(),
  permission_key text not null unique,
  description text not null
);

create table public.role_permissions (
  role_id uuid not null references public.roles(id) on delete cascade,
  permission_id uuid not null references public.permissions(id) on delete cascade,
  primary key (role_id, permission_id)
);

create table public.role_assignments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  role_id uuid not null references public.roles(id) on delete cascade,
  church_id uuid not null references public.churches(id) on delete cascade,
  branch_id uuid,
  department_id uuid,
  assigned_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint role_assignment_branch_same_church
    foreign key (branch_id, church_id) references public.branches(id, church_id)
);
create index role_assignments_user_church_idx on public.role_assignments(user_id, church_id);

create table public.members (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches(id) on delete cascade,
  branch_id uuid,
  member_code text,
  full_name text not null,
  gender text,
  birth_date date,
  phone text,
  whatsapp text,
  email text,
  address text,
  joined_at date,
  baptized_at date,
  status text not null default 'em_integracao'
    check (status in ('visitante','em_integracao','ativo','inativo','transferido')),
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint members_branch_same_church
    foreign key (branch_id, church_id) references public.branches(id, church_id),
  unique (church_id, member_code)
);
create index members_church_name_idx on public.members(church_id, full_name);
create index members_church_status_idx on public.members(church_id, status);

-- Verifica a permissão atribuída no servidor/banco, nunca em user_metadata.
create or replace function private.has_permission(_church_id uuid, _permission_key text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.role_assignments ra
    join public.role_permissions rp on rp.role_id = ra.role_id
    join public.permissions p on p.id = rp.permission_id
    join public.profiles pr on pr.id = ra.user_id
    where ra.user_id = (select auth.uid())
      and ra.church_id = _church_id
      and pr.is_active = true
      and p.permission_key = _permission_key
  );
$$;
revoke all on function private.has_permission(uuid, text) from public;
grant execute on function private.has_permission(uuid, text) to authenticated;

alter table public.churches enable row level security;
alter table public.branches enable row level security;
alter table public.profiles enable row level security;
alter table public.roles enable row level security;
alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;
alter table public.role_assignments enable row level security;
alter table public.members enable row level security;

create policy "church members can read their church"
on public.churches for select to authenticated
using (private.has_permission(id, 'church.read') or exists (
  select 1 from public.profiles p where p.id = (select auth.uid()) and p.church_id = churches.id
));

create policy "authorized users read branches"
on public.branches for select to authenticated
using (private.has_permission(church_id, 'branches.read'));

create policy "users read own profile or authorized profiles"
on public.profiles for select to authenticated
using (id = (select auth.uid()) or (church_id is not null and private.has_permission(church_id, 'profiles.read')));

create policy "authorized users read roles"
on public.roles for select to authenticated
using (church_id is not null and private.has_permission(church_id, 'roles.read'));

create policy "authenticated users read permission catalogue"
on public.permissions for select to authenticated
using (true);

create policy "authorized users read role permissions"
on public.role_permissions for select to authenticated
using (exists (
  select 1 from public.roles r
  where r.id = role_permissions.role_id
    and r.church_id is not null
    and private.has_permission(r.church_id, 'roles.read')
));

create policy "users read own role assignments or authorized assignments"
on public.role_assignments for select to authenticated
using (user_id = (select auth.uid()) or private.has_permission(church_id, 'roles.read'));

create policy "authorized users read members"
on public.members for select to authenticated
using (private.has_permission(church_id, 'members.read'));

create policy "authorized users create members"
on public.members for insert to authenticated
with check (private.has_permission(church_id, 'members.create'));

create policy "authorized users update members"
on public.members for update to authenticated
using (private.has_permission(church_id, 'members.update'))
with check (private.has_permission(church_id, 'members.update'));

create policy "authorized users archive members"
on public.members for delete to authenticated
using (private.has_permission(church_id, 'members.delete'));

grant select on public.churches, public.branches, public.profiles, public.roles,
  public.permissions, public.role_permissions, public.role_assignments, public.members
to authenticated;
grant insert, update, delete on public.members to authenticated;

-- O primeiro superadministrador e as funções iniciais serão provisionados
-- por procedimento administrativo controlado após criar a igreja e confirmar o owner.
