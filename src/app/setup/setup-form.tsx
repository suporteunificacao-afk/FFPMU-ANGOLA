"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function ChurchSetupForm() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [churchName, setChurchName] = useState("");
  const [slug, setSlug] = useState("");
  const [branchName, setBranchName] = useState("Sede");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const supabase = createClient();
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error("A sessão expirou. Inicie sessão novamente.");
      const { error } = await supabase.rpc("bootstrap_church", {
        _church_name: churchName.trim(),
        _church_slug: slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-"),
        _full_name: fullName.trim(),
        _branch_name: branchName.trim() || "Sede",
      });
      if (error) throw error;
      router.replace("/admin");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível concluir a configuração.");
    } finally {
      setBusy(false);
    }
  }

  return <form onSubmit={submit} className="mt-7 space-y-4">
    <label className="block text-sm font-medium text-slate-700">Nome completo do administrador
      <input required minLength={3} value={fullName} onChange={e=>setFullName(e.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-3"/>
    </label>
    <label className="block text-sm font-medium text-slate-700">Nome oficial da igreja
      <input required minLength={3} value={churchName} onChange={e=>setChurchName(e.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-3"/>
    </label>
    <label className="block text-sm font-medium text-slate-700">Identificador da igreja
      <input required minLength={3} pattern="[A-Za-z0-9-]+" value={slug} onChange={e=>setSlug(e.target.value)} placeholder="ffpmu-angola" className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-3"/>
    </label>
    <label className="block text-sm font-medium text-slate-700">Congregação principal
      <input value={branchName} onChange={e=>setBranchName(e.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-3"/>
    </label>
    {message && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{message}</p>}
    <button disabled={busy} className="w-full rounded-lg bg-[#142b4a] px-4 py-3 font-semibold text-white disabled:opacity-50">{busy ? "A configurar..." : "Criar igreja e ativar administrador"}</button>
    <p className="text-xs leading-5 text-slate-500">Este assistente só pode ser concluído uma vez neste projeto. O primeiro utilizador autenticado recebe o perfil de administrador principal.</p>
  </form>;
}
