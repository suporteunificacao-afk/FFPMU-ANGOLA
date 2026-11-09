begin;

insert into public.permissions (permission_key, description) values
  ('worship.read', 'Consultar a biblioteca musical e os repertórios'),
  ('worship.create', 'Criar músicas e repertórios'),
  ('worship.update', 'Actualizar músicas e repertórios'),
  ('worship.delete', 'Arquivar músicas e remover itens de repertórios')
on conflict (permission_key) do nothing;

create table public.songs (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches(id) on delete cascade,
  branch_id uuid,
  title text not null check (char_length(trim(title)) between 2 and 180),
  artist_or_composer text check (artist_or_composer is null or char_length(artist_or_composer) <= 180),
  original_key text check (original_key is null or char_length(original_key) <= 12),
  category text check (category is null or char_length(category) <= 100),
  lyrics text check (lyrics is null or char_length(lyrics) <= 30000),
  reference_url text check (reference_url is null or (char_length(reference_url) <= 1000 and reference_url ~* '^https://')),
  notes text check (notes is null or char_length(notes) <= 2000),
  is_active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, church_id),
  constraint songs_branch_same_church foreign key (branch_id, church_id)
    references public.branches(id, church_id) on delete cascade
);

create table public.repertoires (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches(id) on delete cascade,
  branch_id uuid,
  service_id uuid,
  title text not null check (char_length(trim(title)) between 2 and 180),
  notes text check (notes is null or char_length(notes) <= 2000),
  is_favorite boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, church_id),
  constraint repertoires_branch_same_church foreign key (branch_id, church_id)
    references public.branches(id, church_id) on delete cascade,
  constraint repertoires_service_same_church foreign key (service_id, church_id)
    references public.church_services(id, church_id) on delete set null
);

create table public.repertoire_items (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches(id) on delete cascade,
  branch_id uuid,
  repertoire_id uuid not null,
  song_id uuid not null,
  performed_key text check (performed_key is null or char_length(performed_key) <= 12),
  notes text check (notes is null or char_length(notes) <= 1000),
  display_order integer not null default 1 check (display_order > 0),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint repertoire_items_branch_same_church foreign key (branch_id, church_id)
    references public.branches(id, church_id) on delete cascade,
  constraint repertoire_items_repertoire_same_church foreign key (repertoire_id, church_id)
    references public.repertoires(id, church_id) on delete cascade,
  constraint repertoire_items_song_same_church foreign key (song_id, church_id)
    references public.songs(id, church_id) on delete restrict,
  constraint repertoire_items_song_once unique (repertoire_id, song_id)
);

create index songs_scope_title_idx on public.songs (church_id, branch_id, lower(title));
create index repertoires_scope_date_idx on public.repertoires (church_id, branch_id, created_at desc);
create index repertoires_service_idx on public.repertoires (church_id, service_id);
create index repertoire_items_order_idx on public.repertoire_items (church_id, repertoire_id, display_order);

alter table public.songs enable row level security;
alter table public.repertoires enable row level security;
alter table public.repertoire_items enable row level security;

grant select, insert, update, delete on public.songs, public.repertoires, public.repertoire_items to authenticated;

create policy "scoped users read songs" on public.songs
  for select to authenticated
  using (private.has_permission_for_scope(church_id, 'worship.read', null, null, branch_id));
create policy "scoped users create songs" on public.songs
  for insert to authenticated
  with check (private.has_permission_for_scope(church_id, 'worship.create', null, null, branch_id));
create policy "scoped users update songs" on public.songs
  for update to authenticated
  using (private.has_permission_for_scope(church_id, 'worship.update', null, null, branch_id))
  with check (private.has_permission_for_scope(church_id, 'worship.update', null, null, branch_id));
create policy "scoped users archive songs" on public.songs
  for delete to authenticated
  using (private.has_permission_for_scope(church_id, 'worship.delete', null, null, branch_id));

create policy "scoped users read repertoires" on public.repertoires
  for select to authenticated
  using (private.has_permission_for_scope(church_id, 'worship.read', null, null, branch_id));
create policy "scoped users create repertoires" on public.repertoires
  for insert to authenticated
  with check (private.has_permission_for_scope(church_id, 'worship.create', null, null, branch_id));
create policy "scoped users update repertoires" on public.repertoires
  for update to authenticated
  using (private.has_permission_for_scope(church_id, 'worship.update', null, null, branch_id))
  with check (private.has_permission_for_scope(church_id, 'worship.update', null, null, branch_id));
create policy "scoped users delete repertoires" on public.repertoires
  for delete to authenticated
  using (private.has_permission_for_scope(church_id, 'worship.delete', null, null, branch_id));

create policy "scoped users read repertoire items" on public.repertoire_items
  for select to authenticated
  using (private.has_permission_for_scope(church_id, 'worship.read', null, null, branch_id));
create policy "scoped users create repertoire items" on public.repertoire_items
  for insert to authenticated
  with check (private.has_permission_for_scope(church_id, 'worship.create', null, null, branch_id));
create policy "scoped users update repertoire items" on public.repertoire_items
  for update to authenticated
  using (private.has_permission_for_scope(church_id, 'worship.update', null, null, branch_id))
  with check (private.has_permission_for_scope(church_id, 'worship.update', null, null, branch_id));
create policy "scoped users delete repertoire items" on public.repertoire_items
  for delete to authenticated
  using (private.has_permission_for_scope(church_id, 'worship.delete', null, null, branch_id));

commit;