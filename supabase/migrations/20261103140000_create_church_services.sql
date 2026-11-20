create table public.church_services (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches(id),
  branch_id uuid,
  title text not null check (char_length(btrim(title)) between 2 and 160),
  service_type text not null default 'Culto' check (char_length(btrim(service_type)) between 2 and 80),
  service_date date not null,
  start_time time not null,
  end_time time,
  location text,
  responsible_name text,
  notes text,
  status text not null default 'Agendado' check (status in ('Agendado','Realizado','Cancelado')),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint church_services_id_church_unique unique (id, church_id),
  constraint church_services_branch_same_church foreign key (branch_id, church_id) references public.branches(id, church_id),
  constraint church_services_time_check check (end_time is null or end_time > start_time)
);
create index church_services_branch_date_idx on public.church_services(church_id, branch_id, service_date, start_time);
alter table public.church_services enable row level security;
create policy "authorized users read church services" on public.church_services for select to authenticated using (private.has_permission(church_id, 'members.read'));
create policy "authorized users create church services" on public.church_services for insert to authenticated with check (private.has_permission(church_id, 'members.create'));
create policy "authorized users update church services" on public.church_services for update to authenticated using (private.has_permission(church_id, 'members.update')) with check (private.has_permission(church_id, 'members.update'));
create policy "authorized users delete church services" on public.church_services for delete to authenticated using (private.has_permission(church_id, 'members.delete'));
