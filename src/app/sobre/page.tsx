import { PublicSectionPage } from "@/components/public-section-page";

export default function AboutPage() {
  return <PublicSectionPage eyebrow="Instituição" title="Sobre a FFPMU Angola" introduction="Esta área do portal é dedicada à apresentação institucional da FFPMU Angola. A missão, a história e as informações oficiais serão publicadas aqui após validação institucional." items={[
    { title: "Identidade institucional", description: "Espaço para apresentar a identidade, os princípios e a orientação institucional oficialmente aprovados." },
    { title: "História e missão", description: "Área reservada à história da organização, à sua missão e aos marcos institucionais confirmados." },
  ]} />;
}
