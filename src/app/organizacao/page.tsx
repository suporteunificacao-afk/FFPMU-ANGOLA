import { PublicSectionPage } from "@/components/public-section-page";

export default function OrganizationPage() {
  return <PublicSectionPage eyebrow="Estrutura" title="Organização" introduction="Conheça a estrutura organizacional da FFPMU Angola. A informação apresentada deverá reflectir as regiões, comunidades e unidades oficialmente registadas." items={[
    { title: "Nível nacional", description: "Informações institucionais e de coordenação nacional, a preencher com dados validados." },
    { title: "Regiões e comunidades", description: "Estrutura territorial a publicar a partir dos registos oficiais, sem criar regiões ou comunidades não confirmadas." },
  ]} />;
}
