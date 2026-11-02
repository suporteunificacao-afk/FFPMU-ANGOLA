import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

async function signIn(formData: FormData) {
  "use server";
  const supabase = await createClient();
  if (!supabase) redirect("/login?setup=required");
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) redirect("/login?error=credentials");
  redirect("/admin");
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ setup?: string; error?: string }> }) {
  const params = await searchParams;
  const supabase = await createClient();
  return <main className="flex min-h-screen items-center justify-center bg-[#f5f7fa] px-5 py-12">
    <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <Link href="/" className="text-sm font-semibold text-amber-700">← Voltar ao portal</Link>
      <p className="mt-8 text-xs font-bold uppercase tracking-[.2em] text-amber-700">FFPMU Angola</p><h1 className="mt-2 text-3xl font-semibold text-[#142b4a]">Entrar na plataforma</h1><p className="mt-2 text-sm text-slate-500">Acesso reservado a utilizadores autorizados.</p>
      {!supabase && <p className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">O Supabase ainda não foi configurado. É necessário ligar a base de dados antes de ativar o acesso.</p>}
      {params.setup && <p className="mt-4 text-sm text-amber-800">Configure as variáveis do Supabase para continuar.</p>}
      {params.error && <p className="mt-4 text-sm text-red-700">Não foi possível iniciar sessão. Verifique as credenciais.</p>}
      <form action={signIn} className="mt-7 space-y-4"><label className="block text-sm font-medium text-slate-700">E-mail<input name="email" type="email" required className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-3 outline-none focus:border-amber-600"/></label><label className="block text-sm font-medium text-slate-700">Palavra-passe<input name="password" type="password" required className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-3 outline-none focus:border-amber-600"/></label><button disabled={!supabase} className="w-full rounded-lg bg-[#142b4a] px-4 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">Iniciar sessão</button></form>
      <p className="mt-6 text-xs leading-5 text-slate-500">As contas e permissões serão geridas pelo administrador do sistema. Não existe registo público de utilizadores.</p>
    </div>
  </main>;
}
