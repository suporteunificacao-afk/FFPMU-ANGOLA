import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { addDepartmentMember, moveDepartmentPosition, removeDepartmentMember, updateDepartment, updateDepartmentPosition } from "../actions";

const field = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800";
const button = "rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800";

export default async function DepartmentDetailPage({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ updated?: string; memberAdded?: string; removed?: string; ordered?: string; error?: string }>;
}) {
  const { id } = await params;
  const notices = await searchParams;
  const supabase = await createClient();
  if (!supabase) redirect("/login?setup=required");
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("church_id,branch_id,is_active").eq("id", user.id).maybeSingle();
  if (!profile?.is_active) redirect("/login");
  if (!profile.church_id) redirect("/setup");

  const [{ data: department }, { data: positions }, { data: members }] = await Promise.all([
    supabase.from("departments").select("id,name,description,is_active").eq("id", id).eq("church_id", profile.church_id).eq("branch_id", profile.branch_id).maybeSingle(),
    supabase.from("department_members").select("id,member_id,position_title,display_order").eq("department_id", id).eq("church_id", profile.church_id).order("display_order", { ascending: true }),
    supabase.from("members").select("id,full_name,member_code,phone").eq("church_id", profile.church_id).eq("branch_id", profile.branch_id).order("full_name", { ascending: true }).limit(1000),
  ]);
  if (!department) notFound();
  const memberById = new Map((members ?? []).map(member => [member.id, member]));
  const assigned = new Set((positions ?? []).map(position => position.member_id));
  const available = (members ?? []).filter(member => !assigned.has(member.id));

  return <main className="mx-auto max-w-5xl space-y-6">
    <header><Link href="/admin/departamentos" className="text-sm text-blue-700 hover:underline">← Departamentos</Link><div className="mt-2 flex flex-wrap items-center gap-3"><h1 className="text-3xl font-semibold text-[#142b4a]">{department.name}</h1><span className={"rounded-full px-3 py-1 text-xs font-semibold " + (department.is_active ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-slate-600")}>{department.is_active ? "Activo" : "Inactivo"}</span></div><p className="mt-1 text-sm text-slate-600">Edite os dados do departamento e organize os seus integrantes.</p></header>
    {notices.updated && <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">Departamento actualizado.</p>}
    {notices.memberAdded && <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">Integrante adicionado à equipa.</p>}
    {notices.removed && <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">Integrante removido deste departamento. O cadastro do membro foi preservado.</p>}
    {notices.ordered && <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">Ordem das posições actualizada.</p>}
    {notices.error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{notices.error === "member" ? "Não foi possível adicionar. O membro pode já estar neste departamento." : notices.error === "invalid" ? "Verifique os campos seleccionados." : "Não foi possível guardar a alteração. Tente novamente."}</p>}

    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <h2 className="text-lg font-semibold text-[#142b4a]">Dados do departamento</h2>
      <form action={updateDepartment} className="mt-4 grid gap-3 sm:grid-cols-2">
        <input type="hidden" name="department_id" value={department.id}/>
        <label className="text-xs font-medium text-slate-700">Nome<input name="name" required minLength={2} maxLength={120} defaultValue={department.name} className={field + " mt-1"}/></label>
        <label className="flex items-center gap-2 self-end pb-3 text-sm text-slate-700"><input type="checkbox" name="is_active" defaultChecked={department.is_active} className="h-4 w-4"/> Departamento activo</label>
        <label className="text-xs font-medium text-slate-700 sm:col-span-2">Descrição<textarea name="description" rows={3} maxLength={2000} defaultValue={department.description ?? ""} className={field + " mt-1"}/></label>
        <div className="sm:col-span-2"><button className={button}>Guardar alterações</button></div>
      </form>
    </section>

    <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
      <div><h2 className="text-lg font-semibold text-[#142b4a]">Equipa do departamento</h2><p className="text-sm text-slate-500">{positions?.length ?? 0} integrante(s). Pode adicionar quantos forem necessários.</p></div>
      {positions?.length ? <ol className="space-y-3">{positions.map((position, index) => {
        const member = memberById.get(position.member_id);
        return <li key={position.id} className="rounded-lg border border-slate-200 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2"><div><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Posição {index + 1}</p><p className="mt-1 font-semibold text-[#142b4a]">{member?.full_name ?? "Membro não encontrado"}</p><p className="text-xs text-slate-500">{member?.member_code ?? ""}{member?.phone ? " · " + member.phone : ""}</p></div>
            <div className="flex gap-1"><form action={moveDepartmentPosition}><input type="hidden" name="department_id" value={id}/><input type="hidden" name="position_id" value={position.id}/><input type="hidden" name="direction" value="up"/><button disabled={index === 0} aria-label="Mover para cima" className="rounded-md border border-slate-300 px-3 py-2 text-sm disabled:opacity-30">↑</button></form><form action={moveDepartmentPosition}><input type="hidden" name="department_id" value={id}/><input type="hidden" name="position_id" value={position.id}/><input type="hidden" name="direction" value="down"/><button disabled={index === positions.length - 1} aria-label="Mover para baixo" className="rounded-md border border-slate-300 px-3 py-2 text-sm disabled:opacity-30">↓</button></form></div>
          </div>
          <div className="mt-3 flex flex-wrap items-end gap-2"><form action={updateDepartmentPosition} className="flex min-w-0 flex-1 flex-wrap items-end gap-2"><input type="hidden" name="department_id" value={id}/><input type="hidden" name="position_id" value={position.id}/><label className="min-w-[220px] flex-1 text-xs font-medium text-slate-700">Cargo / função (texto livre)<input name="position_title" required maxLength={120} defaultValue={position.position_title} className={field + " mt-1"}/></label><button className="rounded-lg border border-blue-700 px-4 py-2.5 text-sm font-semibold text-blue-800 hover:bg-blue-50">Actualizar cargo</button></form>
            <form action={removeDepartmentMember}><input type="hidden" name="department_id" value={id}/><input type="hidden" name="position_id" value={position.id}/><button className="rounded-lg border border-red-200 px-3 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50">Remover</button></form>
          </div>
        </li>;
      })}</ol> : <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">Ainda não há integrantes neste departamento. Adicione o primeiro abaixo.</div>}
      <div className="border-t border-slate-100 pt-4"><h3 className="font-semibold text-[#142b4a]">＋ Adicionar integrante</h3><p className="mt-1 text-xs text-slate-500">Seleccione um membro já registado e indique a sua função neste departamento.</p>
        {available.length ? <form action={addDepartmentMember} className="mt-3 grid gap-3 sm:grid-cols-2"><input type="hidden" name="department_id" value={id}/><label className="text-xs font-medium text-slate-700">Membro *<select name="member_id" required defaultValue="" className={field + " mt-1"}><option value="" disabled>Seleccione um membro</option>{available.map(member=><option key={member.id} value={member.id}>{member.full_name}{member.member_code ? " · " + member.member_code : ""}</option>)}</select></label><label className="text-xs font-medium text-slate-700">Cargo / função *<input name="position_title" required maxLength={120} placeholder="Ex.: Coordenador, Secretário, Integrante..." className={field + " mt-1"}/></label><div className="sm:col-span-2"><button className={button}>Adicionar à equipa</button></div></form> : <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-500">Todos os membros disponíveis desta filial já estão associados, ou ainda não existem membros registados.</p>}
      </div>
    </section>
  </main>;
}
