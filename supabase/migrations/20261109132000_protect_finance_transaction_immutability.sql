create or replace function private.guard_finance_transaction_cancellation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.status <> 'confirmado'
     or new.status <> 'anulado'
     or new.cancelled_by is distinct from auth.uid()
     or nullif(btrim(new.cancellation_reason), '') is null
     or (to_jsonb(new) - array['status','cancellation_reason','cancelled_by','updated_at'])
        is distinct from
        (to_jsonb(old) - array['status','cancellation_reason','cancelled_by','updated_at']) then
    raise exception 'Movimentos financeiros só podem ser anulados uma vez; os restantes dados são imutáveis.';
  end if;
  return new;
end;
$$;

drop trigger if exists finance_transactions_guard_cancellation on public.finance_transactions;
create trigger finance_transactions_guard_cancellation
before update on public.finance_transactions
for each row execute function private.guard_finance_transaction_cancellation();
