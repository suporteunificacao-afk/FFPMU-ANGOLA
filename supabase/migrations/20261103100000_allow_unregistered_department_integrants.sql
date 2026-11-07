alter table public.department_members add column if not exists display_name text;
update public.department_members dm set display_name = m.full_name from public.members m where dm.member_id = m.id and dm.church_id = m.church_id and dm.display_name is null;
alter table public.department_members alter column member_id drop not null;
alter table public.department_members add constraint department_members_display_name_required check (char_length(btrim(coalesce(display_name, ''))) between 2 and 160);