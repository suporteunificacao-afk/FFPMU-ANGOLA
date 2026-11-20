"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setErrorMessage("");
    if (password.length < 10) {
      setErrorMessage("A nova palavra-passe deve ter pelo menos 10 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage("As palavras-passe não coincidem.");
      return;
    }
    setBusy(true);
    try {
      const supabase = createClient();
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error("O link de recuperação é inválido ou expirou. Peça um novo link.");
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setMessage("A palavra-passe foi alterada com sucesso. Já pode entrar no sistema com a nova palavra-passe.");
      setPassword("");
      setConfirmPassword("");
      await supabase.auth.signOut();
      window.setTimeout(() => router.replace("/login?password_updated=1"), 1800);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Não foi possível alterar a palavra-passe.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f5f7fa] px-5 py-12">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <Link href="/login" className="text-sm font-semibold text-amber-700">← Voltar ao acesso</Link>
        <p className="mt-8 text-xs font-bold uppercase tracking-[.2em] text-amber-700">FFPMU Angola</p>
        <h1 className="mt-2 text-3xl font-semibold text-[#142b4a]">Criar nova palavra-passe</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">Escolha uma palavra-passe nova com pelo menos 10 caracteres.</p>
        <form onSubmit={submit} className="mt-7 space-y-4">
          <label className="block text-sm font-medium text-slate-700">Nova palavra-passe
            <input required minLength={10} type="password" autoComplete="new-password" value={password} onChange={event => setPassword(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-3 outline-none focus:border-amber-600" />
          </label>
          <label className="block text-sm font-medium text-slate-700">Confirmar nova palavra-passe
            <input required minLength={10} type="password" autoComplete="new-password" value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-3 outline-none focus:border-amber-600" />
          </label>
          {message && <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{message}</p>}
          {errorMessage && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{errorMessage}</p>}
          <button disabled={busy} className="w-full rounded-lg bg-[#142b4a] px-4 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">{busy ? "A guardar..." : "Guardar nova palavra-passe"}</button>
        </form>
      </div>
    </main>
  );
}
