alter table public.families
  add constraint families_id_church_unique unique (id, church_id);

alter table public.members
  add constraint members_family_same_church
  foreign key (family_id, church_id)
  references public.families(id, church_id);

drop policy if exists "authorized users upload member photos" on storage.objects;
create policy "authorized users upload member photos"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'member-photos'
  and (
    private.has_permission((storage.foldername(name))[1]::uuid, 'members.create')
    or private.has_permission((storage.foldername(name))[1]::uuid, 'members.update')
  )
);