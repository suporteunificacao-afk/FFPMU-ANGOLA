"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function FirstAccessPage() {
  const router = useRouter();
  const [name,setName] = useState("");
  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");
  const [message,setMessage] = useState("");
  const [busy,setBusy] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage("");
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email, password,
        options: { data: { full_name: name }, emailRedirectTo: `${window.location.origin}/setup` }
      });
      if (error) throw error;
      if (!data.session) {
        setMessage("A conta foi registada. Confirme o endereço de e-mail através da mensagem enviada e depois entre no sistema para concluir a configuração da igreja.");
      } else {
        router.replace("/setup"); router.refresh();
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível criar a conta.");
    } finally { setBusy(false); }
  }

  return <main className="flex min-h-screen items-center justify-center bg-[#f5f7fa] px-5 py-12">
    <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <Link href="/login" className="text-sm font-semibold text-amber-700">← Voltar ao acesso</Link>
      <p className="mt-8 text-xs font-bold uppercase tracking-[.2em] text-amber-700">Primeiro acesso</p>
      <h1 className="mt-2 text-3xl font-semibold text-[#142b4a]">Criar conta de administrador</h1>
      <p className="mt-2 text-sm leading-6 text-slate-500">Crie a sua conta para iniciar a configuração institucional. A atribuição de administrador só é possível uma vez, através da configuração protegida da base de dados.</p>
      <form onSubmit={submit} className="mt-7 space-y-4">
        <label className="block text-sm font-medium text-slate-700">Nome completo<input required minLength={3} value={name} onChange={e=>setName(e.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-3"/></label>
        <label className="block text-sm font-medium text-slate-700">E-mail<input required type="email" value={email} onChange={e=>setEmail(e.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-3"/></label>
        <label className="block text-sm font-medium text-slate-700">Palavra-passe<input required type="password" minLength={10} value={password} onChange={e=>setPassword(e.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-3"/><span className="mt-1 block text-xs text-slate-500">Mínimo de 10 caracteres.</span></label>
        {message && <p role="status" className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">{message}</p>}
        <button disabled={busy} className="w-full rounded-lg bg-[#142b4a] px-4 py-3 font-semibold text-white disabled:opacity-50">{busy ? "A criar conta..." : "Criar conta"}</button>
      </form>
    </div>
  </main>;
}
