create or replace function public.finance_report_totals(
  p_church_id uuid,
  p_from date default null,
  p_to date default null
)
returns table (
  transaction_type text,
  status text,
  total numeric,
  transaction_count bigint
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    ft.transaction_type,
    ft.status,
    coalesce(sum(ft.amount), 0)::numeric as total,
    count(*)::bigint as transaction_count
  from public.finance_transactions as ft
  where ft.church_id = p_church_id
    and (p_from is null or ft.transaction_date >= p_from)
    and (p_to is null or ft.transaction_date <= p_to)
  group by ft.transaction_type, ft.status
$$;

revoke all on function public.finance_report_totals(uuid, date, date) from public, anon;
grant execute on function public.finance_report_totals(uuid, date, date) to authenticated;
