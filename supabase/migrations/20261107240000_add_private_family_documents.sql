-- Documentos privados dos agregados familiares.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('family-documents', 'family-documents', false, 10485760, array['application/pdf','image/jpeg','image/png','image/webp'])
on conflict (id) do update set
  public = false,
  file_size_limit = 10485760,
  allowed_mime_types = excluded.allowed_mime_types;

create table public.family_documents (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null,
  family_id uuid not null,
  title text not null check (char_length(trim(title)) between 2 and 160),
  object_path text not null unique,
  mime_type text not null check (mime_type in ('application/pdf','image/jpeg','image/png','image/webp')),
  file_size bigint not null check (file_size > 0 and file_size <= 10485760),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint family_documents_family_same_church foreign key (family_id, church_id)
    references public.families(id, church_id) on delete cascade,
  constraint family_documents_path_matches_family check (
    split_part(object_path, '/', 1) = church_id::text
    and split_part(object_path, '/', 2) = family_id::text
  )
);
create index family_documents_family_created_idx on public.family_documents(family_id, created_at desc);
alter table public.family_documents enable row level security;

create policy "family documents read scoped" on public.family_documents
for select to authenticated
using (exists (
  select 1 from public.families f where f.id = family_documents.family_id
    and f.church_id = family_documents.church_id
    and private.has_permission_for_scope(f.church_id, 'families.read', f.region_id, f.community_id, f.branch_id)
));
create policy "family documents create scoped" on public.family_documents
for insert to authenticated
with check (created_by = (select auth.uid()) and exists (
  select 1 from public.families f where f.id = family_documents.family_id
    and f.church_id = family_documents.church_id
    and private.has_permission_for_scope(f.church_id, 'families.update', f.region_id, f.community_id, f.branch_id)
));
create policy "family documents delete scoped" on public.family_documents
for delete to authenticated
using (exists (
  select 1 from public.families f where f.id = family_documents.family_id
    and f.church_id = family_documents.church_id
    and private.has_permission_for_scope(f.church_id, 'families.update', f.region_id, f.community_id, f.branch_id)
));
grant select, insert, delete on public.family_documents to authenticated;

create policy "family document objects read scoped" on storage.objects
for select to authenticated
using (
  bucket_id = 'family-documents'
  and exists (
    select 1 from public.families f
    where f.id::text = (storage.foldername(name))[2]
      and f.church_id::text = (storage.foldername(name))[1]
      and private.has_permission_for_scope(f.church_id, 'families.read', f.region_id, f.community_id, f.branch_id)
  )
);
create policy "family document objects upload scoped" on storage.objects
for insert to authenticated
with check (
  bucket_id = 'family-documents'
  and exists (
    select 1 from public.families f
    where f.id::text = (storage.foldername(name))[2]
      and f.church_id::text = (storage.foldername(name))[1]
      and private.has_permission_for_scope(f.church_id, 'families.update', f.region_id, f.community_id, f.branch_id)
  )
);
create policy "family document objects delete scoped" on storage.objects
for delete to authenticated
using (
  bucket_id = 'family-documents'
  and exists (
    select 1 from public.families f
    where f.id::text = (storage.foldername(name))[2]
      and f.church_id::text = (storage.foldername(name))[1]
      and private.has_permission_for_scope(f.church_id, 'families.update', f.region_id, f.community_id, f.branch_id)
  )
);