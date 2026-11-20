
drop policy if exists "authorized users read regions" on public.regions;
create policy "authorized users read regions"
on public.regions for select to authenticated
using (
  private.has_permission_for_scope(church_id,'organization.read',id,null,null)
  or private.has_permission(church_id,'roles.manage')
);

drop policy if exists "authorized users read communities" on public.communities;
create policy "authorized users read communities"
on public.communities for select to authenticated
using (
  private.has_permission_for_scope(church_id,'organization.read',region_id,id,null)
  or private.has_permission(church_id,'roles.manage')
);
