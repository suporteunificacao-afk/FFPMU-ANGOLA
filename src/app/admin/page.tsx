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
  const { data: userData } = await supabase!.auth.getUser();
  return <div className="mx-auto max-w-6xl"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-medium text-amber-700">Visão geral</p><h1 className="mt-1 text-3xl font-semibold text-[#142b4a]">Bem-vindo à plataforma</h1><p className="mt-2 text-sm text-slate-500">Sessão iniciada como {userData.user?.email ?? "utilizador autenticado"}.</p></div><span className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-900">Fase 1 · Fundação</span></div>
    <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map(({title,detail,icon:Icon})=><div key={title} className="rounded-xl border border-slate-200 bg-white p-5"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-[#142b4a]"><Icon size={20}/></div><h2 className="mt-4 font-semibold text-[#142b4a]">{title}</h2><p className="mt-1 text-sm text-slate-500">{detail}</p></div>)}</div>
    <section className="mt-8 rounded-xl border border-slate-200 bg-white p-6"><h2 className="text-lg font-semibold text-[#142b4a]">Próximas etapas</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">A base Supabase está ativa, com as migrações iniciais e políticas RLS aplicadas. O assistente de primeiro acesso permite registar a igreja e ativar o primeiro administrador. O módulo Membros já dispõe de um primeiro fluxo de criação e listagem, ainda sujeito a testes de ponta a ponta.</p><div className="mt-5 flex items-start gap-3 rounded-lg bg-amber-50 p-4 text-sm leading-6 text-amber-950"><Database className="mt-0.5 shrink-0" size={18}/><p>Próximo passo: configurar as variáveis de ambiente no ambiente de execução, concluir o primeiro acesso e validar autenticação, permissões e operações reais antes de avançar para os restantes módulos.</p></div></section>
  </div>;
}
