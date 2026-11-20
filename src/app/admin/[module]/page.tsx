import { notFound } from "next/navigation";
import { navigation } from "@/lib/config";

const descriptions: Record<string, string> = {
  membros: "Cadastro, fichas individuais, estados, histórico e importação/exportação.", visitantes: "Registo de primeiras visitas, acompanhamento e integração.", familias: "Agregados familiares, responsáveis e relações entre membros.", departamentos: "Estrutura organizacional, liderança, integrantes e atividades.", ministerios: "Equipas ministeriais e participação dos membros.", louvor: "Músicos, vocalistas, equipas, funções e disponibilidade.", cultos: "Programação dos cultos, dirigentes, pregadores e histórico.", escalas: "Distribuição de funções, disponibilidade, confirmações e substituições.", repertorio: "Biblioteca musical, tonalidades e repertórios por culto.", eventos: "Calendário, responsáveis, participantes e eventos públicos/internos.", presencas: "Registo de participação em cultos, ensaios e atividades.", pastoral: "Registos confidenciais e acompanhamento pastoral com acesso restrito.", comunicacao: "Avisos, comunicados e notificações internas.", financeiro: "Receitas, dízimos, ofertas, despesas e orçamentos com acesso protegido.", relatorios: "Relatórios administrativos e exportações autorizadas.", utilizadores: "Contas, perfis, convites e permissões por congregação e departamento.", configuracoes: "Identidade institucional, moeda, fuso horário e parâmetros da plataforma."
};

export default async function ModulePage({ params }: { params: Promise<{ module: string }> }) {
  const { module } = await params;
  const item = navigation.find(group => group.items.some(entry => entry.href === `/admin/${module}`))?.items.find(entry => entry.href === `/admin/${module}`);
  if (!item) notFound();
  return <section className="mx-auto max-w-5xl"><p className="text-sm font-medium text-amber-700">Módulo do sistema</p><h1 className="mt-1 text-3xl font-semibold text-[#142b4a]">{item.label}</h1><p className="mt-3 max-w-2xl leading-7 text-slate-600">{descriptions[module]}</p><div className="mt-8 rounded-xl border border-dashed border-slate-300 bg-white p-8"><p className="font-semibold text-[#142b4a]">Implementação programada</p><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Este módulo está previsto no Prompt Mestre e será implementado na fase correspondente. Os formulários e operações serão ligados à base de dados e às permissões antes de ser considerado concluído. Nenhum registo de demonstração é apresentado como dado real.</p></div></section>;
}
