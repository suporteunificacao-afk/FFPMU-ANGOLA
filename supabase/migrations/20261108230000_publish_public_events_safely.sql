drop policy if exists events_public_read on public.events;
create policy events_public_read on public.events
for select to anon, authenticated
using (is_public = true and status in ('Agendado','Em curso','Realizado'));

revoke all on table public.events from anon;
grant select (id, title, description, event_type, starts_at, ends_at, location, registration_required, capacity, status)
on table public.events to anon;