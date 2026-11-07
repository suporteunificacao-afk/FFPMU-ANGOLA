
-- Aplicar o âmbito geográfico também aos módulos operacionais já existentes.
drop policy if exists "authorized users read visitors" on public.visitors;
drop policy if exists "authorized users create visitors" on public.visitors;
drop policy if exists "authorized users update visitors" on public.visitors;
drop policy if exists "authorized users delete visitors" on public.visitors;
create policy "scoped users read visitors" on public.visitors for select to authenticated
using (private.has_permission_for_scope(church_id,'members.read',null,null,branch_id));
create policy "scoped users create visitors" on public.visitors for insert to authenticated
with check (private.has_permission_for_scope(church_id,'members.create',null,null,branch_id));
create policy "scoped users update visitors" on public.visitors for update to authenticated
using (private.has_permission_for_scope(church_id,'members.update',null,null,branch_id))
with check (private.has_permission_for_scope(church_id,'members.update',null,null,branch_id));
create policy "scoped users delete visitors" on public.visitors for delete to authenticated
using (private.has_permission_for_scope(church_id,'members.delete',null,null,branch_id));

drop policy if exists "authorized users read visitor visits" on public.visitor_visits;
drop policy if exists "authorized users create visitor visits" on public.visitor_visits;
drop policy if exists "authorized users update visitor visits" on public.visitor_visits;
drop policy if exists "authorized users delete visitor visits" on public.visitor_visits;
create policy "scoped users read visitor visits" on public.visitor_visits for select to authenticated
using (exists (select 1 from public.visitors v where v.id=visitor_id and v.church_id=visitor_visits.church_id
  and private.has_permission_for_scope(v.church_id,'members.read',null,null,v.branch_id)));
create policy "scoped users create visitor visits" on public.visitor_visits for insert to authenticated
with check (exists (select 1 from public.visitors v where v.id=visitor_id and v.church_id=visitor_visits.church_id
  and private.has_permission_for_scope(v.church_id,'members.create',null,null,v.branch_id)));
create policy "scoped users update visitor visits" on public.visitor_visits for update to authenticated
using (exists (select 1 from public.visitors v where v.id=visitor_id and v.church_id=visitor_visits.church_id
  and private.has_permission_for_scope(v.church_id,'members.update',null,null,v.branch_id)))
with check (exists (select 1 from public.visitors v where v.id=visitor_id and v.church_id=visitor_visits.church_id
  and private.has_permission_for_scope(v.church_id,'members.update',null,null,v.branch_id)));
create policy "scoped users delete visitor visits" on public.visitor_visits for delete to authenticated
using (exists (select 1 from public.visitors v where v.id=visitor_id and v.church_id=visitor_visits.church_id
  and private.has_permission_for_scope(v.church_id,'members.delete',null,null,v.branch_id)));

drop policy if exists "authorized users read departments" on public.departments;
drop policy if exists "authorized users create departments" on public.departments;
drop policy if exists "authorized users update departments" on public.departments;
drop policy if exists "authorized users delete departments" on public.departments;
create policy "scoped users read departments" on public.departments for select to authenticated
using (private.has_permission_for_scope(church_id,'members.read',null,null,branch_id));
create policy "scoped users create departments" on public.departments for insert to authenticated
with check (private.has_permission_for_scope(church_id,'members.create',null,null,branch_id));
create policy "scoped users update departments" on public.departments for update to authenticated
using (private.has_permission_for_scope(church_id,'members.update',null,null,branch_id))
with check (private.has_permission_for_scope(church_id,'members.update',null,null,branch_id));
create policy "scoped users delete departments" on public.departments for delete to authenticated
using (private.has_permission_for_scope(church_id,'members.delete',null,null,branch_id));

drop policy if exists "authorized users read department members" on public.department_members;
drop policy if exists "authorized users create department members" on public.department_members;
drop policy if exists "authorized users update department members" on public.department_members;
drop policy if exists "authorized users delete department members" on public.department_members;
create policy "scoped users read department members" on public.department_members for select to authenticated
using (exists (select 1 from public.departments d where d.id=department_id and d.church_id=department_members.church_id
  and private.has_permission_for_scope(d.church_id,'members.read',null,null,d.branch_id)));
create policy "scoped users create department members" on public.department_members for insert to authenticated
with check (exists (select 1 from public.departments d where d.id=department_id and d.church_id=department_members.church_id
  and private.has_permission_for_scope(d.church_id,'members.create',null,null,d.branch_id)));
create policy "scoped users update department members" on public.department_members for update to authenticated
using (exists (select 1 from public.departments d where d.id=department_id and d.church_id=department_members.church_id
  and private.has_permission_for_scope(d.church_id,'members.update',null,null,d.branch_id)))
with check (exists (select 1 from public.departments d where d.id=department_id and d.church_id=department_members.church_id
  and private.has_permission_for_scope(d.church_id,'members.update',null,null,d.branch_id)));
create policy "scoped users delete department members" on public.department_members for delete to authenticated
using (exists (select 1 from public.departments d where d.id=department_id and d.church_id=department_members.church_id
  and private.has_permission_for_scope(d.church_id,'members.delete',null,null,d.branch_id)));

drop policy if exists "authorized users read ministries" on public.ministries;
drop policy if exists "authorized users create ministries" on public.ministries;
drop policy if exists "authorized users update ministries" on public.ministries;
drop policy if exists "authorized users delete ministries" on public.ministries;
create policy "scoped users read ministries" on public.ministries for select to authenticated
using (private.has_permission_for_scope(church_id,'members.read',null,null,branch_id));
create policy "scoped users create ministries" on public.ministries for insert to authenticated
with check (private.has_permission_for_scope(church_id,'members.create',null,null,branch_id));
create policy "scoped users update ministries" on public.ministries for update to authenticated
using (private.has_permission_for_scope(church_id,'members.update',null,null,branch_id))
with check (private.has_permission_for_scope(church_id,'members.update',null,null,branch_id));
create policy "scoped users delete ministries" on public.ministries for delete to authenticated
using (private.has_permission_for_scope(church_id,'members.delete',null,null,branch_id));

drop policy if exists "authorized users read ministry members" on public.ministry_members;
drop policy if exists "authorized users create ministry members" on public.ministry_members;
drop policy if exists "authorized users update ministry members" on public.ministry_members;
drop policy if exists "authorized users delete ministry members" on public.ministry_members;
create policy "scoped users read ministry members" on public.ministry_members for select to authenticated
using (exists (select 1 from public.ministries m where m.id=ministry_id and m.church_id=ministry_members.church_id
  and private.has_permission_for_scope(m.church_id,'members.read',null,null,m.branch_id)));
create policy "scoped users create ministry members" on public.ministry_members for insert to authenticated
with check (exists (select 1 from public.ministries m where m.id=ministry_id and m.church_id=ministry_members.church_id
  and private.has_permission_for_scope(m.church_id,'members.create',null,null,m.branch_id)));
create policy "scoped users update ministry members" on public.ministry_members for update to authenticated
using (exists (select 1 from public.ministries m where m.id=ministry_id and m.church_id=ministry_members.church_id
  and private.has_permission_for_scope(m.church_id,'members.update',null,null,m.branch_id)))
with check (exists (select 1 from public.ministries m where m.id=ministry_id and m.church_id=ministry_members.church_id
  and private.has_permission_for_scope(m.church_id,'members.update',null,null,m.branch_id)));
create policy "scoped users delete ministry members" on public.ministry_members for delete to authenticated
using (exists (select 1 from public.ministries m where m.id=ministry_id and m.church_id=ministry_members.church_id
  and private.has_permission_for_scope(m.church_id,'members.delete',null,null,m.branch_id)));

drop policy if exists "authorized users read church services" on public.church_services;
drop policy if exists "authorized users create church services" on public.church_services;
drop policy if exists "authorized users update church services" on public.church_services;
drop policy if exists "authorized users delete church services" on public.church_services;
create policy "scoped users read church services" on public.church_services for select to authenticated
using (private.has_permission_for_scope(church_id,'members.read',null,null,branch_id));
create policy "scoped users create church services" on public.church_services for insert to authenticated
with check (private.has_permission_for_scope(church_id,'members.create',null,null,branch_id));
create policy "scoped users update church services" on public.church_services for update to authenticated
using (private.has_permission_for_scope(church_id,'members.update',null,null,branch_id))
with check (private.has_permission_for_scope(church_id,'members.update',null,null,branch_id));
create policy "scoped users delete church services" on public.church_services for delete to authenticated
using (private.has_permission_for_scope(church_id,'members.delete',null,null,branch_id));

drop policy if exists "authorized users read service rosters" on public.service_roster_assignments;
drop policy if exists "authorized users create service rosters" on public.service_roster_assignments;
drop policy if exists "authorized users update service rosters" on public.service_roster_assignments;
drop policy if exists "authorized users delete service rosters" on public.service_roster_assignments;
create policy "scoped users read service rosters" on public.service_roster_assignments for select to authenticated
using (private.has_permission_for_scope(church_id,'members.read',null,null,branch_id));
create policy "scoped users create service rosters" on public.service_roster_assignments for insert to authenticated
with check (private.has_permission_for_scope(church_id,'members.create',null,null,branch_id));
create policy "scoped users update service rosters" on public.service_roster_assignments for update to authenticated
using (private.has_permission_for_scope(church_id,'members.update',null,null,branch_id))
with check (private.has_permission_for_scope(church_id,'members.update',null,null,branch_id));
create policy "scoped users delete service rosters" on public.service_roster_assignments for delete to authenticated
using (private.has_permission_for_scope(church_id,'members.delete',null,null,branch_id));
