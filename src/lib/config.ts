export const appConfig = {
  name: "FFPMU Angola",
  description: "Sistema Integrado de Gestão da Igreja",
  locale: "pt-AO",
  timezone: "Africa/Luanda",
  currency: "AOA",
};

export const navigation = [
  { title: "Visão geral", items: [{ label: "Dashboard", href: "/admin", icon: "layout-dashboard" }] },
  { title: "Pessoas", items: [
    { label: "Membros", href: "/admin/membros", icon: "users" },
    { label: "Visitantes", href: "/admin/visitantes", icon: "user-plus" },
    { label: "Famílias", href: "/admin/familias", icon: "house" },
  ] },
  { title: "Organização", items: [
    { label: "Departamentos", href: "/admin/departamentos", icon: "network" },
    { label: "Ministérios", href: "/admin/ministerios", icon: "church" },
    { label: "Ministério de Louvor", href: "/admin/louvor", icon: "music-2" },
  ] },
  { title: "Programação", items: [
    { label: "Cultos e serviços", href: "/admin/cultos", icon: "calendar-days" },
    { label: "Escalas", href: "/admin/escalas", icon: "clipboard-list" },
    { label: "Repertório musical", href: "/admin/repertorio", icon: "list-music" },
    { label: "Eventos e calendário", href: "/admin/eventos", icon: "calendar" },
    { label: "Presenças", href: "/admin/presencas", icon: "user-check" },
  ] },
  { title: "Gestão", items: [
    { label: "Acompanhamento pastoral", href: "/admin/pastoral", icon: "hand-heart" },
    { label: "Comunicação e avisos", href: "/admin/comunicacao", icon: "megaphone" },
    { label: "Gestão financeira", href: "/admin/financeiro", icon: "wallet" },
    { label: "Relatórios", href: "/admin/relatorios", icon: "chart-no-axes-combined" },
  ] },
  { title: "Sistema", items: [
    { label: "Utilizadores e permissões", href: "/admin/utilizadores", icon: "shield-check" },
    { label: "Configurações", href: "/admin/configuracoes", icon: "settings" },
  ] },
] as const;
