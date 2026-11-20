alter table public.public_content_items
  add column if not exists file_path text unique,
  add column if not exists file_name text,
  add column if not exists file_mime_type text,
  add column if not exists file_size bigint;
alter table public.public_content_items
  add constraint public_content_file_size_check
  check (file_size is null or (file_size > 0 and file_size <= 20971520));
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('public-library','public-library',false,20971520,
  array['application/pdf','image/jpeg','image/png','image/webp','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','application/vnd.openxmlformats-officedocument.presentationml.presentation'])
on conflict (id) do update set public=false,file_size_limit=20971520,allowed_mime_types=excluded.allowed_mime_types;

drop policy if exists public_library_file_read on storage.objects;
create policy public_library_file_read on storage.objects
for select to anon, authenticated
using (bucket_id='public-library' and exists (
  select 1 from public.public_content_items c
  where c.file_path=storage.objects.name
    and ((c.status='Publicado' and c.is_public=true)
      or (auth.uid() is not null and private.has_permission_for_scope(c.church_id,'content.read',c.region_id,c.community_id,c.branch_id)))
));
drop policy if exists public_library_file_upload on storage.objects;
create policy public_library_file_upload on storage.objects
for insert to authenticated
with check (bucket_id='public-library' and exists (
  select 1 from public.public_content_items c
  where c.file_path=storage.objects.name
    and private.has_permission_for_scope(c.church_id,'content.update',c.region_id,c.community_id,c.branch_id)
));
drop policy if exists public_library_file_delete on storage.objects;
create policy public_library_file_delete on storage.objects
for delete to authenticated
using (bucket_id='public-library' and exists (
  select 1 from public.public_content_items c
  where c.file_path=storage.objects.name
    and private.has_permission_for_scope(c.church_id,'content.update',c.region_id,c.community_id,c.branch_id)
));