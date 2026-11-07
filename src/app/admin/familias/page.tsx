import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createFamily, setFamilyResponsible, removeMemberFromFamily, addFamilyRelationship, removeFamilyRelationship, addFamilyHistoryRecord, removeFamilyHistoryRecord } from "./actions";

const input = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800";
const button = "rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800";

export default async function FamiliesPage({ searchParams }: {
  searchParams: Promise<{ created?: string; updated?: string; error?: string; removed?: string; relationAdded?: string; relationRemoved?: string; historyAdded?: string; historyRemoved?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  if (!supabase) redirect("/login?setup=required");
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("church_id,is_active").eq("id", user.id).maybeSingle();
  if (!profile?.is_active) redirect("/login");
  if (!profile.church_id) redirect("/setup");

  const [{ data: families, error }, { data: members }, { data: relationships }, { data: history }] = await Promise.all([
    supabase.from("families").select("id,family_name,family_code,status,phone,email,address,blessing_date,responsible_member_id,created_at").eq("church_id", profile.church_id).order("family_name"),
    supabase.from("members").select("id,full_name,birth_date,phone,family_id,category").eq("church_id", profile.church_id).order("full_name").limit(500),
    supabase.from("family_relationships").select("id,family_id,member_id,related_member_id,relationship_type,notes").eq("church_id", profile.church_id).order("created_at"),
    supabase.from("family_history_records").select("id,family_id,record_type,event_date,title,details,related_member_id").eq("church_id", profile.church_id).order("event_date",{ascending:false}),
  ]);
  const people = members ?? [];
  const familyRows = families ?? [];
  const relationshipRows = relationships ?? [];
  const historyRows = history ?? [];

  return <main className="mx-auto max-w-6xl space-y-6">
    <header className="flex flex-wrap items-end justify-between gap-3">
      <div><Link href="/admin" className="text-sm text-blue-700 hover:underline">← Painel</Link><h1 className="mt-2 text-3xl font-semibold text-[#142b4a]">Famílias</h1><p className="mt-1 text-sm text-slate-600">Organize os agregados familiares, identifique responsáveis e acompanhe as crianças.</p></div>
      <div className="rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-900"><strong>{familyRows.length}</strong> famílias · <strong>{people.length}</strong> membros</div>
    </header>

    {params.created && <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">Família criada com sucesso.</p>}
    {params.removed && <p role="status" className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">Membro retirado da família. O cadastro do membro foi mantido.</p>}
    {params.updated && <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">Responsável familiar actualizado.</p>}
    {params.relationAdded && <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">Relação familiar registada.</p>}
    {params.relationRemoved && <p role="status" className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">Relação familiar removida.</p>}
    {params.historyAdded && <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">Registo adicionado ao histórico familiar.</p>}
    {params.historyRemoved && <p role="status" className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">Registo removido do histórico familiar.</p>}
    {params.error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{params.error === "invalid" ? "Verifique os dados seleccionados." : "Não foi possível guardar. Confirme as permissões e tente novamente."}</p>}



    <section className="space-y-4">
      <div><h2 className="text-lg font-semibold text-[#142b4a]">Agregados familiares</h2><p className="text-sm text-slate-500">Seleccione o responsável e consulte os integrantes associados através do cadastro de membros.</p></div>
      {error ? <p className="rounded-lg bg-amber-50 p-4 text-sm text-amber-900">Não foi possível carregar as famílias. Verifique a permissão members.read.</p> : familyRows.length === 0 ? <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">Ainda não existem famílias. Registe uma família acima ou associe uma no cadastro de membros.</div> :
      <div className="grid gap-4 lg:grid-cols-2">{familyRows.map(family => {
        const membersOfFamily = people.filter(member => member.family_id === family.id);
        const responsible = membersOfFamily.find(member => member.id === family.responsible_member_id);
        const children = membersOfFamily.filter(member => member.birth_date && new Date(member.birth_date + "T00:00:00").getTime() > Date.now() - 18 * 365.25 * 24 * 60 * 60 * 1000);
        return <article key={family.id} className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-start justify-between gap-3"><div><h3 className="text-lg font-semibold text-[#142b4a]">{family.family_name}</h3><p className="mt-1 text-xs font-semibold tracking-wide text-[#bd9148]">{family.family_code}</p><p className="mt-1 text-xs text-slate-500">{membersOfFamily.length} integrante(s) · {children.length} criança(s)/menor(es)</p></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs capitalize text-slate-700">{({pending:"Pendente",validation:"Em validação",active:"Activa",incomplete:"Incompleta",suspended:"Suspensa",archived:"Arquivada"} as Record<string,string>)[family.status] ?? family.status}</span></div>
          <div className="mt-4 rounded-lg bg-slate-50 p-3"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Responsável familiar</p><p className="mt-1 text-sm font-medium text-slate-800">{responsible?.full_name ?? "Ainda não definido"}</p>{family.phone && <p className="mt-1 text-xs text-slate-600">Telefone: {family.phone}</p>}{family.email && <p className="mt-1 text-xs text-slate-600">E-mail: {family.email}</p>}{family.address && <p className="mt-1 text-xs text-slate-600">Endereço: {family.address}</p>}{family.blessing_date && <p className="mt-1 text-xs text-slate-600">Data da bênção: {new Date(family.blessing_date + "T00:00:00").toLocaleDateString("pt-AO")}</p>}</div>
          <form action={setFamilyResponsible} className="mt-3 flex flex-col gap-2 sm:flex-row">
            <input type="hidden" name="family_id" value={family.id}/>
            <select name="responsible_member_id" required defaultValue={family.responsible_member_id ?? ""} className={input}>
              <option value="" disabled>Seleccione o responsável</option>
              {membersOfFamily.map(member => <option key={member.id} value={member.id}>{member.full_name}</option>)}
            </select>
            <button className="shrink-0 rounded-lg border border-blue-700 px-3 py-2 text-sm font-semibold text-blue-800 hover:bg-blue-50">Guardar</button>
          </form>
          <div className="mt-4 border-t border-slate-100 pt-3"><h4 className="text-sm font-semibold text-slate-700">Integrantes</h4>
            {membersOfFamily.length ? <ul className="mt-2 space-y-2">{membersOfFamily.map(member => <li key={member.id} className="flex items-center justify-between gap-3 text-sm"><span><Link href={"/admin/membros/" + member.id} className="font-medium text-blue-800 hover:underline">{member.full_name}</Link><span className="ml-2 text-xs text-slate-500">{member.category ?? "Sem categoria"}{member.birth_date ? " · " + new Date(member.birth_date + "T00:00:00").toLocaleDateString("pt-AO") : ""}</span></span><div className="flex items-center gap-2">{member.id === family.responsible_member_id && <span className="text-xs font-semibold text-emerald-700">Responsável</span>}<form action={removeMemberFromFamily} className="flex items-center gap-2"><input type="hidden" name="family_id" value={family.id}/><input type="hidden" name="member_id" value={member.id}/><label className="flex items-center gap-1 text-[11px] text-slate-500"><input type="checkbox" name="confirm_remove" required className="accent-red-600"/> Confirmar</label><button className="rounded-md border border-red-200 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50">Retirar</button></form></div></li>)}</ul> : <p className="mt-2 text-xs text-slate-500">Sem membros associados. Abra o cadastro de membros e utilize o nome exacto desta família.</p>}
          </div>
          <div className="mt-4 border-t border-slate-100 pt-3"><h4 className="text-sm font-semibold text-slate-700">Histórico familiar</h4>
            {historyRows.filter(record => record.family_id === family.id).length ? <ul className="mt-2 space-y-2">{historyRows.filter(record => record.family_id === family.id).map(record => <li key={record.id} className="flex items-start justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs"><span><strong>{record.title}</strong><span className="ml-2 text-slate-500">{new Date(record.event_date+"T00:00:00").toLocaleDateString("pt-AO")} · {({nascimento:"Nascimento",bencao:"Bênção",alteracao_familiar:"Alteração familiar",acompanhamento:"Acompanhamento",outro:"Outro"} as Record<string,string>)[record.record_type] ?? record.record_type}</span>{record.details && <span className="block mt-1 text-slate-600">{record.details}</span>}</span><form action={removeFamilyHistoryRecord}><input type="hidden" name="record_id" value={record.id}/><input type="hidden" name="family_id" value={family.id}/><button className="text-red-700 hover:underline">Retirar</button></form></li>)}</ul> : <p className="mt-2 text-xs text-slate-500">Sem acontecimentos registados.</p>}
            <form action={addFamilyHistoryRecord} className="mt-3 grid gap-2 sm:grid-cols-2"><input type="hidden" name="family_id" value={family.id}/><input name="title" required minLength={2} maxLength={160} placeholder="Título do acontecimento" className={input}/><select name="record_type" className={input} defaultValue="outro"><option value="nascimento">Nascimento</option><option value="bencao">Bênção</option><option value="alteracao_familiar">Alteração familiar</option><option value="acompanhamento">Acompanhamento</option><option value="outro">Outro</option></select><input name="event_date" type="date" required className={input}/><select name="related_member_id" defaultValue="" className={input}><option value="">Pessoa relacionada (opcional)</option>{membersOfFamily.map(member => <option key={member.id} value={member.id}>{member.full_name}</option>)}</select><textarea name="details" maxLength={3000} rows={2} placeholder="Detalhes (opcional)" className={input+" sm:col-span-2"}/><button className="rounded-lg bg-[#142b4a] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#1d3b61] sm:col-span-2">Adicionar ao histórico</button></form>
          </div>
          <div className="mt-4 border-t border-slate-100 pt-3"><h4 className="text-sm font-semibold text-slate-700">Relações familiares</h4>
            {relationshipRows.filter(relation => relation.family_id === family.id).map(relation => { const from = membersOfFamily.find(member => member.id === relation.member_id); const to = membersOfFamily.find(member => member.id === relation.related_member_id); const labels: Record<string,string> = {conjuge:"Cônjuge de",pai:"Pai de",mae:"Mãe de",filho:"Filho de",filha:"Filha de",tutor:"Tutor/encarregado de",irmao:"Irmão de",irma:"Irmã de",avo:"Avô/avó de",neto:"Neto/a de",outro:"Relacionado/a com"}; return <div key={relation.id} className="mt-2 flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs"><span><strong>{from?.full_name ?? "Membro"}</strong> — {labels[relation.relationship_type] ?? relation.relationship_type} — <strong>{to?.full_name ?? "Membro"}</strong>{relation.notes && <span className="block text-slate-500">{relation.notes}</span>}</span><form action={removeFamilyRelationship}><input type="hidden" name="relationship_id" value={relation.id}/><input type="hidden" name="family_id" value={family.id}/><button className="text-red-700 hover:underline">Retirar</button></form></div>; })}
            {membersOfFamily.length >= 2 && <form action={addFamilyRelationship} className="mt-3 grid gap-2 sm:grid-cols-2"><input type="hidden" name="family_id" value={family.id}/><select name="member_id" required defaultValue="" className={input}><option value="" disabled>Seleccione a pessoa</option>{membersOfFamily.map(member => <option key={member.id} value={member.id}>{member.full_name}</option>)}</select><select name="relationship_type" required defaultValue="conjuge" className={input}><option value="conjuge">Cônjuge de</option><option value="pai">Pai de</option><option value="mae">Mãe de</option><option value="filho">Filho de</option><option value="filha">Filha de</option><option value="tutor">Tutor/encarregado de</option><option value="irmao">Irmão de</option><option value="irma">Irmã de</option><option value="avo">Avô/avó de</option><option value="neto">Neto/a de</option><option value="outro">Outro</option></select><select name="related_member_id" required defaultValue="" className={input}><option value="" disabled>Relacionado com</option>{membersOfFamily.map(member => <option key={member.id} value={member.id}>{member.full_name}</option>)}</select><input name="notes" maxLength={300} placeholder="Observação (opcional)" className={input}/><button className="rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 sm:col-span-2">Adicionar relação</button></form>}</div>
          {children.length > 0 && <div className="mt-4 rounded-lg border border-amber-100 bg-amber-50 p-3"><p className="text-xs font-semibold text-amber-900">Menores a acompanhar</p><p className="mt-1 text-xs text-amber-800">{children.map(child => child.full_name).join(", ")}</p><p className="mt-1 text-[11px] text-amber-800">O responsável acima é o contacto familiar de referência; confirme o encarregado legal de cada menor.</p></div>}
        </article>;
      })}</div>}
    </section>
        <details className="rounded-xl border border-slate-200 bg-white p-5"><summary className="cursor-pointer list-none font-semibold text-blue-800">＋ Registar nova família</summary><section className="pt-4">
      <h2 className="font-semibold text-[#142b4a]">Registar nova família</h2>
      <p className="mt-1 text-xs text-slate-500">As famílias também são criadas automaticamente quando regista um membro com um novo nome de família.</p>
      <form action={createFamily} className="mt-4 flex flex-col gap-3 sm:flex-row">
        <input name="family_name" required minLength={2} maxLength={160} placeholder="Ex.: Família António Manuel" className={input}/>
        <button className={button}>Criar família</button>
      </form>
    </section></details>
  </main>;
}
