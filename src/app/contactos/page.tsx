import { PublicSectionPage } from "@/components/public-section-page";

export default function ContactsPage() {
  return <PublicSectionPage eyebrow="Contacto" title="Contactos" introduction="Esta página reunirá os canais oficiais de contacto da FFPMU Angola. Os contactos serão adicionados depois de confirmados pela organização." items={[
    { title: "Contacto institucional", description: "Os endereços, telefones e horários oficiais serão publicados após validação." },
    { title: "Pedido de informação", description: "Os canais para pedidos de informação e encaminhamento serão indicados nesta secção." },
  ]} />;
}
