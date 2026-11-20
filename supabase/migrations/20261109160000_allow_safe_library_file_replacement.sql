-- Allow safe staged replacement of private library files.
-- Upload/delete authorization is tied to the content item encoded in the object path,
-- so a new file can be uploaded before replacing the database pointer.
drop policy if exists public_library_file_upload on storage.objects;
create policy public_library_file_upload on storage.objects
for insert to authenticated
with check (
  bucket_id = 'public-library'
  and exists (
    select 1 from public.public_content_items c
    where c.id::text = split_part(storage.objects.name, '/', 2)
      and c.church_id::text = split_part(storage.objects.name, '/', 1)
      and private.has_permission_for_scope(c.church_id, 'content.update', c.region_id, c.community_id, c.branch_id)
  )
);

drop policy if exists public_library_file_delete on storage.objects;
create policy public_library_file_delete on storage.objects
for delete to authenticated
using (
  bucket_id = 'public-library'
  and exists (
    select 1 from public.public_content_items c
    where c.id::text = split_part(storage.objects.name, '/', 2)
      and c.church_id::text = split_part(storage.objects.name, '/', 1)
      and private.has_permission_for_scope(c.church_id, 'content.update', c.region_id, c.community_id, c.branch_id)
  )
);
