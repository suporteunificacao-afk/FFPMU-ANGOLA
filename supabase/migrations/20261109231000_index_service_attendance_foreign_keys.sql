create index if not exists service_attendance_service_fk_idx on public.service_attendance (service_id, church_id);
create index if not exists service_attendance_member_fk_idx on public.service_attendance (member_id, church_id) where member_id is not null;
create index if not exists service_attendance_visitor_fk_idx on public.service_attendance (visitor_id, church_id) where visitor_id is not null;
create index if not exists service_attendance_branch_fk_idx on public.service_attendance (branch_id, church_id) where branch_id is not null;
create index if not exists service_attendance_marked_by_idx on public.service_attendance (marked_by) where marked_by is not null;
