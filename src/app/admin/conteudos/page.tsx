import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createPublicContent, deletePublicContent, updatePublicContentStatus } from "./actions";

const field = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800";
const button = "rounded-lg bg-[#142b4a] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#203e64]";

export default async function PublicContentAdmin({ searchParams }: { searchParams: Promise<{created?:string;updated?:string;deleted?:string;error?:string}> }) {
  const params = await searchParams;
  const supabase = await createClient();
  if (!supabase) redirect("/login?setup=required");
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("church_id,is_active").eq("id", user.id).maybeSingle();
  if (!profile?.is_active || !profile.church_id) redirect("/login");
  const { data: items, error } = await supabase.from("public_content_items")
    .select("id,title,content_type,summary,status,is_public,published_at,created_at,external_url")
    .eq("church_id", profile.church_id).order("created_at", {ascending:false}).limit(200);
  return <div className="mx-auto max-w-6xl space-y-6">
    <header><p className="text-sm font-medium text-amber-700">Portal institucional</p><h1 className="mt-1 text-3xl font-semibold text-[#142b4a]">Conteúdos e publicações</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Crie notícias, comunicados e recursos da biblioteca. Só conteúdos publicados e explicitamente marcados como públicos aparecem no portal.</p></header>
    {params.created && <p role="status" className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">Conteúdo criado com sucesso.</p>}
    {params.updated && <p role="status" className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">Publicação actualizada.</p>}
    {params.deleted && <p role="status" className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">Conteúdo eliminado.</p>}
    {params.error && <p role="alert" className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">{params.error === "invalid" ? "Verifique os campos. O link externo deve começar por https://." : params.error === "visibility" ? "Para publicar, marque também a opção de visibilidade pública." : "Não foi possível concluir a operação. Verifique as permissões e tente novamente."}</p>}
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <h2 className="text-lg font-semibold text-[#142b4a]">Novo conteúdo</h2>
      <form action={createPublicContent} className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium text-slate-700 sm:col-span-2">Título<input name="title" required minLength={3} maxLength={180} className={field+" mt-1"} placeholder="Título da publicação"/></label>
        <label className="text-sm font-medium text-slate-700">Tipo<select name="content_type" className={field+" mt-1"}><option value="noticia">Notícia</option><option value="comunicado">Comunicado</option><option value="biblioteca">Biblioteca / recurso</option></select></label>
        <label className="text-sm font-medium text-slate-700">Categoria<input name="category" maxLength={80} className={field+" mt-1"} placeholder="Ex.: Formação, actividade"/></label>
        <label className="text-sm font-medium text-slate-700 sm:col-span-2">Resumo<textarea name="summary" maxLength={500} rows={2} className={field+" mt-1"}/></label>
        <label className="text-sm font-medium text-slate-700 sm:col-span-2">Texto / descrição<textarea name="body" maxLength={20000} rows={5} className={field+" mt-1"}/></label>
        <label className="text-sm font-medium text-slate-700 sm:col-span-2">Link externo seguro (opcional)<input name="external_url" type="url" maxLength={1000} placeholder="https://..." className={field+" mt-1"}/></label>
        <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" name="is_public" className="size-4"/> Autorizar divulgação pública</label>
        <label className="text-sm font-medium text-slate-700">Estado inicial<select name="status" className={field+" mt-1"}><option value="Rascunho">Guardar como rascunho</option><option value="Publicado">Publicar (exige visibilidade pública)</option></select></label>
        <div className="sm:col-span-2"><button className={button}>Guardar conteúdo</button></div>
      </form>
    </section>
    <section className="space-y-3"><div className="flex items-end justify-between"><div><h2 className="text-xl font-semibold text-[#142b4a]">Conteúdos registados</h2><p className="text-sm text-slate-500">Rascunhos e publicações dentro do seu âmbito de acesso.</p></div><span className="text-sm text-slate-500">{items?.length ?? 0} item(ns)</span></div>
      {error ? <p className="rounded-xl bg-amber-50 p-5 text-sm text-amber-900">Não foi possível consultar conteúdos. Verifique as permissões.</p> : items?.length ? <div className="space-y-3">{items.map(item=><article key={item.id} className="rounded-xl border border-slate-200 bg-white p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold text-[#142b4a]">{item.title}</h3><span className="rounded-full bg-slate-100 px-2 py-1 text-xs">{item.content_type}</span><span className={"rounded-full px-2 py-1 text-xs "+(item.status==="Publicado"?"bg-emerald-50 text-emerald-800":"bg-amber-50 text-amber-800")}>{item.status}</span>{item.is_public && <span className="text-xs text-emerald-700">Visível ao público</span>}</div>{item.summary && <p className="mt-2 text-sm text-slate-600">{item.summary}</p>}<p className="mt-2 text-xs text-slate-500">Criado em {new Date(item.created_at).toLocaleDateString("pt-AO",{timeZone:"Africa/Luanda"})}{item.published_at ? " · Publicado em "+new Date(item.published_at).toLocaleDateString("pt-AO",{timeZone:"Africa/Luanda"}):""}</p>{item.external_url && <a href={item.external_url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs text-blue-700 underline">Abrir link externo</a>}</div></div><div className="mt-4 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-3"><form action={updatePublicContentStatus} className="flex flex-wrap items-center gap-2"><input type="hidden" name="id" value={item.id}/><select name="status" defaultValue={item.status} className="rounded-lg border border-slate-300 px-3 py-2 text-xs"><option>Rascunho</option><option>Publicado</option><option>Arquivado</option></select><label className="flex items-center gap-1 text-xs text-slate-600"><input type="checkbox" name="is_public" defaultChecked={item.is_public}/> Público</label><button className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold">Actualizar</button></form><form action={deletePublicContent}><input type="hidden" name="id" value={item.id}/><button className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700">Eliminar</button></form></div></article>)}</div> : <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">Ainda não existem conteúdos. Crie a primeira publicação acima.</div>}
    </section>
  </div>;
}
