import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createVisitor, recordVisitorVisit, updateVisitorFollowUp } from "./actions";

const field = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800";
const button = "rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800";
const today = new Date().toISOString().slice(0, 10);
const statuses: Record<string,string> = { novo: "Novo", em_acompanhamento: "Em acompanhamento", integrado: "Integrado", sem_contacto: "Sem contacto" };

export default async function VisitorsPage({ searchParams }: {
  searchParams: Promise<{ created?: string; visit?: string; updated?: string; error?: string; q?: string; status?: string }>;
}) {
  const params = await searchParams;
  const query = (params.q ?? "").trim().replace(/[,%()]/g, " ").slice(0,80);
  const statusFilter = Object.keys(statuses).includes(params.status ?? "") ? params.status! : "";
  const supabase = await createClient();
  if (!supabase) redirect("/login?setup=required");
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("church_id,is_active").eq("id",user.id).maybeSingle();
  if (!profile?.is_active) redirect("/login");
  if (!profile.church_id) redirect("/setup");

  let visitorsQuery = supabase.from("visitors").select("id,full_name,phone,whatsapp,email,address,first_visit_date,invited_by,status,follow_up_notes,created_at").eq("church_id",profile.church_id).order("created_at",{ascending:false}).limit(200);
  if (query) visitorsQuery = visitorsQuery.ilike("full_name","%" + query + "%");
  if (statusFilter) visitorsQuery = visitorsQuery.eq("status",statusFilter);
  const [{data: visitors,error}, {data: visits}] = await Promise.all([
    visitorsQuery,
    supabase.from("visitor_visits").select("id,visitor_id,visit_date,activity,notes").eq("church_id",profile.church_id).order("visit_date",{ascending:false}).limit(500),
  ]);
  const rows = visitors ?? [];
  const visitRows = visits ?? [];
  const counts = Object.fromEntries(Object.keys(statuses).map(key => [key, rows.filter(v => v.status === key).length]));

  return <main className="mx-auto max-w-6xl space-y-6">
    <header className="flex flex-wrap items-end justify-between gap-3">
      <div><Link href="/admin" className="text-sm text-blue-700 hover:underline">← Painel</Link><h1 className="mt-2 text-3xl font-semibold text-[#142b4a]">Visitantes</h1><p className="mt-1 text-sm text-slate-600">Registe visitas, acompanhe contactos e apoie a integração na igreja.</p></div>
      <div className="rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-900"><strong>{rows.length}</strong> registo(s) nesta consulta</div>
    </header>
    {params.created && <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">Visitante registado com sucesso.</p>}
    {params.visit && <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">Visita adicionada ao histórico.</p>}
    {params.updated && <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">Acompanhamento actualizado.</p>}
    {params.error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{params.error === "invalid" ? "Verifique os campos introduzidos." : "Não foi possível guardar. Confirme as permissões e tente novamente."}</p>}

    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {Object.entries(statuses).map(([key,label]) => <div key={key} className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs text-slate-500">{label}</p><p className="mt-1 text-2xl font-semibold text-[#142b4a]">{counts[key]}</p></div>)}
    </section>



    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-lg font-semibold text-[#142b4a]">Lista e acompanhamento</h2><p className="text-sm text-slate-500">Abra cada registo para consultar o histórico e actualizar o acompanhamento.</p></div>
        <form className="flex flex-wrap gap-2"><input name="q" defaultValue={query} placeholder="Pesquisar nome" className={field + " w-48"}/><select name="status" defaultValue={statusFilter} className={field + " w-44"}><option value="">Todos os estados</option>{Object.entries(statuses).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select><button className="rounded-lg border border-slate-300 px-3 py-2 text-sm">Filtrar</button></form>
      </div>
      {error ? <p className="rounded-lg bg-amber-50 p-4 text-sm text-amber-900">Não foi possível carregar os visitantes. Verifique a permissão members.read.</p> : rows.length === 0 ? <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">Ainda não existem visitantes nesta consulta.</div> :
      <div className="space-y-4">{rows.map(visitor => {
        const history = visitRows.filter(v => v.visitor_id === visitor.id);
        return <article key={visitor.id} className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="text-lg font-semibold text-[#142b4a]">{visitor.full_name}</h3><p className="mt-1 text-sm text-slate-500">{visitor.phone || "Sem telefone"}{visitor.email ? " · " + visitor.email : ""}</p><p className="mt-1 text-xs text-slate-500">Primeira visita: {new Date(visitor.first_visit_date + "T00:00:00").toLocaleDateString("pt-AO")}{visitor.invited_by ? " · Convidado por: " + visitor.invited_by : ""}</p></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{statuses[visitor.status] ?? visitor.status}</span></div>
          <details className="mt-4 border-t border-slate-100 pt-3"><summary className="cursor-pointer text-sm font-semibold text-blue-800">Histórico e acompanhamento ({history.length} visita(s))</summary>
            <div className="mt-3 grid gap-4 lg:grid-cols-2">
              <div><h4 className="text-sm font-semibold text-slate-700">Visitas registadas</h4>{history.length ? <ol className="mt-2 space-y-2">{history.map(v=><li key={v.id} className="rounded-lg bg-slate-50 p-3 text-sm"><strong>{new Date(v.visit_date + "T00:00:00").toLocaleDateString("pt-AO")}</strong> · {v.activity}{v.notes && <p className="mt-1 text-xs text-slate-600">{v.notes}</p>}</li>)}</ol> : <p className="mt-2 text-sm text-slate-500">Ainda sem visitas adicionais registadas.</p>}
                <form action={recordVisitorVisit} className="mt-3 space-y-2 rounded-lg border border-slate-200 p-3"><input type="hidden" name="visitor_id" value={visitor.id}/><h5 className="text-sm font-semibold">Adicionar visita</h5><input name="visit_date" type="date" defaultValue={today} required className={field}/><input name="activity" required minLength={2} maxLength={160} placeholder="Ex.: Culto dominical" className={field}/><textarea name="notes" rows={2} maxLength={2000} placeholder="Observações da visita" className={field}/><button className={button}>Registar visita</button></form>
              </div>
              <form action={updateVisitorFollowUp} className="space-y-2"><input type="hidden" name="visitor_id" value={visitor.id}/><h4 className="text-sm font-semibold text-slate-700">Estado e notas de acompanhamento</h4><select name="status" defaultValue={visitor.status} className={field}>{Object.entries(statuses).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select><textarea name="follow_up_notes" defaultValue={visitor.follow_up_notes ?? ""} rows={5} maxLength={2000} placeholder="Registe contactos feitos e próximos passos..." className={field}/><button className={button}>Guardar acompanhamento</button></form>
            </div>
          </details>
        </article>;
      })}</div>}
    </section>
        <details className="rounded-xl border border-slate-200 bg-white p-5"><summary className="cursor-pointer list-none font-semibold text-blue-800">＋ Registar visitante</summary><section className="pt-4">
      <h2 className="font-semibold text-[#142b4a]">Registar visitante</h2>
      <form action={createVisitor} className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <label className="text-xs font-medium text-slate-700">Nome completo *<input name="full_name" required minLength={2} maxLength={160} className={field} /></label>
        <label className="text-xs font-medium text-slate-700">Telefone<input name="phone" maxLength={40} className={field} /></label>
        <label className="text-xs font-medium text-slate-700">WhatsApp<input name="whatsapp" maxLength={40} className={field} /></label>
        <label className="text-xs font-medium text-slate-700">E-mail<input name="email" type="email" maxLength={254} className={field} /></label>
        <label className="text-xs font-medium text-slate-700">Data da primeira visita<input name="first_visit_date" type="date" defaultValue={today} className={field} /></label>
        <label className="text-xs font-medium text-slate-700">Convidado por<input name="invited_by" maxLength={160} className={field} /></label>
        <label className="text-xs font-medium text-slate-700 sm:col-span-2">Morada<input name="address" maxLength={500} className={field} /></label>
        <label className="text-xs font-medium text-slate-700 lg:col-span-3">Observações iniciais<textarea name="follow_up_notes" rows={2} maxLength={2000} className={field} /></label>
        <div className="lg:col-span-3"><button className={button}>Guardar visitante</button></div>
      </form>
    </section></details>
  </main>;
}
