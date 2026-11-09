import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAttendance, updateAttendance, deleteAttendance } from "./actions";

const field = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800";
const button = "rounded-lg bg-[#142b4a] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#203e64]";
const statuses = ["Presente", "Ausente", "Justificada"] as const;
type SearchParams = { service_id?: string; q?: string; created?: string; updated?: string; deleted?: string; error?: string };

function dateLabel(value: string) {
  return new Date(value + "T12:00:00").toLocaleDateString("pt-AO", { day: "2-digit", month: "long", year: "numeric" });
}

function statusClass(status: string) {
  if (status === "Presente") return "bg-emerald-50 text-emerald-800";
  if (status === "Ausente") return "bg-rose-50 text-rose-800";
  return "bg-amber-50 text-amber-900";
}

export default async function AttendancePage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const query = (params.q ?? "").trim().slice(0, 100);
  const supabase = await createClient();
  if (!supabase) redirect("/login?setup=required");
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("church_id,branch_id,is_active").eq("id", user.id).maybeSingle();
  if (!profile?.is_active) redirect("/login");
  if (!profile.church_id) redirect("/setup");

  let servicesQuery = supabase.from("church_services")
    .select("id,title,service_type,service_date,start_time,location,status")
    .eq("church_id", profile.church_id)
    .order("service_date", { ascending: false }).order("start_time", { ascending: true }).limit(150);
  servicesQuery = profile.branch_id ? servicesQuery.eq("branch_id", profile.branch_id) : servicesQuery.is("branch_id", null);
  if (query) servicesQuery = servicesQuery.or("title.ilike.%" + query.replace(/[,%()]/g, " ") + "%,service_type.ilike.%" + query.replace(/[,%()]/g, " ") + "%");
  const { data: services, error: servicesError } = await servicesQuery;

  let membersQuery = supabase.from("members").select("id,full_name,member_code").eq("church_id", profile.church_id).order("full_name").limit(1000);
  membersQuery = profile.branch_id ? membersQuery.eq("branch_id", profile.branch_id) : membersQuery.is("branch_id", null);
  let visitorsQuery = supabase.from("visitors").select("id,full_name").eq("church_id", profile.church_id).order("full_name").limit(1000);
  visitorsQuery = profile.branch_id ? visitorsQuery.eq("branch_id", profile.branch_id) : visitorsQuery.is("branch_id", null);
  const [{ data: members }, { data: visitors }] = await Promise.all([membersQuery, visitorsQuery]);

  const selectedService = (services ?? []).find(item => item.id === params.service_id) ?? services?.[0] ?? null;
  const { data: attendance, error: attendanceError } = selectedService
    ? await supabase.from("service_attendance")
      .select("id,member_id,visitor_id,guest_name,status,notes,marked_at")
      .eq("church_id", profile.church_id).eq("service_id", selectedService.id)
      .order("marked_at", { ascending: true })
    : { data: [], error: null };

  const memberNames = new Map((members ?? []).map(item => [item.id, item.full_name + (item.member_code ? " · " + item.member_code : "")]));
  const visitorNames = new Map((visitors ?? []).map(item => [item.id, item.full_name]));
  const rows = attendance ?? [];
  const presentCount = rows.filter(item => item.status === "Presente").length;
  const absentCount = rows.filter(item => item.status === "Ausente").length;
  const justifiedCount = rows.filter(item => item.status === "Justificada").length;

  return <main className="mx-auto max-w-6xl space-y-6">
    <header className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <Link href="/admin" className="text-sm text-blue-700 hover:underline">← Painel</Link>
        <p className="mt-3 text-sm font-medium text-amber-700">Acompanhamento dos serviços</p>
        <h1 className="mt-1 text-3xl font-semibold text-[#142b4a]">Presenças</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">Registe a presença de membros, visitantes e convidados em cada culto ou serviço.</p>
      </div>
      <Link href="/admin/cultos" className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-[#142b4a]">Ver cultos e serviços</Link>
    </header>

    {params.created && <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">Presença registada com sucesso.</p>}
    {params.updated && <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">Registo de presença actualizado.</p>}
    {params.deleted && <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">Registo de presença removido.</p>}
    {params.error && <p role="alert" className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">{params.error === "invalid" ? "Seleccione um culto e preencha apenas um tipo de pessoa (membro, visitante ou convidado)." : params.error === "duplicate" ? "Esta pessoa já tem um registo de presença neste serviço." : "Não foi possível guardar o registo. Verifique as permissões e tente novamente."}</p>}

    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <form className="flex flex-wrap gap-2">
        <input name="q" defaultValue={query} placeholder="Pesquisar culto ou serviço" className={field + " min-w-0 flex-1"}/>
        <button className={button}>Pesquisar</button>
        {query && <Link href="/admin/presencas" className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700">Limpar</Link>}
      </form>
    </section>

    {servicesError ? <p className="rounded-xl bg-amber-50 p-5 text-sm text-amber-900">Não foi possível carregar os serviços. Verifique a permissão de leitura.</p> : services?.length ? <>
      <section className="space-y-3">
        <div><h2 className="text-xl font-semibold text-[#142b4a]">Escolha o culto ou serviço</h2><p className="text-sm text-slate-500">Seleccione uma programação para consultar ou registar presenças.</p></div>
        <div className="grid gap-3 md:grid-cols-2">
          {services.map(service => <Link key={service.id} href={"/admin/presencas?service_id=" + service.id + (query ? "&q=" + encodeURIComponent(query) : "")} className={"rounded-xl border p-4 transition hover:border-blue-300 hover:shadow-sm " + (selectedService?.id === service.id ? "border-blue-500 bg-blue-50/50" : "border-slate-200 bg-white")}>
            <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-semibold text-[#142b4a]">{service.title}</h3><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700">{service.service_type}</span></div>
            <p className="mt-2 text-sm text-slate-600">{dateLabel(service.service_date)} · {String(service.start_time).slice(0,5)}</p>
            <p className="mt-1 text-xs text-slate-500">{service.location || "Local não indicado"} · {service.status}</p>
          </Link>)}
        </div>
      </section>

      {selectedService && <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div><p className="text-xs font-semibold uppercase tracking-wider text-amber-700">Folha de presenças</p><h2 className="mt-1 text-2xl font-semibold text-[#142b4a]">{selectedService.title}</h2><p className="mt-1 text-sm text-slate-500">{dateLabel(selectedService.service_date)} · {String(selectedService.start_time).slice(0,5)}</p></div>
          <span className="text-sm text-slate-500">{rows.length} pessoa(s) registada(s)</span>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <article className="rounded-xl border border-emerald-200 bg-white p-4"><p className="text-sm text-slate-500">Presentes</p><p className="mt-1 text-2xl font-semibold tabular-nums text-emerald-800">{presentCount}</p></article>
          <article className="rounded-xl border border-rose-200 bg-white p-4"><p className="text-sm text-slate-500">Ausentes</p><p className="mt-1 text-2xl font-semibold tabular-nums text-rose-800">{absentCount}</p></article>
          <article className="rounded-xl border border-amber-200 bg-white p-4"><p className="text-sm text-slate-500">Faltas justificadas</p><p className="mt-1 text-2xl font-semibold tabular-nums text-amber-800">{justifiedCount}</p></article>
        </div>

        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="text-lg font-semibold text-[#142b4a]">Adicionar registo</h3>
          <p className="mt-1 text-sm text-slate-500">Preencha apenas uma das opções: membro, visitante ou convidado sem cadastro.</p>
          <form action={createAttendance} className="mt-4 grid gap-3 md:grid-cols-2">
            <input type="hidden" name="service_id" value={selectedService.id}/>
            <label className="text-sm text-slate-700">Membro<select name="member_id" defaultValue="" className={field + " mt-1"}><option value="">— Não seleccionar —</option>{(members ?? []).map(member => <option key={member.id} value={member.id}>{member.full_name}{member.member_code ? " · " + member.member_code : ""}</option>)}</select></label>
            <label className="text-sm text-slate-700">Visitante registado<select name="visitor_id" defaultValue="" className={field + " mt-1"}><option value="">— Não seleccionar —</option>{(visitors ?? []).map(visitor => <option key={visitor.id} value={visitor.id}>{visitor.full_name}</option>)}</select></label>
            <label className="text-sm text-slate-700">Convidado sem cadastro<input name="guest_name" maxLength={160} placeholder="Nome completo do convidado" className={field + " mt-1"}/></label>
            <label className="text-sm text-slate-700">Estado<select name="status" defaultValue="Presente" className={field + " mt-1"}>{statuses.map(status => <option key={status}>{status}</option>)}</select></label>
            <label className="text-sm text-slate-700 md:col-span-2">Observações<textarea name="notes" maxLength={1000} rows={2} placeholder="Opcional" className={field + " mt-1"}/></label>
            <div className="md:col-span-2"><button className={button}>Registar presença</button></div>
          </form>
        </section>

        <section className="space-y-3">
          <div><h3 className="text-lg font-semibold text-[#142b4a]">Lista de presenças</h3><p className="text-sm text-slate-500">Pode corrigir o estado ou remover um registo.</p></div>
          {attendanceError ? <p className="rounded-lg bg-amber-50 p-4 text-sm text-amber-900">Não foi possível consultar os registos deste serviço.</p> : rows.length ? <div className="space-y-3">{rows.map(item => {
            const personName = item.member_id ? memberNames.get(item.member_id) : item.visitor_id ? visitorNames.get(item.visitor_id) : item.guest_name;
            const personType = item.member_id ? "Membro" : item.visitor_id ? "Visitante" : "Convidado";
            return <article key={item.id} className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-2"><div><p className="font-semibold text-[#142b4a]">{personName || "Pessoa sem identificação"}</p><p className="text-xs text-slate-500">{personType}</p></div><span className={"rounded-full px-3 py-1 text-xs font-semibold " + statusClass(item.status)}>{item.status}</span></div>
              <div className="mt-3 grid gap-3 md:grid-cols-[1fr_1.5fr_auto_auto] md:items-end">
                <form action={updateAttendance} className="contents">
                  <input type="hidden" name="attendance_id" value={item.id}/>
                  <input type="hidden" name="service_id" value={selectedService.id}/>
                  <label className="text-xs font-medium text-slate-600">Estado<select name="status" defaultValue={item.status} className={field + " mt-1"}>{statuses.map(status => <option key={status}>{status}</option>)}</select></label>
                  <label className="text-xs font-medium text-slate-600">Observações<input name="notes" defaultValue={item.notes ?? ""} maxLength={1000} className={field + " mt-1"}/></label>
                  <button className="rounded-lg border border-slate-300 px-3 py-2.5 text-xs font-semibold text-[#142b4a]">Guardar</button>
                </form>
                <form action={deleteAttendance}><input type="hidden" name="attendance_id" value={item.id}/><input type="hidden" name="service_id" value={selectedService.id}/><button className="rounded-lg border border-rose-200 px-3 py-2.5 text-xs font-semibold text-rose-700">Remover</button></form>
              </div>
            </article>;
          })}</div> : <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">Ainda não há presenças registadas para este serviço.</div>}
        </section>
      </section>}
    </> : <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">Ainda não existem cultos ou serviços registados. Crie primeiro uma programação no módulo Cultos e Serviços.</div>}
  </main>;
}
