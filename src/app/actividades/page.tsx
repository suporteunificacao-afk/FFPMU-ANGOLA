import { PublicSectionPage } from "@/components/public-section-page";

export default function ActivitiesPage() {
  return <PublicSectionPage eyebrow="Comunidade" title="Actividades" introduction="Espaço destinado à divulgação de actividades comunitárias, encontros, formações e iniciativas da FFPMU Angola." items={[
    { title: "Actividades comunitárias", description: "Notícias e informações sobre actividades confirmadas e autorizadas para divulgação." },
    { title: "Formação e participação", description: "Informações sobre iniciativas de formação e participação da comunidade." },
  ]} />;
}
