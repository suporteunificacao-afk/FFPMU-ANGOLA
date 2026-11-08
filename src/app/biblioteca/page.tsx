import { PublicSectionPage } from "@/components/public-section-page";
import { createClient } from "@/lib/supabase/server";

export const revalidate = 300;

export default async function LibraryPage() {
  const supabase = await createClient();
  const { data } = supabase ? await supabase.from("public_content_items")
    .select("id,title,summary,body,category,external_url,published_at")
    .eq("content_type", "biblioteca").eq("status", "Publicado").eq("is_public", true)
    .order("published_at", {ascending:false}).limit(50) : {data:[]};
  const items = (data ?? []).map(item=>({
    title:item.title,
    description:[item.category,item.published_at ? new Date(item.published_at).toLocaleDateString("pt-AO",{timeZone:"Africa/Luanda"}) : null,item.summary,item.body].filter(Boolean).join(" · "),
    href:item.external_url,
  }));
  return <PublicSectionPage eyebrow="Recursos" title="Biblioteca e materiais" introduction="Documentos e materiais institucionais aprovados para consulta pública." items={items.length ? items : [
    {title:"Biblioteca em preparação",description:"Os recursos serão apresentados aqui quando a equipa administrativa os publicar."}
  ]}/>;
}
