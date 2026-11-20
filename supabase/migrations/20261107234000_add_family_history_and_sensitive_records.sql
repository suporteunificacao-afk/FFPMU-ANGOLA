-- Histórico familiar e registos de acesso restrito.
create table public.family_history_records (
 id uuid primary key default gen_random_uuid(),
 church_id uuid not null,
 family_id uuid not null,
 record_type text not null check (record_type in ('nascimento','bencao','alteracao_familiar','acompanhamento','outro')),
 event_date date not null default current_date,
 title text not null check (char_length(trim(title)) between 2 and 160),
 details text,
 related_member_id uuid,
 created_by uuid references public.profiles(id) on delete set null,
 created_at timestamptz not null default now(),
 constraint family_history_family_same_church foreign key (family_id,church_id) references public.families(id,church_id) on delete cascade,
 constraint family_history_member_same_church foreign key (related_member_id,church_id) references public.members(id,church_id) on delete set null
);
create index family_history_family_date_idx on public.family_history_records(family_id,event_date desc);
alter table public.family_history_records enable row level security;
create policy "family history read scoped" on public.family_history_records for select to authenticated
using (exists(select 1 from public.families f where f.id=family_history_records.family_id and f.church_id=family_history_records.church_id and private.has_permission_for_scope(f.church_id,'families.read',f.region_id,f.community_id,f.branch_id)));
create policy "family history create scoped" on public.family_history_records for insert to authenticated
with check (exists(select 1 from public.families f where f.id=family_history_records.family_id and f.church_id=family_history_records.church_id and private.has_permission_for_scope(f.church_id,'families.update',f.region_id,f.community_id,f.branch_id)));
create policy "family history delete scoped" on public.family_history_records for delete to authenticated
using (exists(select 1 from public.families f where f.id=family_history_records.family_id and f.church_id=family_history_records.church_id and private.has_permission_for_scope(f.church_id,'families.update',f.region_id,f.community_id,f.branch_id)));
grant select,insert,delete on public.family_history_records to authenticated;

create table public.family_sensitive_records (
 id uuid primary key default gen_random_uuid(),
 church_id uuid not null,
 family_id uuid not null,
 record_type text not null check (record_type in ('seonghwa','matching')),
 record_date date,
 title text not null check (char_length(trim(title)) between 2 and 160),
 details text,
 sensitivity_level text not null default 'restricted' check (sensitivity_level in ('restricted','highly_restricted')),
 created_by uuid references public.profiles(id) on delete set null,
 created_at timestamptz not null default now(),
 constraint family_sensitive_family_same_church foreign key (family_id,church_id) references public.families(id,church_id) on delete cascade
);
create index family_sensitive_family_idx on public.family_sensitive_records(family_id,record_date desc);
alter table public.family_sensitive_records enable row level security;
create policy "sensitive family records read authorized" on public.family_sensitive_records for select to authenticated
using (exists(select 1 from public.families f where f.id=family_sensitive_records.family_id and f.church_id=family_sensitive_records.church_id and private.has_permission_for_scope(f.church_id,'families.sensitive.read',f.region_id,f.community_id,f.branch_id)));
create policy "sensitive family records create authorized" on public.family_sensitive_records for insert to authenticated
with check (exists(select 1 from public.families f where f.id=family_sensitive_records.family_id and f.church_id=family_sensitive_records.church_id and private.has_permission_for_scope(f.church_id,'families.sensitive.read',f.region_id,f.community_id,f.branch_id)));
create policy "sensitive family records delete authorized" on public.family_sensitive_records for delete to authenticated
using (exists(select 1 from public.families f where f.id=family_sensitive_records.family_id and f.church_id=family_sensitive_records.church_id and private.has_permission_for_scope(f.church_id,'families.sensitive.read',f.region_id,f.community_id,f.branch_id)));
grant select,insert,delete on public.family_sensitive_records to authenticated;
