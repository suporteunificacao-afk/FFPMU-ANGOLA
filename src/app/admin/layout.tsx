import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { navigation } from "@/lib/config";
import { LayoutDashboard, Users, UserPlus, House, Network, Church, Music2, CalendarDays, ClipboardList, ListMusic, Calendar, UserCheck, HandHeart, Megaphone, Wallet, ChartNoAxesCombined, ShieldCheck, Settings, LogOut } from "lucide-react";

const icons = { "layout-dashboard": LayoutDashboard, users: Users, "user-plus": UserPlus, house: House, network: Network, church: Church, "music-2": Music2, "calendar-days": CalendarDays, "clipboard-list": ClipboardList, "list-music": ListMusic, calendar: Calendar, "user-check": UserCheck, "hand-heart": HandHeart, megaphone: Megaphone, wallet: Wallet, "chart-no-axes-combined": ChartNoAxesCombined, "shield-check": ShieldCheck, settings: Settings } as const;

async function signOut() {
  "use server";
  const supabase = await createClient();
  if (supabase) await supabase.auth.signOut();
  redirect("/login");
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  if (!supabase) redirect("/login?setup=required");
  const { data: claims, error } = await supabase.auth.getClaims();
  if (error || !claims?.claims) redirect("/login");
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("church_id,is_active").eq("id", user.id).maybeSingle();
  if (!profile?.is_active) redirect("/login");
  if (!profile.church_id) redirect("/setup");
  return <div className="min-h-screen md:flex">
    <aside className="w-full shrink-0 bg-[#142b4a] text-white md:min-h-screen md:w-72">
      <div className="border-b border-white/10 px-6 py-6"><p className="text-xs font-bold uppercase tracking-[.2em] text-[#d6b56c]">FFPMU Angola</p><p className="mt-1 text-sm text-slate-300">Gestão da Igreja</p></div>
      <nav className="space-y-6 px-4 py-5">{navigation.map((group) => <div key={group.title}><p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[.18em] text-slate-400">{group.title}</p><div className="space-y-1">{group.items.map((item) => { const Icon = icons[item.icon]; return <Link key={item.href} href={item.href} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-200 transition hover:bg-white/10 hover:text-white"><Icon size={17}/>{item.label}</Link>; })}</div></div>)}</nav>
      <form action={signOut} className="px-4 pb-6"><button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-300 hover:bg-white/10"><LogOut size={17}/> Terminar sessão</button></form>
    </aside>
    <div className="min-w-0 flex-1"><header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-5"><div><p className="text-sm font-semibold text-[#142b4a]">Painel administrativo</p><p className="text-xs text-slate-500">Área reservada</p></div><span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">Sessão autenticada</span></header><main className="p-6 md:p-9">{children}</main></div>
  </div>;
}
