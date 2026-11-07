drop policy if exists "authorized users read family relationships" on public.family_relationships;
drop policy if exists "authorized users create family relationships" on public.family_relationships;
drop policy if exists "authorized users delete family relationships" on public.family_relationships;
create policy "authorized users read family relationships" on public.family_relationships for select to authenticated
using (exists (select 1 from public.families f where f.id = family_relationships.family_id and f.church_id = family_relationships.church_id
  and private.has_permission_for_scope(f.church_id, 'families.read', f.region_id, f.community_id, f.branch_id)));
create policy "authorized users create family relationships" on public.family_relationships for insert to authenticated
with check (exists (select 1 from public.families f where f.id = family_relationships.family_id and f.church_id = family_relationships.church_id
  and private.has_permission_for_scope(f.church_id, 'families.update', f.region_id, f.community_id, f.branch_id)));
create policy "authorized users delete family relationships" on public.family_relationships for delete to authenticated
using (exists (select 1 from public.families f where f.id = family_relationships.family_id and f.church_id = family_relationships.church_id
  and private.has_permission_for_scope(f.church_id, 'families.update', f.region_id, f.community_id, f.branch_id)));
