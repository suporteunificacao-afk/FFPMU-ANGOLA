import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createRegion, createCommunity, setRegionActive, setCommunityActive, createLocalUnit, attachLocalUnit } from "./actions";

const field = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800";
const button = "rounded-lg bg-[#142b4a] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#203d63]";

export default async function OrganizationPage({ searchParams }: {
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

  const [{ data: regions, error: regionError }, { data: communities, error: communityError }, { data: branches, error: branchError }] = await Promise.all([
    supabase.from("regions").select("id,name,code,is_active,created_at").eq("church_id", profile.church_id).order("name"),
    supabase.from("communities").select("id,region_id,name,code,address,is_active,created_at").eq("church_id", profile.church_id).order("name"),
    supabase.from("branches").select("id,name,address,community_id,region_id,is_active").eq("church_id", profile.church_id).order("name"),
  ]);
  const regionRows = regions ?? [];
  const communityRows = communities ?? [];
  const branchRows = branches ?? [];

  return <main className="mx-auto max-w-6xl space-y-6">
    <header>
      <Link href="/admin" className="text-sm text-blue-700 hover:underline">← Painel</Link>
      <h1 className="mt-2 text-3xl font-semibold text-[#142b4a]">Organização territorial</h1>
      <p className="mt-1 text-sm text-slate-600">Estruture a FFPMU Angola por regiões e comunidades. Os nomes são definidos pela própria instituição.</p>
    </header>

    {params.created && <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{params.created === "region" ? "Região registada com sucesso." : params.created === "community" ? "Comunidade registada com sucesso." : "Unidade local registada com sucesso."}</p>}
    {params.updated && <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">Estado actualizado.</p>}
    {(params.error || regionError || communityError || branchError) && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">Não foi possível concluir a operação. Verifique a permissão organization.manage e os dados informados.</p>}

    <div className="grid gap-5 lg:grid-cols-2">
      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-[#142b4a]">Registar região</h2>
        <form action={createRegion} className="mt-4 space-y-3">
          <label className="block text-sm font-medium text-slate-700">Nome da região<input name="name" required minLength={2} maxLength={120} placeholder="Nome oficial da região" className={field + " mt-1"}/></label>
          <label className="block text-sm font-medium text-slate-700">Código (opcional)<input name="code" maxLength={24} placeholder="Ex.: REG-01" className={field + " mt-1"}/></label>
          <button className={button}>Guardar região</button>
        </form>
      </section>
      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-[#142b4a]">Registar comunidade</h2>
        <form action={createCommunity} className="mt-4 space-y-3">
          <label className="block text-sm font-medium text-slate-700">Região<select name="region_id" required className={field + " mt-1"} defaultValue=""><option value="" disabled>Seleccione a região</option>{regionRows.filter(region => region.is_active).map(region => <option key={region.id} value={region.id}>{region.name}</option>)}</select></label>
          <label className="block text-sm font-medium text-slate-700">Nome da comunidade<input name="name" required minLength={2} maxLength={120} placeholder="Nome oficial da comunidade" className={field + " mt-1"}/></label>
          <label className="block text-sm font-medium text-slate-700">Código (opcional)<input name="code" maxLength={24} placeholder="Ex.: COM-01" className={field + " mt-1"}/></label>
          <label className="block text-sm font-medium text-slate-700">Localização/endereço (opcional)<input name="address" maxLength={240} className={field + " mt-1"}/></label>
          <button disabled={regionRows.filter(region => region.is_active).length === 0} className={button}>Guardar comunidade</button>
        </form>
      </section>
    </div>

    <section className="space-y-3">
      <div className="flex items-end justify-between"><div><h2 className="text-lg font-semibold text-[#142b4a]">Estrutura registada</h2><p className="text-sm text-slate-500">{regionRows.length} região(ões) · {communityRows.length} comunidade(s)</p></div></div>
      {regionRows.length === 0 ? <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">Ainda não existem regiões. Registe primeiro as regiões oficiais da instituição.</div> : <div className="space-y-3">
        {regionRows.map(region => {
          const children = communityRows.filter(community => community.region_id === region.id);
          return <article key={region.id} className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div><h3 className="font-semibold text-[#142b4a]">{region.name}</h3><p className="text-xs text-slate-500">{region.code || "Sem código"} · {children.length} comunidade(s)</p></div>
              <form action={setRegionActive}><input type="hidden" name="id" value={region.id}/><input type="hidden" name="is_active" value={String(!region.is_active)}/><button className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700">{region.is_active ? "Desactivar" : "Activar"}</button></form>
            </div>
            {children.length > 0 && <ul className="mt-4 divide-y divide-slate-100 border-t border-slate-100">{children.map(community => <li key={community.id} className="flex flex-wrap items-center justify-between gap-3 py-3"><div><p className="text-sm font-medium text-slate-800">{community.name}</p><p className="text-xs text-slate-500">{community.code || "Sem código"}{community.address ? " · " + community.address : ""}</p></div><form action={setCommunityActive}><input type="hidden" name="id" value={community.id}/><input type="hidden" name="is_active" value={String(!community.is_active)}/><button className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700">{community.is_active ? "Desactivar" : "Activar"}</button></form></li>)}</ul>}
          </article>;
        })}
      </div>}
    </section>
  </main>;
}
