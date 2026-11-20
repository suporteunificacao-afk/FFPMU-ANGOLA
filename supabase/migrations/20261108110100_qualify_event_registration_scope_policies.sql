drop policy if exists event_registrations_read_scoped on public.event_registrations;
create policy event_registrations_read_scoped on public.event_registrations for select to authenticated using (
 exists (select 1 from public.events e where e.id=event_registrations.event_id
 and e.church_id=event_registrations.church_id
 and private.has_permission_for_scope(e.church_id,'events.read',e.region_id,e.community_id,e.branch_id))
);
drop policy if exists event_registrations_create_scoped on public.event_registrations;
create policy event_registrations_create_scoped on public.event_registrations for insert to authenticated with check (
 exists (select 1 from public.events e where e.id=event_registrations.event_id
 and e.church_id=event_registrations.church_id
 and private.has_permission_for_scope(e.church_id,'events.create',e.region_id,e.community_id,e.branch_id))
);
drop policy if exists event_registrations_update_scoped on public.event_registrations;
create policy event_registrations_update_scoped on public.event_registrations for update to authenticated using (
 exists (select 1 from public.events e where e.id=event_registrations.event_id
 and e.church_id=event_registrations.church_id
 and private.has_permission_for_scope(e.church_id,'events.update',e.region_id,e.community_id,e.branch_id))
) with check (
 exists (select 1 from public.events e where e.id=event_registrations.event_id
 and e.church_id=event_registrations.church_id
 and private.has_permission_for_scope(e.church_id,'events.update',e.region_id,e.community_id,e.branch_id))
);
drop policy if exists event_registrations_delete_scoped on public.event_registrations;
create policy event_registrations_delete_scoped on public.event_registrations for delete to authenticated using (
 exists (select 1 from public.events e where e.id=event_registrations.event_id
 and e.church_id=event_registrations.church_id
 and private.has_permission_for_scope(e.church_id,'events.delete',e.region_id,e.community_id,e.branch_id))
);