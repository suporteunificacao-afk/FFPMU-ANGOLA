import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const dateField = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800";
const money = (value: number) => new Intl.NumberFormat("pt-AO", { style: "currency", currency: "AOA", minimumFractionDigits: 2 }).format(value);
const validDate = (value?: string) => !!value && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));

type SearchParams = { from?: string; to?: string; error?: string };

function groupCount(values: (string | null | undefined)[]) {
  const counts = new Map<string, number>();
  for (const value of values) {
    const label = value?.trim() || "Não classificado";
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}

function monthLabel(value: string) {
  const date = new Date(value + "T00:00:00");
  return date.toLocaleDateString("pt-AO", { month: "short", year: "numeric" });
}

export default async function ReportsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const from = validDate(params.from) ? params.from! : "";
  const to = validDate(params.to) ? params.to! : "";
  if (from && to && from > to) redirect("/admin/relatorios?error=range");

  const supabase = await createClient();
  if (!supabase) redirect("/login?setup=required");
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("church_id,is_active").eq("id", user.id).maybeSingle();
  if (!profile?.is_active) redirect("/login");
  if (!profile.church_id) redirect("/setup");

  const db = supabase;
  const churchId = profile.church_id;
  const upperTimestamp = to ? to + "T23:59:59.999Z" : "";
  async function count(table: "members" | "families" | "visitors" | "visitor_visits" | "events" | "church_services", dateColumn: string, timestamp: boolean) {
    let query = db.from(table).select("id", { count: "exact", head: true }).eq("church_id", churchId);
    if (from) query = query.gte(dateColumn, from);
    if (to) query = query.lte(dateColumn, timestamp ? upperTimestamp : to);
    const result = await query;
    return { value: result.count ?? 0, error: !!result.error };
  }

  const financeRpc = (db as unknown as { rpc: (name: string, args: Record<string, unknown>) => Promise<{ data: { transaction_type: string; status: string; total: number | string; transaction_count: number | string }[] | null; error: unknown }> }).rpc;
  const [members, families, visitors, visits, events, services, memberRowsResult, familyRowsResult, visitorRowsResult, financeResult] = await Promise.all([
    count("members", "created_at", true),
    count("families", "created_at", true),
    count("visitors", "created_at", true),
    count("visitor_visits", "visit_date", false),
    count("events", "starts_at", true),
    count("church_services", "service_date", false),
    (() => {
      let query = db.from("members").select("category").eq("church_id", churchId).limit(5000);
      if (from) query = query.gte("created_at", from);
      if (to) query = query.lte("created_at", upperTimestamp);
      return query;
    })(),
    (() => {
      let query = db.from("families").select("status").eq("church_id", churchId).limit(5000);
      if (from) query = query.gte("created_at", from);
      if (to) query = query.lte("created_at", upperTimestamp);
      return query;
    })(),
    (() => {
      let query = db.from("visitors").select("first_visit_date").eq("church_id", churchId).order("first_visit_date", { ascending: true }).limit(5000);
      if (from) query = query.gte("first_visit_date", from);
      if (to) query = query.lte("first_visit_date", to);
      return query;
    })(),
    financeRpc("finance_report_totals", { p_church_id: churchId, p_from: from || null, p_to: to || null }),
  ]);

  const metrics = [
    { label: "Membros registados", value: members.value, detail: "Registos criados no período" },
    { label: "Famílias registadas", value: families.value, detail: "Agregados familiares criados" },
    { label: "Visitantes registados", value: visitors.value, detail: "Novos visitantes no período" },
    { label: "Visitas de acompanhamento", value: visits.value, detail: "Visitas registadas" },
    { label: "Eventos", value: events.value, detail: "Eventos com início no período" },
    { label: "Cultos e serviços", value: services.value, detail: "Serviços agendados no período" },
  ];
  const hasError = [members, families, visitors, visits, events, services].some(item => item.error) ||
    !!memberRowsResult.error || !!familyRowsResult.error || !!visitorRowsResult.error;
  const memberCategories = groupCount((memberRowsResult.data ?? []).map(row => row.category));
  const familyStatuses = groupCount((familyRowsResult.data ?? []).map(row => row.status));
  const monthlyVisitors = new Map<string, number>();
  for (const row of visitorRowsResult.data ?? []) {
    if (!row.first_visit_date) continue;
    const key = row.first_visit_date.slice(0, 7);
    monthlyVisitors.set(key, (monthlyVisitors.get(key) ?? 0) + 1);
  }
  const visitorMonths = [...monthlyVisitors.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  const financeRows = financeResult.data ?? [];
  const financeIncoming = financeRows.filter(row => row.transaction_type === "entrada" && row.status === "confirmado").reduce((sum, row) => sum + Number(row.total), 0);
  const financeOutgoing = financeRows.filter(row => row.transaction_type === "saida" && row.status === "confirmado").reduce((sum, row) => sum + Number(row.total), 0);
  const financeCancelled = financeRows.filter(row => row.status === "anulado").reduce((sum, row) => sum + Number(row.transaction_count), 0);

  return <main className="mx-auto max-w-6xl space-y-6">
    <header className="flex flex-wrap items-end justify-between gap-3"><div><Link href="/admin" className="text-sm text-blue-700 hover:underline">← Painel</Link><p className="mt-3 text-xs font-semibold uppercase tracking-wider text-amber-700">Gestão e análise</p><h1 className="mt-1 text-3xl font-semibold text-[#142b4a]">Relatórios administrativos</h1><p className="mt-2 max-w-2xl text-sm text-slate-600">Indicadores calculados a partir dos registos disponíveis para a sua conta. As regras de acesso da sua região ou comunidade continuam aplicadas.</p></div><span className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">Moeda institucional: Kz</span></header>
    <section className="rounded-xl border border-slate-200 bg-white p-5"><h2 className="font-semibold text-[#142b4a]">Período do relatório</h2><form className="mt-3 grid gap-3 sm:grid-cols-[1fr_1fr_auto_auto]"><label className="text-xs font-medium text-slate-600">De<input type="date" name="from" value={from} max={to || undefined} className={dateField + " mt-1"}/></label><label className="text-xs font-medium text-slate-600">Até<input type="date" name="to" value={to} min={from || undefined} className={dateField + " mt-1"}/></label><button className="self-end rounded-lg bg-[#142b4a] px-4 py-2.5 text-sm font-semibold text-white">Aplicar</button><Link href="/admin/relatorios" className="self-end rounded-lg border border-slate-300 px-4 py-2.5 text-center text-sm font-semibold text-slate-700">Limpar</Link></form>{params.error === "range" && <p role="alert" className="mt-2 text-xs text-red-700">A data inicial não pode ser posterior à data final.</p>}</section>
    {(hasError || !!financeResult.error) && <p role="alert" className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">Alguns indicadores não puderam ser consultados. Verifique as permissões do seu perfil.</p>}
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{metrics.map(metric => <article key={metric.label} className="rounded-xl border border-slate-200 bg-white p-5"><p className="text-sm text-slate-500">{metric.label}</p><p className="mt-2 text-3xl font-semibold tabular-nums text-[#142b4a]">{metric.value.toLocaleString("pt-AO")}</p><p className="mt-1 text-xs text-slate-500">{metric.detail}</p></article>)}</section>
    <section className="space-y-3"><div><h2 className="text-xl font-semibold text-[#142b4a]">Resumo financeiro</h2><p className="text-sm text-slate-500">Totais agregados directamente na base de dados, considerando todas as movimentações autorizadas no período.</p></div>
      {financeResult.error ? <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Não foi possível consultar os totais financeiros. Confirme se a migração de relatórios financeiros foi aplicada e se a conta tem a permissão necessária.</p> : <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-xl border border-emerald-200 bg-white p-5"><p className="text-sm text-slate-500">Entradas confirmadas</p><p className="mt-2 text-2xl font-semibold tabular-nums text-emerald-800">{money(financeIncoming)}</p></article>
        <article className="rounded-xl border border-rose-200 bg-white p-5"><p className="text-sm text-slate-500">Saídas confirmadas</p><p className="mt-2 text-2xl font-semibold tabular-nums text-rose-800">{money(financeOutgoing)}</p></article>
        <article className="rounded-xl border border-slate-200 bg-white p-5"><p className="text-sm text-slate-500">Saldo financeiro</p><p className={"mt-2 text-2xl font-semibold tabular-nums "+(financeIncoming-financeOutgoing>=0?"text-[#142b4a]":"text-rose-800")}>{money(financeIncoming-financeOutgoing)}</p></article>
        <article className="rounded-xl border border-amber-200 bg-white p-5"><p className="text-sm text-slate-500">Movimentos anulados</p><p className="mt-2 text-2xl font-semibold tabular-nums text-amber-800">{financeCancelled.toLocaleString("pt-AO")}</p></article>
      </div>}
    </section>
    <section className="grid gap-4 lg:grid-cols-2">
      <article className="rounded-xl border border-slate-200 bg-white p-5"><h2 className="font-semibold text-[#142b4a]">Membros por categoria</h2><p className="mt-1 text-xs text-slate-500">Distribuição dos membros criados no período seleccionado.</p>{memberCategories.length ? <ul className="mt-4 space-y-3">{memberCategories.map(([label, value]) => <li key={label}><div className="flex justify-between gap-3 text-sm"><span className="text-slate-700">{label}</span><strong className="tabular-nums text-[#142b4a]">{value}</strong></div><div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-[#bd9148]" style={{ width: (value / Math.max(1, memberRowsResult.data?.length ?? 0) * 100) + "%" }}/></div></li>)}</ul> : <p className="mt-4 text-sm text-slate-500">Sem dados para apresentar.</p>}</article>
      <article className="rounded-xl border border-slate-200 bg-white p-5"><h2 className="font-semibold text-[#142b4a]">Famílias por estado</h2><p className="mt-1 text-xs text-slate-500">Situação dos agregados familiares criados no período.</p>{familyStatuses.length ? <ul className="mt-4 space-y-3">{familyStatuses.map(([label, value]) => <li key={label} className="flex justify-between gap-3 border-b border-slate-100 pb-2 text-sm"><span className="text-slate-700">{label}</span><strong className="tabular-nums text-[#142b4a]">{value}</strong></li>)}</ul> : <p className="mt-4 text-sm text-slate-500">Sem dados para apresentar.</p>}</article>
    </section>
    <section className="rounded-xl border border-slate-200 bg-white p-5"><h2 className="font-semibold text-[#142b4a]">Evolução de visitantes</h2><p className="mt-1 text-xs text-slate-500">Novos visitantes agrupados pelo mês da primeira visita.</p>{visitorMonths.length ? <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">{visitorMonths.map(([month, value]) => <div key={month} className="rounded-lg bg-slate-50 p-3"><p className="text-xs capitalize text-slate-500">{monthLabel(month + "-01")}</p><p className="mt-1 text-2xl font-semibold tabular-nums text-[#142b4a]">{value}</p></div>)}</div> : <p className="mt-4 text-sm text-slate-500">Sem primeiras visitas registadas no período.</p>}</section>
    <section className="rounded-xl border border-slate-200 bg-white p-5"><h2 className="font-semibold text-[#142b4a]">Notas sobre os indicadores</h2><ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-600"><li>Os totais respeitam as políticas de acesso da conta autenticada; responsáveis locais e regionais não recebem totais nacionais por esta página.</li><li>O período usa a data de criação para membros, famílias e visitantes; data da visita para acompanhamentos; data de início para eventos; e data do serviço para cultos.</li><li>As distribuições usam categoria dos membros, estado das famílias e mês da primeira visita dos visitantes. Listagens de análise são limitadas a 5.000 registos por secção.</li><li>O resumo financeiro considera todos os movimentos do período visíveis pelas permissões geográficas da conta; movimentos anulados são excluídos das entradas, saídas e saldo.</li><li>Os restantes indicadores representam registos, não pessoas únicas presentes.</li><li>Não são incluídos dados pessoais, notas pastorais ou registos familiares sensíveis.</li></ul></section>
  </main>;
}
