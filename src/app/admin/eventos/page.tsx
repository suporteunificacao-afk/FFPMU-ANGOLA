import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createEvent, registerEventParticipant, updateEventStatus, updateRegistrationStatus } from "./actions";

const field = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800";
const button = "rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800";

export default async function EventsPage({ searchParams }: {
  searchParams: Promise<{ created?: string; registered?: string; updated?: string; error?: string; q?: string; status?: string }>;
}) {
  const params = await searchParams;
  const query = (params.q ?? "").trim().slice(0, 100);
  const supabase = await createClient();
  if (!supabase) redirect("/login?setup=required");
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("church_id,is_active").eq("id", user.id).maybeSingle();
  if (!profile?.is_active) redirect("/login");
  if (!profile.church_id) redirect("/setup");

  let eventsQuery = supabase.from("events")
    .select("id,title,description,event_type,starts_at,ends_at,location,is_public,registration_required,capacity,status")
    .eq("church_id", profile.church_id).order("starts_at", { ascending: false }).limit(200);
  if (query) eventsQuery = eventsQuery.ilike("title", "%" + query.replace(/[,%()]/g, " ") + "%");
  if (params.status && ["Agendado","Em curso","Realizado","Cancelado"].includes(params.status)) eventsQuery = eventsQuery.eq("status", params.status);
  const { data: events, error } = await eventsQuery;
  const ids = (events ?? []).map(e => e.id);
  const registrationsQuery = ids.length
    ? supabase.from("event_registrations").select("id,event_id,participant_name,phone,email,status,created_at").eq("church_id", profile.church_id).in("event_id", ids).order("created_at", { ascending: false })
    : null;
  const [{ data: registrations }, { data: members }] = await Promise.all([
    registrationsQuery ? registrationsQuery : Promise.resolve({ data: [] }),
    supabase.from("members").select("id,full_name").eq("church_id", profile.church_id).order("full_name").limit(500),
  ]);
  const registrationsByEvent = new Map<string, NonNullable<typeof registrations>>();
  for (const registration of registrations ?? []) {
    const list = registrationsByEvent.get(registration.event_id) ?? [];
    list.push(registration);
    registrationsByEvent.set(registration.event_id, list);
  }

  return <main className="mx-auto max-w-6xl space-y-6">
    <header>
      <p className="text-sm font-medium text-amber-700">Programação e participação</p>
      <h1 className="mt-1 text-3xl font-semibold text-[#142b4a]">Eventos e Inscrições</h1>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Registe conferências, seminários, encontros, actividades e eventos especiais. Controle participantes e inscrições dentro do âmbito autorizado da sua conta.</p>
    </header>

    {params.created && <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">Evento registado com sucesso.</p>}
    {params.registered && <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">Participante inscrito com sucesso.</p>}
    {params.updated && <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">Alterações guardadas com sucesso.</p>}
    {params.error && <p role="alert" className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">{params.error === "invalid" ? "Verifique os campos obrigatórios." : params.error === "capacity" ? "O limite de participantes deste evento foi atingido." : params.error === "registration" ? "Não foi possível inscrever. O participante pode já estar inscrito ou não ter autorização." : "Não foi possível concluir a operação. Verifique as permissões e tente novamente."}</p>}

    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <h2 className="text-lg font-semibold text-[#142b4a]">Criar evento</h2>
      <form action={createEvent} className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <label className="text-sm font-medium text-slate-700 sm:col-span-2">Nome do evento<input name="title" required minLength={2} maxLength={180} placeholder="Ex.: Seminário Nacional" className={field + " mt-1"} /></label>
        <label className="text-sm font-medium text-slate-700">Tipo<select name="event_type" className={field + " mt-1"}><option>Seminário</option><option>Conferência</option><option>Encontro</option><option>Retiro</option><option>Formação</option><option>Actividade comunitária</option><option>Outro</option></select></label>
        <label className="text-sm font-medium text-slate-700">Início<input name="starts_at" type="datetime-local" required className={field + " mt-1"} /></label>
        <label className="text-sm font-medium text-slate-700">Fim (opcional)<input name="ends_at" type="datetime-local" className={field + " mt-1"} /></label>
        <label className="text-sm font-medium text-slate-700">Local<input name="location" maxLength={180} placeholder="Local do evento" className={field + " mt-1"} /></label>
        <label className="text-sm font-medium text-slate-700">Limite de participantes<input name="capacity" type="number" min="1" step="1" placeholder="Sem limite definido" className={field + " mt-1"} /></label>
        <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" name="is_public" className="size-4" /> Evento público</label>
        <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" name="registration_required" className="size-4" /> Exige inscrição</label>
        <label className="text-sm font-medium text-slate-700 sm:col-span-2 lg:col-span-3">Descrição / informações<textarea name="description" rows={3} maxLength={4000} className={field + " mt-1"} /></label>
        <div className="sm:col-span-2 lg:col-span-3"><button className={button}>Guardar evento</button></div>
      </form>
    </section>

    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-xl font-semibold text-[#142b4a]">Eventos registados</h2><p className="text-sm text-slate-500">Lista limitada aos eventos que a sua conta pode consultar.</p></div><span className="text-sm text-slate-500">{events?.length ?? 0} evento(s)</span></div>
      <form className="grid gap-2 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-3">
        <input name="q" defaultValue={query} placeholder="Pesquisar evento" className={field} />
        <select name="status" defaultValue={params.status ?? ""} className={field}><option value="">Todos os estados</option><option>Agendado</option><option>Em curso</option><option>Realizado</option><option>Cancelado</option></select>
        <button className={button}>Filtrar</button>
      </form>
      {error ? <p className="rounded-xl bg-amber-50 p-5 text-sm text-amber-900">Não foi possível carregar os eventos. Verifique a permissão de leitura.</p> : events?.length ? <div className="space-y-3">{events.map(event => {
        const list = registrationsByEvent.get(event.id) ?? [];
        return <article key={event.id} className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="text-lg font-semibold text-[#142b4a]">{event.title}</h3><span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-800">{event.event_type}</span>{event.is_public && <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs text-emerald-800">Público</span>}</div>
              <p className="mt-2 text-sm text-slate-600">{new Date(event.starts_at).toLocaleString("pt-AO", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Luanda" })}{event.ends_at ? " – " + new Date(event.ends_at).toLocaleString("pt-AO", { dateStyle: "short", timeStyle: "short", timeZone: "Africa/Luanda" }) : ""}{event.location ? " · " + event.location : ""}</p>
              {event.description && <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">{event.description}</p>}
              <p className="mt-1 text-xs text-slate-500">{list.length} inscrição(ões){event.capacity ? " · limite " + event.capacity : ""}{event.registration_required ? " · inscrição obrigatória" : ""}</p>
            </div>
            <form action={updateEventStatus} className="flex items-center gap-2"><input type="hidden" name="event_id" value={event.id} /><select name="status" defaultValue={event.status} className="rounded-lg border border-slate-300 px-2 py-2 text-xs"><option>Agendado</option><option>Em curso</option><option>Realizado</option><option>Cancelado</option></select><button className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700">Actualizar</button></form>
          </div>
          <details className="mt-4 border-t border-slate-100 pt-3"><summary className="cursor-pointer text-sm font-semibold text-blue-800">Inscrições e participantes ({list.length})</summary>
            <form action={registerEventParticipant} className="mt-3 grid gap-3 rounded-lg bg-slate-50 p-3 sm:grid-cols-2 lg:grid-cols-4">
              <input type="hidden" name="event_id" value={event.id} />
              <label className="text-xs font-medium text-slate-600">Membro registado (opcional)<select name="member_id" className={field + " mt-1"}><option value="">Participante externo / inserir nome</option>{(members ?? []).map(member => <option key={member.id} value={member.id}>{member.full_name}</option>)}</select></label>
              <label className="text-xs font-medium text-slate-600">Nome do participante<input name="participant_name" maxLength={180} placeholder="Obrigatório para externo" className={field + " mt-1"} /></label>
              <label className="text-xs font-medium text-slate-600">Telefone<input name="phone" maxLength={40} className={field + " mt-1"} /></label>
              <label className="text-xs font-medium text-slate-600">E-mail<input name="email" type="email" maxLength={180} className={field + " mt-1"} /></label>
              <div className="sm:col-span-2 lg:col-span-4"><button className={button}>Inscrever participante</button></div>
            </form>
            {list.length ? <div className="mt-3 divide-y divide-slate-100">{list.map(reg => <div key={reg.id} className="flex flex-wrap items-center justify-between gap-3 py-3"><div><p className="text-sm font-medium text-slate-800">{reg.participant_name}</p><p className="text-xs text-slate-500">{reg.phone ?? ""}{reg.email ? " · " + reg.email : ""}</p></div><form action={updateRegistrationStatus} className="flex items-center gap-2"><input type="hidden" name="registration_id" value={reg.id} /><input type="hidden" name="event_id" value={event.id} /><select name="status" defaultValue={reg.status} className="rounded-lg border border-slate-300 px-2 py-2 text-xs"><option>Inscrito</option><option>Confirmado</option><option>Presente</option><option>Cancelado</option></select><button className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700">Guardar</button></form></div>)}</div> : <p className="mt-3 text-sm text-slate-500">Ainda não há participantes inscritos.</p>}
          </details>
        </article>;
      })}</div> : <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">Ainda não existem eventos registados neste âmbito.</div>}
    </section>
  </main>;
}
