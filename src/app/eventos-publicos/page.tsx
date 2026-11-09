import { PublicSectionPage } from "@/components/public-section-page";
import { createClient } from "@/lib/supabase/server";

export const revalidate = 300;

export default async function PublicEventsPage() {
  const supabase = await createClient();
  const { data: events } = supabase
    ? await supabase
        .from("events")
        .select("id,title,description,event_type,starts_at,ends_at,location,registration_required,capacity,status")
        .eq("is_public", true)
        .in("status", ["Agendado", "Em curso"])
        .or(`starts_at.gte.${new Date().toISOString()},status.eq.Em curso`)
        .order("starts_at", { ascending: true })
        .limit(12)
    : { data: [] };

  return (
    <PublicSectionPage
      eyebrow="Agenda"
      title="Eventos e seminários"
      introduction="Consulte os eventos e seminários que a FFPMU ANGOLA autorizou para divulgação pública."
      items={(events ?? []).length ? (events ?? []).map((event) => ({
        title: event.title,
        description: [
          event.event_type,
          `Início: ${new Date(event.starts_at).toLocaleString("pt-AO", {
            dateStyle: "full",
            timeStyle: "short",
            timeZone: "Africa/Luanda",
          })}`,
          event.ends_at ? `Fim: ${new Date(event.ends_at).toLocaleString("pt-AO", {
            dateStyle: "medium",
            timeStyle: "short",
            timeZone: "Africa/Luanda",
          })}` : null,
          event.status === "Em curso" ? "A decorrer" : "Agendado",
          event.location,
          event.description,
          event.registration_required ? "Inscrição obrigatória." : null,
          event.capacity ? `Vagas limitadas: ${event.capacity} participantes.` : null,
        ].filter(Boolean).join(" · "),
      })) : [
        {
          title: "Não há eventos públicos agendados",
          description: "Quando a equipa administrativa publicar eventos para divulgação pública, as informações aparecerão nesta página.",
        },
      ]}
    />
  );
}
