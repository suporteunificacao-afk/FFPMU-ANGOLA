revoke all on table public.public_content_items from anon;
grant select (id, content_type, title, slug, summary, body, category, external_url, published_at, created_at)
on table public.public_content_items to anon;