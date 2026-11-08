import { PublicSectionPage } from "@/components/public-section-page";
import { createClient } from "@/lib/supabase/server";

export const revalidate = 300;

export default async function NewsPage() {
  const supabase = await createClient();
  const { data } = supabase ? await supabase.from("public_content_items")
    .select("id,title,summary,body,category,content_type,published_at")
    .eq("content_type", "noticia").eq("status", "Publicado").eq("is_public", true)
    .order("published_at", {ascending:false}).limit(30) : {data:[]};
  const { data: notices } = supabase ? await supabase.from("public_content_items")
    .select("id,title,summary,body,category,content_type,published_at")
    .eq("content_type", "comunicado").eq("status", "Publicado").eq("is_public", true)
    .order("published_at", {ascending:false}).limit(30) : {data:[]};
  const items = [...(data ?? []), ...(notices ?? [])]
    .sort((a,b)=>new Date(b.published_at ?? 0).getTime()-new Date(a.published_at ?? 0).getTime())
    .map(item=>({title:item.title,description:[item.category,item.published_at ? new Date(item.published_at).toLocaleDateString("pt-AO",{timeZone:"Africa/Luanda"}) : null,item.summary,item.body].filter(Boolean).join(" · ")}));
  return <PublicSectionPage eyebrow="Actualidade" title="Notícias e comunicados" introduction="Notícias e comunicados institucionais autorizados para divulgação pública pela FFPMU ANGOLA." items={items.length ? items : [
    {title:"Ainda não há publicações",description:"As notícias e os comunicados aparecerão aqui depois de serem criados e publicados pela equipa administrativa."}
  ]}/>;
}
