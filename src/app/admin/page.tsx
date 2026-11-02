import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Database, ShieldCheck, Users, CalendarDays } from "lucide-react";

const cards = [
  { title: "Membros", detail: "Cadastro e acompanhamento", icon: Users },
  { title: "Programação", detail: "Cultos, eventos e escalas", icon: CalendarDays },
  { title: "Segurança", detail: "Perfis e permissões", icon: ShieldCheck },
  { title: "Base de dados", detail: "Persistência Supabase", icon: Database },
];

export default async function DashboardPage() {
  const supabase = await createClient();
  if (!supabase) redirect("/login?setup=required");

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("church_id,is_active")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.is_active) redirect("/login");
  if (!profile.church_id) redirect("/setup");

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-amber-700">Visão geral</p>
          <h1 className="mt-1 text-3xl font-semibold text-[#142b4a]">Bem-vindo à plataforma</h1>
          <p className="mt-2 text-sm text-slate-500">
            Sessão iniciada como {user.email ?? "utilizador autenticado"}.
          </p>
        </div>
        <span className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-900">
          Configuração inicial concluída
        </span>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ title, detail, icon: Icon }) => (
          <div key={title} className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-[#142b4a]">
              <Icon size={20} />
            </div>
            <h2 className="mt-4 font-semibold text-[#142b4a]">{title}</h2>
            <p className="mt-1 text-sm text-slate-500">{detail}</p>
          </div>
        ))}
      </div>

      <section className="mt-8 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-[#142b4a]">Próximas etapas</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          A igreja, a congregação principal e a conta de Administrador Principal já foram
          registadas na base de dados. A autenticação e a configuração institucional inicial
          estão concluídas. O módulo Membros dispõe do primeiro fluxo de criação, pesquisa,
          consulta e edição, que será agora validado com operações reais.
        </p>
        <div className="mt-5 flex items-start gap-3 rounded-lg bg-amber-50 p-4 text-sm leading-6 text-amber-950">
          <Database className="mt-0.5 shrink-0" size={18} />
          <p>
            Próximo passo: testar o registo e a edição de membros, confirmar as permissões
            de acesso e rever os avisos de segurança antes de avançar para os restantes módulos.
          </p>
        </div>
      </section>
    </div>
  );
}
