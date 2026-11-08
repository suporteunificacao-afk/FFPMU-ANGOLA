import { PublicSectionPage } from "@/components/public-section-page";

export default function NewsPage() {
  return <PublicSectionPage eyebrow="Actualidade" title="Notícias e comunicados" introduction="Canal institucional para comunicados, notícias e anúncios oficiais da FFPMU Angola." items={[
    { title: "Comunicados oficiais", description: "Publicações institucionais validadas pelos responsáveis autorizados." },
    { title: "Notícias", description: "Actualizações e notícias da organização, a publicar após confirmação dos conteúdos." },
  ]} />;
}
