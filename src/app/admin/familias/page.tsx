import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createFamily, setFamilyResponsible } from "./actions";

const input = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800";
const button = "rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800";

export default async function FamiliesPage({ searchParams }: {
  searchParams: Promise<{ created?: string; updated?: string; error?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  if (!supabase) redirect("/login?setup=required");
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("church_id,is_active").eq("id", user.id).maybeSingle();
  if (!profile?.is_active) redirect("/login");
  if (!profile.church_id) redirect("/setup");

  const [{ data: families, error }, { data: members }] = await Promise.all([
    supabase.from("families").select("id,family_name,responsible_member_id,created_at").eq("church_id", profile.church_id).order("family_name"),
    supabase.from("members").select("id,full_name,birth_date,phone,family_id,category").eq("church_id", profile.church_id).order("full_name").limit(500),
  ]);
  const people = members ?? [];
  const familyRows = families ?? [];

  return <main className="mx-auto max-w-6xl space-y-6">
    <header className="flex flex-wrap items-end justify-between gap-3">
      <div><Link href="/admin" className="text-sm text-blue-700 hover:underline">← Painel</Link><h1 className="mt-2 text-3xl font-semibold text-[#142b4a]">Famílias</h1><p className="mt-1 text-sm text-slate-600">Organize os agregados familiares, identifique responsáveis e acompanhe as crianças.</p></div>
      <div className="rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-900"><strong>{familyRows.length}</strong> famílias · <strong>{people.length}</strong> membros</div>
    </header>

    {params.created && <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">Família criada com sucesso.</p>}
    {params.updated && <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">Responsável familiar actualizado.</p>}
    {params.error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{params.error === "invalid" ? "Verifique os dados seleccionados." : "Não foi possível guardar. Confirme as permissões e tente novamente."}</p>}

    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <h2 className="font-semibold text-[#142b4a]">Registar nova família</h2>
      <p className="mt-1 text-xs text-slate-500">As famílias também são criadas automaticamente quando regista um membro com um novo nome de família.</p>
      <form action={createFamily} className="mt-4 flex flex-col gap-3 sm:flex-row">
        <input name="family_name" required minLength={2} maxLength={160} placeholder="Ex.: Família António Manuel" className={input}/>
        <button className={button}>Criar família</button>
      </form>
    </section>

    <section className="space-y-4">
      <div><h2 className="text-lg font-semibold text-[#142b4a]">Agregados familiares</h2><p className="text-sm text-slate-500">Seleccione o responsável e consulte os integrantes associados através do cadastro de membros.</p></div>
      {error ? <p className="rounded-lg bg-amber-50 p-4 text-sm text-amber-900">Não foi possível carregar as famílias. Verifique a permissão members.read.</p> : familyRows.length === 0 ? <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">Ainda não existem famílias. Registe uma família acima ou associe uma no cadastro de membros.</div> :
      <div className="grid gap-4 lg:grid-cols-2">{familyRows.map(family => {
        const membersOfFamily = people.filter(member => member.family_id === family.id);
        const responsible = membersOfFamily.find(member => member.id === family.responsible_member_id);
        const children = membersOfFamily.filter(member => member.birth_date && new Date(member.birth_date + "T00:00:00").getTime() > Date.now() - 18 * 365.25 * 24 * 60 * 60 * 1000);
        return <article key={family.id} className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-start justify-between gap-3"><div><h3 className="text-lg font-semibold text-[#142b4a]">{family.family_name}</h3><p className="mt-1 text-xs text-slate-500">{membersOfFamily.length} integrante(s) · {children.length} criança(s)/menor(es)</p></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">Família</span></div>
          <div className="mt-4 rounded-lg bg-slate-50 p-3"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Responsável familiar</p><p className="mt-1 text-sm font-medium text-slate-800">{responsible?.full_name ?? "Ainda não definido"}</p></div>
          <form action={setFamilyResponsible} className="mt-3 flex flex-col gap-2 sm:flex-row">
            <input type="hidden" name="family_id" value={family.id}/>
            <select name="responsible_member_id" required defaultValue={family.responsible_member_id ?? ""} className={input}>
              <option value="" disabled>Seleccione o responsável</option>
              {membersOfFamily.map(member => <option key={member.id} value={member.id}>{member.full_name}</option>)}
            </select>
            <button className="shrink-0 rounded-lg border border-blue-700 px-3 py-2 text-sm font-semibold text-blue-800 hover:bg-blue-50">Guardar</button>
          </form>
          <div className="mt-4 border-t border-slate-100 pt-3"><h4 className="text-sm font-semibold text-slate-700">Integrantes</h4>
            {membersOfFamily.length ? <ul className="mt-2 space-y-2">{membersOfFamily.map(member => <li key={member.id} className="flex items-center justify-between gap-3 text-sm"><span><Link href={"/admin/membros/" + member.id} className="font-medium text-blue-800 hover:underline">{member.full_name}</Link><span className="ml-2 text-xs text-slate-500">{member.category ?? "Sem categoria"}{member.birth_date ? " · " + new Date(member.birth_date + "T00:00:00").toLocaleDateString("pt-AO") : ""}</span></span>{member.id === family.responsible_member_id && <span className="text-xs font-semibold text-emerald-700">Responsável</span>}</li>)}</ul> : <p className="mt-2 text-xs text-slate-500">Sem membros associados. Abra o cadastro de membros e utilize o nome exacto desta família.</p>}
          </div>
          {children.length > 0 && <div className="mt-4 rounded-lg border border-amber-100 bg-amber-50 p-3"><p className="text-xs font-semibold text-amber-900">Menores a acompanhar</p><p className="mt-1 text-xs text-amber-800">{children.map(child => child.full_name).join(", ")}</p><p className="mt-1 text-[11px] text-amber-800">O responsável acima é o contacto familiar de referência; confirme o encarregado legal de cada menor.</p></div>}
        </article>;
      })}</div>}
    </section>
  </main>;
}
