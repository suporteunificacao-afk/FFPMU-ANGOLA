-- Allow the public portal to read only explicitly published events.
-- Existing scoped policies continue to protect private events and all writes.
drop policy if exists events_public_read on public.events;
create policy events_public_read
on public.events
for select
to anon, authenticated
using (is_public = true and status in ('Agendado','Em curso','Realizado'));

grant select on public.events to anon, authenticated;
