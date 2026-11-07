-- Relações entre pessoas pertencentes ao mesmo agregado familiar.
create table public.family_relationships (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null,
  family_id uuid not null,
  member_id uuid not null,
  related_member_id uuid not null,
  relationship_type text not null check (relationship_type in ('conjuge','pai','mae','filho','filha','tutor','irmao','irma','avo','neto','outro')),
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint family_relationships_not_self check (member_id <> related_member_id),
  constraint family_relationships_family_same_church foreign key (family_id, church_id) references public.families(id, church_id) on delete cascade,
  constraint family_relationships_member_same_church foreign key (member_id, church_id) references public.members(id, church_id) on delete cascade,
  constraint family_relationships_related_same_church foreign key (related_member_id, church_id) references public.members(id, church_id) on delete cascade,
  constraint family_relationships_unique unique (family_id, member_id, related_member_id, relationship_type)
);
create index family_relationships_family_idx on public.family_relationships(family_id, created_at);
create index family_relationships_member_idx on public.family_relationships(member_id);
create index family_relationships_related_member_idx on public.family_relationships(related_member_id);
create or replace function private.validate_family_relationship_members()
returns trigger language plpgsql set search_path = '' as $$
begin
  if not exists (select 1 from public.members m where m.id = new.member_id and m.church_id = new.church_id and m.family_id = new.family_id)
     or not exists (select 1 from public.members m where m.id = new.related_member_id and m.church_id = new.church_id and m.family_id = new.family_id) then
    raise exception 'As duas pessoas devem estar associadas à família seleccionada.';
  end if;
  return new;
end;
$$;
create trigger family_relationships_validate_members before insert or update on public.family_relationships
for each row execute function private.validate_family_relationship_members();
alter table public.family_relationships enable row level security;
create policy "authorized users read family relationships" on public.family_relationships for select to authenticated
using (exists (select 1 from public.families f where f.id = family_relationships.family_id and f.church_id = family_relationships.church_id
  and private.has_permission_for_scope(f.church_id, 'families.read', f.region_id, f.community_id, f.branch_id)));
create policy "authorized users create family relationships" on public.family_relationships for insert to authenticated
with check (exists (select 1 from public.families f where f.id = family_relationships.family_id and f.church_id = family_relationships.church_id
  and private.has_permission_for_scope(f.church_id, 'families.update', f.region_id, f.community_id, f.branch_id)));
create policy "authorized users delete family relationships" on public.family_relationships for delete to authenticated
using (exists (select 1 from public.families f where f.id = family_relationships.family_id and f.church_id = family_relationships.church_id
  and private.has_permission_for_scope(f.church_id, 'families.update', f.region_id, f.community_id, f.branch_id)));
grant select, insert, delete on public.family_relationships to authenticated;
