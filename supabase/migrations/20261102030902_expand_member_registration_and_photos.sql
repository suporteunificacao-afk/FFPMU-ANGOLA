-- Expandir o cadastro de membros conforme a ficha institucional FFPMU Angola.
create table public.families (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches(id) on delete cascade,
  branch_id uuid,
  family_name text not null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint families_branch_same_church
    foreign key (branch_id, church_id) references public.branches(id, church_id),
  unique (church_id, family_name)
);

create index families_church_name_idx on public.families(church_id, family_name);

alter table public.members
  add column family_id uuid references public.families(id) on delete set null,
  add column category text,
  add column spouse_name text,
  add column spouse_father_name text,
  add column spouse_mother_name text,
  add column naturality text,
  add column province text,
  add column municipality text,
  add column population text,
  add column civil_status text,
  add column nationality text,
  add column profession text,
  add column spiritual_parent text,
  add column seminar_2_days_date date,
  add column seminar_2_days_place text,
  add column seminar_7_days_date date,
  add column seminar_7_days_place text,
  add column seminar_21_days_date date,
  add column seminar_21_days_place text,
  add column seminar_40_days_date date,
  add column seminar_40_days_place text,
  add column public_life text,
  add column public_life_location text,
  add column blessing_date date,
  add column blessing_location text,
  add column blessing_fund text,
  add column fasting text,
  add column children_second_generation integer check (children_second_generation is null or children_second_generation >= 0),
  add column local_center text,
  add column intronization_date date,
  add column languages text[] not null default '{}',
  add column photo_path text;

alter table public.families enable row level security;

create policy "authorized users read families"
on public.families for select to authenticated
using (private.has_permission(church_id, 'members.read'));

create policy "authorized users create families"
on public.families for insert to authenticated
with check (private.has_permission(church_id, 'members.create'));

grant select, insert on public.families to authenticated;

insert into public.permissions(permission_key, description) values
('families.read', 'Consultar famílias')
on conflict (permission_key) do nothing;

insert into public.role_permissions(role_id, permission_id)
select ra.role_id, p.id
from public.role_assignments ra
join public.roles r on r.id = ra.role_id
cross join public.permissions p
where r.name = 'Administrador principal'
  and p.permission_key = 'families.read'
on conflict do nothing;

insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values ('member-photos', 'member-photos', false, 2097152, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update
set public = false, file_size_limit = 2097152,
    allowed_mime_types = array['image/jpeg','image/png','image/webp'];

create policy "members can read photos"
on storage.objects for select to authenticated
using (
  bucket_id = 'member-photos'
  and private.has_permission((storage.foldername(name))[1]::uuid, 'members.read')
);

create policy "authorized users upload member photos"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'member-photos'
  and private.has_permission((storage.foldername(name))[1]::uuid, 'members.create')
);

create policy "authorized users update member photos"
on storage.objects for update to authenticated
using (
  bucket_id = 'member-photos'
  and private.has_permission((storage.foldername(name))[1]::uuid, 'members.update')
)
with check (
  bucket_id = 'member-photos'
  and private.has_permission((storage.foldername(name))[1]::uuid, 'members.update')
);

create policy "authorized users delete member photos"
on storage.objects for delete to authenticated
using (
  bucket_id = 'member-photos'
  and private.has_permission((storage.foldername(name))[1]::uuid, 'members.update')
);
