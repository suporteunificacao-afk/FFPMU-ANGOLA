
create or replace function private.has_permission_for_scope(
  _church_id uuid, _permission_key text,
  _region_id uuid default null, _community_id uuid default null, _branch_id uuid default null
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.has_permission(_church_id,'roles.manage')
    or exists (
      select 1
      from public.role_assignments ra
      join public.role_permissions rp on rp.role_id = ra.role_id
      join public.permissions p on p.id = rp.permission_id
      join public.profiles pr on pr.id = ra.user_id
      left join public.branches b on b.id = _branch_id and b.church_id = _church_id
      where ra.user_id = (select auth.uid())
        and ra.church_id = _church_id
        and pr.is_active = true
        and p.permission_key = _permission_key
        and (
          (ra.region_id is null and ra.community_id is null and ra.branch_id is null)
          or (ra.region_id is not null and ra.region_id = coalesce(_region_id,b.region_id) and ra.community_id is null and ra.branch_id is null)
          or (ra.community_id is not null and ra.community_id = coalesce(_community_id,b.community_id) and ra.branch_id is null)
          or (ra.branch_id is not null and ra.branch_id = _branch_id)
        )
    );
$$;
