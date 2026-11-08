import { PublicSectionPage } from "@/components/public-section-page";

export default function LibraryPage() {
  return <PublicSectionPage eyebrow="Recursos" title="Biblioteca e materiais" introduction="Espaço para disponibilizar documentos, materiais de formação e recursos institucionais autorizados para consulta pública." items={[
    { title: "Documentos institucionais", description: "Materiais oficiais que tenham sido aprovados para acesso público." },
    { title: "Materiais de formação", description: "Recursos de apoio e formação, organizados por tema e data de publicação." },
  ]} />;
}
