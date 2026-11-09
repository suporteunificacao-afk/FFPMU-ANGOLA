import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { cancelFinanceTransaction, createFinanceTransaction } from "./actions";

const field = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800";
const button = "rounded-lg bg-[#142b4a] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#203e64]";
const money = (value: number) => new Intl.NumberFormat("pt-AO", { style: "currency", currency: "AOA", minimumFractionDigits: 2 }).format(value);
const validDate = (value?: string) => !!value && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));

type Params = { from?: string; to?: string; created?: string; cancelled?: string; error?: string };

export default async function FinancePage({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  const from = validDate(params.from) ? params.from! : "";
  const to = validDate(params.to) ? params.to! : "";
  if (from && to && from > to) redirect("/admin/financeiro?error=range");

  const supabase = await createClient();
  if (!supabase) redirect("/login?setup=required");
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("church_id,is_active").eq("id", user.id).maybeSingle();
  if (!profile?.is_active) redirect("/login");
  if (!profile.church_id) redirect("/setup");

  let query = supabase.from("finance_transactions")
    .select("id,transaction_type,category,description,amount,transaction_date,payment_method,reference,status,cancellation_reason,created_at")
    .eq("church_id", profile.church_id).order("transaction_date", { ascending: false }).order("created_at", { ascending: false }).limit(500);
  if (from) query = query.gte("transaction_date", from);
  if (to) query = query.lte("transaction_date", to);
  const { data: transactions, error } = await query;
  const rows = transactions ?? [];
  const confirmed = rows.filter(row => row.status === "confirmado");
  const incoming = confirmed.filter(row => row.transaction_type === "entrada").reduce((sum, row) => sum + Number(row.amount), 0);
  const outgoing = confirmed.filter(row => row.transaction_type === "saida").reduce((sum, row) => sum + Number(row.amount), 0);
  const { data: assignments } = await supabase.from("role_assignments").select("role_id").eq("user_id", user.id).eq("church_id", profile.church_id);
  const roleIds = (assignments ?? []).map(item => item.role_id);
  let canCancel = false;
  if (roleIds.length) {
    const { data: permissions } = await supabase.from("role_permissions")
      .select("role_id,permissions!inner(permission_key)")
      .in("role_id", roleIds).eq("permissions.permission_key", "finance.cancel");
    canCancel = !!permissions?.length;
  }

  return <main className="mx-auto max-w-6xl space-y-6">
    <header><p className="text-sm font-medium text-amber-700">Administração e tesouraria</p><h1 className="mt-1 text-3xl font-semibold text-[#142b4a]">Gestão financeira</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Registe entradas e saídas, acompanhe o saldo dos movimentos e mantenha o histórico. Todos os valores são apresentados em Kwanzas (Kz).</p></header>
    {params.created && <p role="status" className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">Movimento financeiro registado com sucesso.</p>}
    {params.cancelled && <p role="status" className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">Movimento anulado. O registo permanece no histórico.</p>}
    {params.error && <p role="alert" className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">{params.error === "invalid" ? "Verifique o tipo, categoria, descrição, valor, data e método de pagamento." : params.error === "reason" ? "Indique um motivo de anulação com pelo menos 5 caracteres." : params.error === "range" ? "A data inicial não pode ser posterior à data final." : params.error === "cancel" ? "Não foi possível anular. Confirme a permissão ou se o movimento já foi anulado." : "Não foi possível registar o movimento. Verifique as permissões e tente novamente."}</p>}
    <section className="grid gap-4 sm:grid-cols-3">
      <article className="rounded-xl border border-emerald-200 bg-white p-5"><p className="text-sm text-slate-500">Entradas confirmadas</p><p className="mt-2 text-2xl font-semibold tabular-nums text-emerald-800">{money(incoming)}</p></article>
      <article className="rounded-xl border border-rose-200 bg-white p-5"><p className="text-sm text-slate-500">Saídas confirmadas</p><p className="mt-2 text-2xl font-semibold tabular-nums text-rose-800">{money(outgoing)}</p></article>
      <article className="rounded-xl border border-slate-200 bg-white p-5"><p className="text-sm text-slate-500">Saldo dos movimentos apresentados</p><p className={"mt-2 text-2xl font-semibold tabular-nums "+(incoming-outgoing>=0?"text-[#142b4a]":"text-rose-800")}>{money(incoming-outgoing)}</p></article>
    </section>
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <h2 className="font-semibold text-[#142b4a]">Filtrar movimentos</h2>
      <form className="mt-3 grid gap-3 sm:grid-cols-[1fr_1fr_auto_auto]">
        <label className="text-xs font-medium text-slate-600">De<input type="date" name="from" value={from} max={to || undefined} className={field+" mt-1"}/></label>
        <label className="text-xs font-medium text-slate-600">Até<input type="date" name="to" value={to} min={from || undefined} className={field+" mt-1"}/></label>
        <button className="self-end rounded-lg bg-[#142b4a] px-4 py-2.5 text-sm font-semibold text-white">Aplicar</button>
        <Link href="/admin/financeiro" className="self-end rounded-lg border border-slate-300 px-4 py-2.5 text-center text-sm font-semibold text-slate-700">Limpar</Link>
      </form>
    </section>
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <details>
        <summary className="cursor-pointer list-none text-sm font-semibold text-[#142b4a]">＋ Registar entrada ou saída</summary>
        <form action={createFinanceTransaction} className="mt-4 grid gap-4 border-t border-slate-100 pt-4 sm:grid-cols-2">
          <label className="text-sm font-medium text-slate-700">Tipo de movimento<select name="transaction_type" required className={field+" mt-1"}><option value="entrada">Entrada</option><option value="saida">Saída</option></select></label>
          <label className="text-sm font-medium text-slate-700">Categoria<input name="category" required minLength={2} maxLength={100} list="finance-categories" placeholder="Ex.: Oferta, contribuição, transporte" className={field+" mt-1"}/><datalist id="finance-categories"><option value="Dízimos"/><option value="Ofertas"/><option value="Contribuições"/><option value="Doações"/><option value="Eventos"/><option value="Missões"/><option value="Manutenção"/><option value="Transporte"/><option value="Água e energia"/><option value="Material e equipamento"/><option value="Apoio social"/></datalist></label>
          <label className="text-sm font-medium text-slate-700">Valor (Kz)<input name="amount" required inputMode="decimal" type="number" min="0.01" max="999999999999" step="0.01" placeholder="0,00" className={field+" mt-1"}/></label>
          <label className="text-sm font-medium text-slate-700">Data<input name="transaction_date" type="date" required className={field+" mt-1"}/></label>
          <label className="text-sm font-medium text-slate-700">Método de pagamento<select name="payment_method" className={field+" mt-1"}><option value="dinheiro">Dinheiro</option><option value="transferencia">Transferência</option><option value="deposito">Depósito bancário</option><option value="multicaixa">Multicaixa</option><option value="outro">Outro</option></select></label>
          <label className="text-sm font-medium text-slate-700">Referência (opcional)<input name="reference" maxLength={160} className={field+" mt-1"} placeholder="N.º de recibo ou comprovativo"/></label>
          <label className="text-sm font-medium text-slate-700 sm:col-span-2">Descrição<input name="description" required minLength={3} maxLength={1000} className={field+" mt-1"} placeholder="Descreva o motivo do movimento"/></label>
          <p className="text-xs leading-5 text-slate-500 sm:col-span-2">O movimento será registado como confirmado. Para manter a integridade do histórico, os registos não são apagados; a anulação exige permissão especial e motivo.</p>
          <div className="sm:col-span-2"><button className={button}>Guardar movimento</button></div>
        </form>
      </details>
    </section>
    <section className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-2"><div><h2 className="text-xl font-semibold text-[#142b4a]">Histórico financeiro</h2><p className="text-sm text-slate-500">Movimentos visíveis no seu âmbito de acesso.</p></div><span className="text-sm text-slate-500">{rows.length} movimento(s)</span></div>
      {error ? <p className="rounded-xl bg-amber-50 p-5 text-sm text-amber-900">Não foi possível carregar o histórico financeiro. Verifique se o seu perfil tem acesso ao módulo.</p>
      : rows.length ? <div className="space-y-3">{rows.map(row=><article key={row.id} className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className={"rounded-full px-2.5 py-1 text-xs font-semibold "+(row.transaction_type==="entrada"?"bg-emerald-50 text-emerald-800":"bg-rose-50 text-rose-800")}>{row.transaction_type==="entrada"?"Entrada":"Saída"}</span><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700">{row.category}</span>{row.status==="anulado" && <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">Anulado</span>}</div><h3 className="mt-2 font-semibold text-[#142b4a]">{row.description}</h3><p className="mt-1 text-xs text-slate-500">{new Date(row.transaction_date+"T12:00:00").toLocaleDateString("pt-AO")} · {({dinheiro:"Dinheiro",transferencia:"Transferência",deposito:"Depósito bancário",multicaixa:"Multicaixa",outro:"Outro"} as Record<string,string>)[row.payment_method] ?? row.payment_method}{row.reference?" · Ref.: "+row.reference:""}</p>{row.status==="anulado" && <p className="mt-2 text-xs text-amber-800">Motivo: {row.cancellation_reason}</p>}</div>
          <p className={"text-lg font-semibold tabular-nums "+(row.status==="anulado"?"text-slate-400 line-through":row.transaction_type==="entrada"?"text-emerald-800":"text-rose-800")}>{row.transaction_type==="entrada"?"+":"−"} {money(Number(row.amount))}</p>
        </div>
        {canCancel && row.status==="confirmado" && <details className="mt-3 border-t border-slate-100 pt-3"><summary className="cursor-pointer text-xs font-semibold text-rose-700">Anular movimento</summary><form action={cancelFinanceTransaction} className="mt-2 flex flex-wrap gap-2"><input type="hidden" name="transaction_id" value={row.id}/><input name="cancellation_reason" required minLength={5} maxLength={500} placeholder="Motivo obrigatório da anulação" className={field+" min-w-0 flex-1"}/><button className="rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700">Confirmar anulação</button></form></details>}
      </article>)}</div> : <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">Ainda não existem movimentos financeiros neste período. Use “Registar entrada ou saída” para começar.</div>}
    </section>
    <p className="text-xs leading-5 text-slate-500">Os totais são calculados sobre os movimentos apresentados (máximo de 500 por consulta) e excluem os anulados. Os registos respeitam as permissões geográficas da sua conta. Esta área não substitui a reconciliação bancária nem a contabilidade oficial.</p>
  </main>;
}
