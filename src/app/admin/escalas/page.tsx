import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createRosterAssignment, updateRosterAssignment, deleteRosterAssignment } from "./actions";

const field = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800";
const button = "rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800";

export default async function RostersPage({ searchParams }: {
  searchParams: Promise<{ created?: string; updated?: string; deleted?: string; error?: string; q?: string }>;
}) {
  const params = await searchParams;
  const query = (params.q ?? "").trim().slice(0, 100);
  const supabase = await createClient();
  if (!supabase) redirect("/login?setup=required");
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("church_id,branch_id,is_active").eq("id", user.id).maybeSingle();
  if (!profile?.is_active) redirect("/login");
  if (!profile.church_id) redirect("/setup");

  let servicesQuery = supabase.from("church_services")
    .select("id,title,service_type,service_date,start_time,location,status")
    .eq("church_id", profile.church_id).eq("branch_id", profile.branch_id)
    .order("service_date", { ascending: false }).order("start_time", { ascending: true }).limit(100);
  if (query) servicesQuery = servicesQuery.ilike("title", "%" + query.replace(/[,%()]/g, " ") + "%");
  const { data: services, error: servicesError } = await servicesQuery;
  const { data: members } = await supabase.from("members").select("id,full_name,member_code")
    .eq("church_id", profile.church_id).eq("branch_id", profile.branch_id).order("full_name", { ascending: true }).limit(500);
  const serviceIds = (services ?? []).map(item => item.id);
  const { data: assignments, error: assignmentsError } = serviceIds.length
    ? await supabase.from("service_roster_assignments").select("id,service_id,member_id,position_title,notes,display_order,members(full_name,member_code)")
      .eq("church_id", profile.church_id).eq("branch_id", profile.branch_id).in("service_id", serviceIds).order("display_order", { ascending: true })
    : { data: [], error: null };
  const rosterByService = new Map<string, typeof assignments>();
  (assignments ?? []).forEach(item => rosterByService.set(item.service_id, [...(rosterByService.get(item.service_id) ?? []), item]));

  return <main className="mx-auto max-w-6xl space-y-6">
    <header>
      <p className="text-sm font-medium text-amber-700">Organização das equipas</p>
      <h1 className="mt-1 text-3xl font-semibold text-[#142b4a]">Escalas</h1>
      <p className="mt-2 text-sm text-slate-600">Distribua os membros pelas funções de cada culto ou serviço e mantenha as equipas organizadas.</p>
    </header>

    {params.created && <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">Integrante adicionado à escala com sucesso.</p>}
    {params.updated && <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">Escala actualizada com sucesso.</p>}
    {params.deleted && <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">Integrante removido da escala.</p>}
    {params.error && <p role="alert" className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">{params.error === "invalid" ? "Seleccione um culto e um membro e indique uma função válida." : params.error === "duplicate" ? "Este membro já está atribuído a essa função neste serviço." : "Não foi possível guardar a escala. Verifique as permissões e tente novamente."}</p>}

    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h2 className="text-xl font-semibold text-[#142b4a]">Cultos e serviços</h2><p className="text-sm text-slate-500">Abra cada programação para atribuir e gerir os integrantes.</p></div>
        <form className="flex gap-2"><input name="q" defaultValue={query} placeholder="Pesquisar programação" className={field + " w-56"}/><button className="rounded-lg border border-slate-300 px-3 py-2 text-sm">Pesquisar</button></form>
      </div>
      {servicesError || assignmentsError ? <p className="rounded-xl bg-amber-50 p-5 text-sm text-amber-900">Não foi possível carregar as escalas. Verifique a permissão de leitura.</p>
      : services?.length ? <div className="space-y-4">{services.map(service => {
        const rows = rosterByService.get(service.id) ?? [];
        return <article key={service.id} className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div><div className="flex flex-wrap items-center gap-2"><h3 className="text-lg font-semibold text-[#142b4a]">{service.title}</h3><span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-800">{service.service_type}</span></div>
              <p className="mt-2 text-sm text-slate-600">{new Date(service.service_date + "T12:00:00").toLocaleDateString("pt-AO")} · {String(service.start_time).slice(0,5)}{service.location ? " · " + service.location : ""}</p>
            </div>
            <span className="text-xs text-slate-500">{rows.length} função(ões) atribuída(s)</span>
          </div>
          {rows.length ? <div className="mt-4 divide-y divide-slate-100 border-y border-slate-100">{rows.map(item => {
            const person = Array.isArray(item.members) ? item.members[0] : item.members;
            return <div key={item.id} className="grid gap-3 py-3 md:grid-cols-[1fr_1.3fr_auto] md:items-center">
              <div><p className="font-medium text-[#142b4a]">{person?.full_name ?? "Membro"}</p><p className="text-xs text-slate-500">{person?.member_code ?? ""}</p></div>
              <form action={updateRosterAssignment} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                <input type="hidden" name="assignment_id" value={item.id}/>
                <input name="position_title" required minLength={2} maxLength={120} defaultValue={item.position_title} aria-label="Função na escala" className={field}/>
                <input name="notes" maxLength={1000} defaultValue={item.notes ?? ""} placeholder="Observações" aria-label="Observações" className={field}/>
                <button className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-[#142b4a]">Guardar</button>
              </form>
              <form action={deleteRosterAssignment}><input type="hidden" name="assignment_id" value={item.id}/><button className="rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700">Remover</button></form>
            </div>;
          })}</div> : <p className="mt-4 rounded-lg bg-slate-50 p-4 text-sm text-slate-500">Ainda não há integrantes atribuídos a este serviço.</p>}
          <details className="mt-4 border-t border-slate-100 pt-3"><summary className="cursor-pointer text-sm font-semibold text-blue-800">＋ Adicionar integrante à escala</summary>
            <form action={createRosterAssignment} className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <input type="hidden" name="service_id" value={service.id}/>
              <label className="text-sm text-slate-700 sm:col-span-2">Membro<select name="member_id" required className={field + " mt-1"}><option value="">Seleccione um membro</option>{(members ?? []).map(member => <option key={member.id} value={member.id}>{member.full_name}{member.member_code ? " · " + member.member_code : ""}</option>)}</select></label>
              <label className="text-sm text-slate-700">Função<input name="position_title" required minLength={2} maxLength={120} list="roster-roles" placeholder="Ex.: Dirigente" className={field + " mt-1"}/></label>
              <label className="text-sm text-slate-700">Observações<input name="notes" maxLength={1000} placeholder="Opcional" className={field + " mt-1"}/></label>
              <datalist id="roster-roles"><option value="Dirigente"/><option value="Pregador"/><option value="Mestre de cerimónias"/><option value="Louvor"/><option value="Músico"/><option value="Leitura bíblica"/><option value="Oração"/><option value="Recepção"/><option value="Som e multimédia"/><option value="Intercessão"/><option value="Apoio e organização"/></datalist>
              <div className="sm:col-span-2 lg:col-span-4"><button className={button} disabled={!members?.length}>Adicionar à escala</button></div>
            </form>
            {!members?.length && <p className="mt-2 text-xs text-amber-700">Registe membros antes de criar escalas.</p>}
          </details>
        </article>;
      })}</div> : <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">Ainda não existem cultos ou serviços registados. Crie primeiro uma programação no módulo Cultos e Serviços.</div>}
    </section>
  </main>;
}
