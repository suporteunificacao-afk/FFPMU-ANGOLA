import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ChurchSetupForm } from "./setup-form";

export default async function SetupPage() {
  const supabase = await createClient();
  if (!supabase) redirect("/login?setup=required");
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("church_id").eq("id", user.id).maybeSingle();
  if (profile?.church_id) redirect("/admin");
  return <main className="flex min-h-screen items-center justify-center bg-[#f5f7fa] px-5 py-12">
    <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <Link href="/" className="text-sm font-semibold text-amber-700">← Portal</Link>
      <p className="mt-8 text-xs font-bold uppercase tracking-[.2em] text-amber-700">Configuração inicial</p>
      <h1 className="mt-2 text-3xl font-semibold text-[#142b4a]">Registar a igreja</h1>
      <p className="mt-2 text-sm leading-6 text-slate-500">Defina os dados institucionais e transforme a sua conta no primeiro administrador principal.</p>
      <ChurchSetupForm />
    </div>
  </main>;
}
