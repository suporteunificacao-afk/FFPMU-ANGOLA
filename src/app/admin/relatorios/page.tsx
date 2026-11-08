import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const dateField = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800";
const validDate = (value?: string) => !!value && /^\\d{4}-\\d{2}-\\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{from?:string;to?:string}> }) {
  const params = await searchParams;
  const from = validDate(params.from) ? params.from! : "";
  const to = validDate(params.to) ? params.to! : "";
  const supabase = await createClient();
  if (!supabase) redirect("/login?setup=required");
  const {data:{user},error:authError} = await supabase.auth.getUser();
  if (authError || !user) redirect("/login");
  const {data:profile} = await supabase.from("profiles").select("church_id,is_active").eq("id",user.id).maybeSingle();
  if (!profile?.is_active) redirect("/login");
  if (!profile.church_id) redirect("/setup");
  if (from && to && from > to) redirect("/admin/relatorios?error=range");

  async function count(table: "members"|"families"|"visitors"|"visitor_visits"|"events"|"church_services", dateColumn: string) {
    let query = supabase.from(table).select("id",{count:"exact",head:true}).eq("church_id",profile.church_id);
    if (from) query = query.gte(dateColumn,from);
    if (to) query = query.lte(dateColumn,to + (dateColumn === "created_at" ? "T23:59:59.999Z" : ""));
    const result = await query;
    return {value:result.count ?? 0,error:!!result.error};
  }
  const [members,families,visitors,visits,events,services] = await Promise.all([
    count("members","created_at"),count("families","created_at"),count("visitors","created_at"),
    count("visitor_visits","visit_date"),count("events","starts_at"),count("church_services","service_date"),
  ]);
  const metrics = [
    {label:"Membros registados",value:members.value,detail:"Registos criados no período"},
    {label:"Famílias registadas",value:families.value,detail:"Agregados familiares criados"},
    {label:"Visitantes registados",value:visitors.value,detail:"Novos visitantes no período"},
    {label:"Visitas de acompanhamento",value:visits.value,detail:"Visitas registadas"},
    {label:"Eventos",value:events.value,detail:"Eventos com início no período"},
    {label:"Cultos e serviços",value:services.value,detail:"Serviços agendados no período"},
  ];
  const hasError = [members,families,visitors,visits,events,services].some(item=>item.error);
  return <main className="mx-auto max-w-6xl space-y-6">
    <header className="flex flex-wrap items-end justify-between gap-3"><div><Link href="/admin" className="text-sm text-blue-700 hover:underline">← Painel</Link><p className="mt-3 text-xs font-semibold uppercase tracking-wider text-amber-700">Gestão e análise</p><h1 className="mt-1 text-3xl font-semibold text-[#142b4a]">Relatórios administrativos</h1><p className="mt-2 max-w-2xl text-sm text-slate-600">Indicadores calculados a partir dos registos disponíveis para a sua conta. As regras de acesso da sua região ou comunidade continuam aplicadas.</p></div><span className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">Moeda institucional: Kz</span></header>
    <section className="rounded-xl border border-slate-200 bg-white p-5"><h2 className="font-semibold text-[#142b4a]">Período do relatório</h2><form className="mt-3 grid gap-3 sm:grid-cols-[1fr_1fr_auto_auto]"><label className="text-xs font-medium text-slate-600">De<input type="date" name="from" value={from} max={to || undefined} className={dateField+" mt-1"}/></label><label className="text-xs font-medium text-slate-600">Até<input type="date" name="to" value={to} min={from || undefined} className={dateField+" mt-1"}/></label><button className="self-end rounded-lg bg-[#142b4a] px-4 py-2.5 text-sm font-semibold text-white">Aplicar</button><Link href="/admin/relatorios" className="self-end rounded-lg border border-slate-300 px-4 py-2.5 text-center text-sm font-semibold text-slate-700">Limpar</Link></form>{params.from && params.to && params.from > params.to && <p className="mt-2 text-xs text-red-700">A data inicial não pode ser posterior à data final.</p>}</section>
    {hasError && <p role="alert" className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">Alguns indicadores não puderam ser consultados. Verifique as permissões do seu perfil.</p>}
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{metrics.map(metric=><article key={metric.label} className="rounded-xl border border-slate-200 bg-white p-5"><p className="text-sm text-slate-500">{metric.label}</p><p className="mt-2 text-3xl font-semibold tabular-nums text-[#142b4a]">{metric.value.toLocaleString("pt-AO")}</p><p className="mt-1 text-xs text-slate-500">{metric.detail}</p></article>)}</section>
    <section className="rounded-xl border border-slate-200 bg-white p-5"><h2 className="font-semibold text-[#142b4a]">Notas sobre os indicadores</h2><ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-600"><li>Os totais respeitam as políticas de acesso da conta autenticada; responsáveis locais e regionais não recebem totais nacionais por esta página.</li><li>O período usa a data de criação para membros, famílias e visitantes; data da visita para acompanhamentos; data de início para eventos; e data do serviço para cultos.</li><li>Os valores representam registos, não pessoas únicas presentes nem valores financeiros.</li><li>Não são incluídos dados pessoais, notas pastorais ou registos familiares sensíveis.</li></ul></section>
  </main>;
}
