import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createDepartment } from "./actions";

const field = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800";
const button = "rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800";

export default async function DepartmentsPage({ searchParams }: {
  searchParams: Promise<{ created?: string; error?: string; q?: string }>;
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

  let departmentsQuery = supabase.from("departments").select("id,name,description,is_active,created_at")
    .eq("church_id", profile.church_id).eq("branch_id", profile.branch_id).order("name", { ascending: true });
  if (query) departmentsQuery = departmentsQuery.ilike("name", "%" + query.replace(/[,%()]/g, " ") + "%");
  const { data: departments, error } = await departmentsQuery;
  const ids = (departments ?? []).map(item => item.id);
  const { data: teamRows } = ids.length ? await supabase.from("department_members").select("department_id")
    .eq("church_id", profile.church_id).in("department_id", ids) : { data: [] as { department_id: string }[] };
  const counts = new Map<string, number>();
  (teamRows ?? []).forEach(row => counts.set(row.department_id, (counts.get(row.department_id) ?? 0) + 1));

  return <main className="mx-auto max-w-6xl space-y-6">
    <header className="flex flex-wrap items-end justify-between gap-3">
      <div><Link href="/admin" className="text-sm text-blue-700 hover:underline">← Painel</Link><h1 className="mt-2 text-3xl font-semibold text-[#142b4a]">Departamentos</h1><p className="mt-1 text-sm text-slate-600">Organize as áreas da igreja e os membros que servem em cada uma.</p></div>
      <div className="rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-900"><strong>{departments?.length ?? 0}</strong> departamento(s)</div>
    </header>
    {params.created && <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">Departamento criado com sucesso.</p>}
    {params.error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{params.error === "invalid" ? "Introduza um nome com pelo menos 2 caracteres." : "Não foi possível guardar. Verifique se já existe um departamento com esse nome e tente novamente."}</p>}
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-lg font-semibold text-[#142b4a]">Lista de departamentos</h2><p className="text-sm text-slate-500">Abra um departamento para gerir a sua equipa e as posições.</p></div>
        <form className="flex gap-2"><input name="q" defaultValue={query} placeholder="Pesquisar departamento" className={field + " w-56"}/><button className="rounded-lg border border-slate-300 px-3 py-2 text-sm">Pesquisar</button></form>
      </div>
      {error ? <p className="rounded-lg bg-amber-50 p-4 text-sm text-amber-900">Não foi possível carregar os departamentos. Verifique a permissão de leitura.</p> : departments?.length ? <div className="grid gap-3 md:grid-cols-2">{departments.map(department => <Link key={department.id} href={"/admin/departamentos/" + department.id} className="rounded-xl border border-slate-200 bg-white p-5 transition hover:border-blue-300 hover:shadow-sm">
        <div className="flex items-start justify-between gap-3"><h3 className="text-lg font-semibold text-[#142b4a]">{department.name}</h3><span className={"rounded-full px-3 py-1 text-xs font-semibold " + (department.is_active ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-slate-600")}>{department.is_active ? "Activo" : "Inactivo"}</span></div>
        <p className="mt-2 line-clamp-2 min-h-10 text-sm text-slate-600">{department.description || "Sem descrição."}</p><p className="mt-4 text-xs font-medium text-blue-800">{counts.get(department.id) ?? 0} integrante(s) · Gerir departamento →</p>
      </Link>)}</div> : <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">Ainda não existem departamentos. Crie o primeiro abaixo.</div>}
    </section>
    <details className="rounded-xl border border-slate-200 bg-white p-5"><summary className="cursor-pointer list-none font-semibold text-blue-800">＋ Criar departamento</summary>
      <form action={createDepartment} className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="text-xs font-medium text-slate-700">Nome do departamento *<input name="name" required minLength={2} maxLength={120} placeholder="Ex.: Departamento de Jovens" className={field + " mt-1"}/></label>
        <label className="text-xs font-medium text-slate-700 sm:col-span-2">Descrição (opcional)<textarea name="description" rows={3} maxLength={2000} placeholder="Descreva a missão ou responsabilidade deste departamento" className={field + " mt-1"}/></label>
        <div className="sm:col-span-2"><button className={button}>Guardar departamento</button></div>
      </form>
    </details>
  </main>;
}
