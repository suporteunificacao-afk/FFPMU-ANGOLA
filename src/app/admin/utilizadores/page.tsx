import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { assignRole } from "./actions";

const field = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800";
const button = "rounded-lg bg-[#142b4a] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#203d63]";

export default async function UsersPage({ searchParams }: { searchParams: Promise<{ assigned?: string; error?: string }> }) {
  const params = await searchParams;
  const supabase = await createClient();
  if (!supabase) redirect("/login?setup=required");
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("church_id,is_active").eq("id", user.id).maybeSingle();
  if (!profile?.is_active) redirect("/login");
  if (!profile.church_id) redirect("/setup");

  const [{ data: profiles }, { data: roles }, { data: regions }, { data: communities }, { data: branches }, { data: assignments, error }] = await Promise.all([
    supabase.from("profiles").select("id,full_name,phone,is_active").eq("church_id", profile.church_id).eq("is_active", true).order("full_name"),
    supabase.from("roles").select("id,name,description,is_system").eq("church_id", profile.church_id).order("name"),
    supabase.from("regions").select("id,name").eq("church_id", profile.church_id).eq("is_active", true).order("name"),
    supabase.from("communities").select("id,name,region_id").eq("church_id", profile.church_id).eq("is_active", true).order("name"),
    supabase.from("branches").select("id,name,community_id").eq("church_id", profile.church_id).eq("is_active", true).order("name"),
    supabase.from("role_assignments").select("id,user_id,role_id,region_id,community_id,branch_id,profiles:profiles!role_assignments_user_id_fkey(full_name),roles(name)").eq("church_id", profile.church_id).order("created_at", { ascending: false }),
  ]);
  const people = profiles ?? [];
  const roleRows = roles ?? [];
  const regionRows = regions ?? [];
  const communityRows = communities ?? [];
  const branchRows = branches ?? [];
  const assignmentRows = assignments ?? [];

  return <main className="mx-auto max-w-6xl space-y-6">
    <header><Link href="/admin" className="text-sm text-blue-700 hover:underline">← Painel</Link><h1 className="mt-2 text-3xl font-semibold text-[#142b4a]">Utilizadores e permissões</h1><p className="mt-1 text-sm text-slate-600">Atribua funções a contas existentes e limite o acesso por região, comunidade ou congregação.</p></header>
    {params.assigned && <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">Função atribuída com sucesso.</p>}
    {params.error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{params.error === "duplicate" ? "Esta função já está atribuída ao utilizador nesta área." : params.error === "invalid" ? "Verifique o utilizador, a função e a área seleccionada." : "Não foi possível atribuir a função. Confirme se tem permissão para gerir utilizadores."}</p>}
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <h2 className="text-lg font-semibold text-[#142b4a]">Atribuir função</h2>
      <p className="mt-1 text-xs text-slate-500">Esta operação não cria contas nem envia convites; atribui uma função a um utilizador que já tenha concluído o registo.</p>
      {people.length === 0 || roleRows.length === 0 ? <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">É necessário existir pelo menos um utilizador activo e uma função configurada.</p> : <form action={assignRole} className="mt-4 grid gap-3 md:grid-cols-2">
        <label className="text-sm font-medium text-slate-700">Utilizador<select name="user_id" required defaultValue="" className={field + " mt-1"}><option value="" disabled>Seleccione o utilizador</option>{people.map(person => <option key={person.id} value={person.id}>{person.full_name}{person.phone ? " · " + person.phone : ""}</option>)}</select></label>
        <label className="text-sm font-medium text-slate-700">Função<select name="role_id" required defaultValue="" className={field + " mt-1"}><option value="" disabled>Seleccione a função</option>{roleRows.map(role => <option key={role.id} value={role.id}>{role.name}</option>)}</select></label>
        <label className="text-sm font-medium text-slate-700">Nível de acesso<select name="scope_type" className={field + " mt-1"} defaultValue="national"><option value="national">Nacional (toda a instituição)</option><option value="region">Uma região</option><option value="community">Uma comunidade</option><option value="branch">Uma congregação/unidade local</option></select></label>
        <label className="text-sm font-medium text-slate-700">Área<select name="scope_id" className={field + " mt-1"} defaultValue=""><option value="">Não se aplica ao nível nacional</option><optgroup label="Regiões">{regionRows.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</optgroup><optgroup label="Comunidades">{communityRows.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</optgroup><optgroup label="Congregações">{branchRows.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</optgroup></select></label>
        <div className="md:col-span-2"><button className={button}>Atribuir função</button></div>
      </form>}
    </section>
    <section className="space-y-3">
      <div><h2 className="text-lg font-semibold text-[#142b4a]">Atribuições existentes</h2><p className="text-sm text-slate-500">{assignmentRows.length} atribuição(ões) encontradas</p></div>
      {error ? <p className="rounded-lg bg-amber-50 p-4 text-sm text-amber-900">Não foi possível consultar as atribuições. Verifique roles.read.</p> : assignmentRows.length === 0 ? <p className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">Ainda não existem atribuições para apresentar.</p> : <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">Utilizador</th><th className="px-4 py-3">Função</th><th className="px-4 py-3">Âmbito</th></tr></thead><tbody className="divide-y divide-slate-100">{assignmentRows.map((item) => {
        const person = people.find(p => p.id === item.user_id);
        const role = roleRows.find(r => r.id === item.role_id);
        const scope = item.region_id ? "Região: " + (regionRows.find(r => r.id === item.region_id)?.name ?? "—") : item.community_id ? "Comunidade: " + (communityRows.find(r => r.id === item.community_id)?.name ?? "—") : item.branch_id ? "Congregação: " + (branchRows.find(b => b.id === item.branch_id)?.name ?? "—") : "Nacional";
        return <tr key={item.id}><td className="px-4 py-3 font-medium text-slate-800">{person?.full_name ?? "Utilizador"}</td><td className="px-4 py-3">{role?.name ?? "Função"}</td><td className="px-4 py-3 text-slate-600">{scope}</td></tr>;
      })}</tbody></table></div>}
    </section>
  </main>;
}
