import { PublicSectionPage } from "@/components/public-section-page";

export default function PublicEventsPage() {
  return <PublicSectionPage eyebrow="Agenda" title="Eventos e seminários" introduction="Nesta área serão apresentados os eventos marcados como públicos e autorizados para divulgação. A agenda será ligada aos registos administrativos numa etapa própria." items={[
    { title: "Próximos eventos", description: "A agenda pública será apresentada aqui quando existirem eventos publicados e validados." },
    { title: "Seminários e encontros", description: "Informações de inscrição, datas e locais serão divulgadas apenas após confirmação." },
  ]} />;
}
