create index if not exists songs_branch_church_fk_idx on public.songs (branch_id, church_id);
create index if not exists songs_created_by_fk_idx on public.songs (created_by);
create index if not exists repertoires_branch_church_fk_idx on public.repertoires (branch_id, church_id);
create index if not exists repertoires_service_church_fk_idx on public.repertoires (service_id, church_id);
create index if not exists repertoires_created_by_fk_idx on public.repertoires (created_by);
create index if not exists repertoire_items_branch_church_fk_idx on public.repertoire_items (branch_id, church_id);
create index if not exists repertoire_items_repertoire_church_fk_idx on public.repertoire_items (repertoire_id, church_id);
create index if not exists repertoire_items_song_church_fk_idx on public.repertoire_items (song_id, church_id);
create index if not exists repertoire_items_created_by_fk_idx on public.repertoire_items (created_by);