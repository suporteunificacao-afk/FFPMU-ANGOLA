"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function RecoverPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    setErrorMessage("");
    try {
      const supabase = createClient();
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://ffpmu-angola.vercel.app";
      const redirectTo = new URL("/auth/callback?next=/redefinir-senha", siteUrl).toString();
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo });
      if (error) throw error;
      setMessage("Se existir uma conta associada a este endereço, receberá um e-mail com as instruções para criar uma nova palavra-passe. Verifique também a pasta de spam.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Não foi possível enviar o pedido. Tente novamente.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f5f7fa] px-5 py-12">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <Link href="/login" className="text-sm font-semibold text-amber-700">← Voltar ao acesso</Link>
        <p className="mt-8 text-xs font-bold uppercase tracking-[.2em] text-amber-700">FFPMU Angola</p>
        <h1 className="mt-2 text-3xl font-semibold text-[#142b4a]">Recuperar palavra-passe</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">Indique o endereço de e-mail associado à sua conta. Enviaremos um link seguro para definir uma nova palavra-passe.</p>
        <form onSubmit={submit} className="mt-7 space-y-4">
          <label className="block text-sm font-medium text-slate-700">E-mail da sua conta
            <input required type="email" autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-3 outline-none focus:border-amber-600" />
          </label>
          {message && <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{message}</p>}
          {errorMessage && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{errorMessage}</p>}
          <button disabled={busy} className="w-full rounded-lg bg-[#142b4a] px-4 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">{busy ? "A enviar..." : "Enviar link de recuperação"}</button>
        </form>
      </div>
    </main>
  );
}
