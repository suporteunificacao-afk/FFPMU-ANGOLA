import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createChurchService, updateChurchService } from "./actions";

const field = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800";
const button = "rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800";

export default async function ChurchServicesPage({ searchParams }: {
  searchParams: Promise<{ created?: string; updated?: string; error?: string; q?: string; from?: string; to?: string }>;
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
    .select("id,title,service_type,service_date,start_time,end_time,location,responsible_name,notes,status")
    .eq("church_id", profile.church_id).eq("branch_id", profile.branch_id)
    .order("service_date", { ascending: false }).order("start_time", { ascending: true }).limit(200);
  if (query) servicesQuery = servicesQuery.or("title.ilike.%" + query.replace(/[,%()]/g, " ") + "%,service_type.ilike.%" + query.replace(/[,%()]/g, " ") + "%");
  if (params.from) servicesQuery = servicesQuery.gte("service_date", params.from);
  if (params.to) servicesQuery = servicesQuery.lte("service_date", params.to);
  const { data: services, error } = await servicesQuery;

  return <main className="mx-auto max-w-6xl space-y-6">
    <header>
      <p className="text-sm font-medium text-amber-700">Programação da igreja</p>
      <h1 className="mt-1 text-3xl font-semibold text-[#142b4a]">Cultos e Serviços</h1>
      <p className="mt-2 text-sm text-slate-600">Agende cultos, reuniões de oração, estudos bíblicos e outros serviços da congregação.</p>
    </header>

    {params.created && <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">Culto ou serviço registado com sucesso.</p>}
    {params.updated && <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">Programação actualizada com sucesso.</p>}
    {params.error && <p role="alert" className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">{params.error === "invalid" ? "Verifique os campos obrigatórios e os horários." : "Não foi possível guardar. Verifique as permissões e tente novamente."}</p>}

    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <h2 className="text-lg font-semibold text-[#142b4a]">Agendar culto ou serviço</h2>
      <form action={createChurchService} className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <label className="text-sm font-medium text-slate-700 sm:col-span-2">Nome do culto ou serviço<input name="title" required minLength={2} maxLength={160} placeholder="Ex.: Culto de Domingo" className={field + " mt-1"} /></label>
        <label className="text-sm font-medium text-slate-700">Tipo<select name="service_type" required className={field + " mt-1"}><option>Culto</option><option>Oração</option><option>Estudo bíblico</option><option>Santa Ceia</option><option>Evangelização</option><option>Reunião</option><option>Outro</option></select></label>
        <label className="text-sm font-medium text-slate-700">Data<input name="service_date" type="date" required className={field + " mt-1"} /></label>
        <label className="text-sm font-medium text-slate-700">Hora de início<input name="start_time" type="time" required className={field + " mt-1"} /></label>
        <label className="text-sm font-medium text-slate-700">Hora de fim<input name="end_time" type="time" className={field + " mt-1"} /></label>
        <label className="text-sm font-medium text-slate-700">Local<input name="location" maxLength={160} placeholder="Ex.: Templo principal" className={field + " mt-1"} /></label>
        <label className="text-sm font-medium text-slate-700">Responsável<input name="responsible_name" maxLength={160} placeholder="Nome do responsável" className={field + " mt-1"} /></label>
        <label className="text-sm font-medium text-slate-700 sm:col-span-2 lg:col-span-3">Observações<textarea name="notes" maxLength={2000} rows={2} className={field + " mt-1"} /></label>
        <div className="sm:col-span-2 lg:col-span-3"><button className={button}>Registar programação</button></div>
      </form>
    </section>

    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-xl font-semibold text-[#142b4a]">Programação registada</h2><p className="text-sm text-slate-500">Consulte e actualize o estado dos serviços.</p></div><span className="text-sm text-slate-500">{services?.length ?? 0} registo(s)</span></div>
      <form className="grid gap-2 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-4">
        <input name="q" defaultValue={query} placeholder="Pesquisar nome ou tipo" className={field} />
        <label className="text-xs text-slate-500">De<input type="date" name="from" defaultValue={params.from} className={field + " mt-1"} /></label>
        <label className="text-xs text-slate-500">Até<input type="date" name="to" defaultValue={params.to} className={field + " mt-1"} /></label>
        <button className={button}>Filtrar</button>
      </form>
      {error ? <p className="rounded-xl bg-amber-50 p-5 text-sm text-amber-900">Não foi possível carregar a programação. Verifique a permissão de leitura.</p> : services?.length ? <div className="space-y-3">{services.map(service => <article key={service.id} className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex flex-wrap items-center gap-2"><h3 className="text-lg font-semibold text-[#142b4a]">{service.title}</h3><span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-800">{service.service_type}</span></div><p className="mt-2 text-sm text-slate-600">{new Date(service.service_date + "T12:00:00").toLocaleDateString("pt-AO")} · {String(service.start_time).slice(0,5)}{service.end_time ? " – " + String(service.end_time).slice(0,5) : ""}{service.location ? " · " + service.location : ""}</p><p className="mt-1 text-sm text-slate-500">{service.responsible_name ? "Responsável: " + service.responsible_name : "Sem responsável indicado"}</p>{service.notes && <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">{service.notes}</p>}</div><span className={"rounded-full px-3 py-1 text-xs font-semibold " + (service.status === "Realizado" ? "bg-emerald-50 text-emerald-800" : service.status === "Cancelado" ? "bg-rose-50 text-rose-800" : "bg-amber-50 text-amber-900")}>{service.status}</span></div>
        <details className="mt-4 border-t border-slate-100 pt-3"><summary className="cursor-pointer text-sm font-semibold text-blue-800">Editar programação / estado</summary>
          <form action={updateChurchService} className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <input type="hidden" name="service_id" value={service.id} />
            <label className="text-sm text-slate-700">Nome<input name="title" required defaultValue={service.title} className={field + " mt-1"} /></label>
            <label className="text-sm text-slate-700">Tipo<input name="service_type" required defaultValue={service.service_type} className={field + " mt-1"} /></label>
            <label className="text-sm text-slate-700">Data<input name="service_date" type="date" required defaultValue={service.service_date} className={field + " mt-1"} /></label>
            <label className="text-sm text-slate-700">Início<input name="start_time" type="time" required defaultValue={String(service.start_time).slice(0,5)} className={field + " mt-1"} /></label>
            <label className="text-sm text-slate-700">Fim<input name="end_time" type="time" defaultValue={service.end_time ? String(service.end_time).slice(0,5) : ""} className={field + " mt-1"} /></label>
            <label className="text-sm text-slate-700">Local<input name="location" defaultValue={service.location ?? ""} className={field + " mt-1"} /></label>
            <label className="text-sm text-slate-700">Responsável<input name="responsible_name" defaultValue={service.responsible_name ?? ""} className={field + " mt-1"} /></label>
            <label className="text-sm text-slate-700">Estado<select name="status" defaultValue={service.status} className={field + " mt-1"}><option>Agendado</option><option>Realizado</option><option>Cancelado</option></select></label>
            <label className="text-sm text-slate-700 sm:col-span-2 lg:col-span-3">Observações<textarea name="notes" rows={2} defaultValue={service.notes ?? ""} className={field + " mt-1"} /></label>
            <div className="sm:col-span-2 lg:col-span-3"><button className={button}>Guardar alterações</button></div>
          </form>
        </details>
      </article>)}</div> : <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">Ainda não existem cultos ou serviços registados para esta congregação.</div>}
    </section>
  </main>;
}
