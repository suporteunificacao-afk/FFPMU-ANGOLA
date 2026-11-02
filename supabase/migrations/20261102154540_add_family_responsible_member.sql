alter table public.families
  add column if not exists responsible_member_id uuid null
  references public.members(id) on delete set null;

create index if not exists families_responsible_member_id_idx
  on public.families(responsible_member_id);

drop policy if exists "authorized users update families" on public.families;
create policy "authorized users update families"
  on public.families for update to authenticated
  using (private.has_permission(church_id, 'members.update'::text))
  with check (private.has_permission(church_id, 'members.update'::text));
