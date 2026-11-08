create table if not exists public.public_content_items (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches(id) on delete cascade,
  region_id uuid null,
  community_id uuid null,
  branch_id uuid null,
  content_type text not null check (content_type in ('noticia','comunicado','biblioteca')),
  title text not null check (char_length(trim(title)) between 3 and 180),
  slug text not null,
  summary text null check (summary is null or char_length(summary) <= 500),
  body text null,
  category text null,
  external_url text null,
  status text not null default 'Rascunho' check (status in ('Rascunho','Publicado','Arquivado')),
  is_public boolean not null default false,
  published_at timestamptz null,
  created_by uuid null references auth.users(id) on delete set null,
  updated_by uuid null references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint public_content_slug_unique unique (church_id, slug),
  constraint public_content_published_requires_public_date check (status <> 'Publicado' or (is_public = true and published_at is not null))
);
create index if not exists public_content_public_listing_idx
  on public.public_content_items (church_id, content_type, published_at desc)
  where status = 'Publicado' and is_public = true;
create index if not exists public_content_scope_idx
  on public.public_content_items (church_id, region_id, community_id, branch_id);
alter table public.public_content_items enable row level security;
drop policy if exists public_content_public_read on public.public_content_items;
create policy public_content_public_read on public.public_content_items
for select to anon, authenticated
using (status = 'Publicado' and is_public = true);
drop policy if exists public_content_scoped_read on public.public_content_items;
create policy public_content_scoped_read on public.public_content_items
for select to authenticated
using (private.has_permission_for_scope(church_id, 'content.read', region_id, community_id, branch_id));
drop policy if exists public_content_scoped_insert on public.public_content_items;
create policy public_content_scoped_insert on public.public_content_items
for insert to authenticated
with check (private.has_permission_for_scope(church_id, 'content.create', region_id, community_id, branch_id));
drop policy if exists public_content_scoped_update on public.public_content_items;
create policy public_content_scoped_update on public.public_content_items
for update to authenticated
using (private.has_permission_for_scope(church_id, 'content.update', region_id, community_id, branch_id))
with check (private.has_permission_for_scope(church_id, 'content.update', region_id, community_id, branch_id));
drop policy if exists public_content_scoped_delete on public.public_content_items;
create policy public_content_scoped_delete on public.public_content_items
for delete to authenticated
using (private.has_permission_for_scope(church_id, 'content.delete', region_id, community_id, branch_id));
grant select on public.public_content_items to anon, authenticated;
grant insert, update, delete on public.public_content_items to authenticated;
insert into public.permissions (permission_key, description)
values
 ('content.read','Consultar conteúdos institucionais'),
 ('content.create','Criar conteúdos institucionais'),
 ('content.update','Editar conteúdos institucionais'),
 ('content.delete','Eliminar conteúdos institucionais')
on conflict (permission_key) do nothing;
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.name in ('Administrador Nacional','Responsável Regional','Responsável Local','Administrador principal')
  and p.permission_key in ('content.read','content.create','content.update','content.delete')
on conflict do nothing;