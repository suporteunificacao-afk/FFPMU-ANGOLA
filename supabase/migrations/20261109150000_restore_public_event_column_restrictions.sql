-- Restore least-privilege column access for anonymous visitors.
-- The public policy still limits rows to explicitly public, non-cancelled events.
revoke select on table public.events from anon;
revoke select (id, title, description, event_type, starts_at, ends_at, location, registration_required, capacity, status)
on table public.events from anon;
grant select (id, title, description, event_type, starts_at, ends_at, location, registration_required, capacity, status)
on table public.events to anon;
