create table public.ministries (
 id uuid primary key default gen_random_uuid(), church_id uuid not null references public.churches(id), branch_id uuid,
 name text not null check (char_length(btrim(name)) between 2 and 120), is_active boolean not null default true,
 created_by uuid references auth.users(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 constraint ministries_id_church_unique unique (id, church_id),
 constraint ministries_branch_same_church foreign key (branch_id, church_id) references public.branches(id, church_id)
);
create unique index ministries_church_name_lower_idx on public.ministries(church_id, lower(name));
create table public.ministry_members (
 id uuid primary key default gen_random_uuid(), church_id uuid not null references public.churches(id), ministry_id uuid not null, member_id uuid,
 display_name text not null check (char_length(btrim(display_name)) between 2 and 160),
 position_title text not null check (char_length(btrim(position_title)) between 1 and 120),
 display_order integer not null default 1 check (display_order > 0), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 constraint ministry_members_ministry_same_church foreign key (ministry_id, church_id) references public.ministries(id, church_id),
 constraint ministry_members_member_same_church foreign key (member_id, church_id) references public.members(id, church_id),
 constraint ministry_members_unique_member unique (ministry_id, member_id), constraint ministry_members_unique_order unique (ministry_id, display_order)
);
create index ministry_members_church_ministry_idx on public.ministry_members(church_id, ministry_id, display_order);
alter table public.ministries enable row level security; alter table public.ministry_members enable row level security;
create policy "authorized users read ministries" on public.ministries for select to authenticated using (private.has_permission(church_id, 'members.read'));
create policy "authorized users create ministries" on public.ministries for insert to authenticated with check (private.has_permission(church_id, 'members.create'));
create policy "authorized users update ministries" on public.ministries for update to authenticated using (private.has_permission(church_id, 'members.update')) with check (private.has_permission(church_id, 'members.update'));
create policy "authorized users delete ministries" on public.ministries for delete to authenticated using (private.has_permission(church_id, 'members.delete'));
create policy "authorized users read ministry members" on public.ministry_members for select to authenticated using (private.has_permission(church_id, 'members.read'));
create policy "authorized users create ministry members" on public.ministry_members for insert to authenticated with check (private.has_permission(church_id, 'members.create'));
create policy "authorized users update ministry members" on public.ministry_members for update to authenticated using (private.has_permission(church_id, 'members.update')) with check (private.has_permission(church_id, 'members.update'));
create policy "authorized users delete ministry members" on public.ministry_members for delete to authenticated using (private.has_permission(church_id, 'members.delete'));