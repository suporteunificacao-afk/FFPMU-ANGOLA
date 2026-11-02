import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createMember } from "./actions";

const statusLabels: Record<string, string> = {
  visitante: "Visitante",
  em_integracao: "Em integração",
  ativo: "Activo",
  inativo: "Inactivo",
  transferido: "Transferido",
};

const statusStyles: Record<string, string> = {
  visitante: "bg-sky-50 text-sky-700",
  em_integracao: "bg-amber-50 text-amber-800",
  ativo: "bg-emerald-50 text-emerald-700",
  inativo: "bg-slate-100 text-slate-600",
  transferido: "bg-violet-50 text-violet-700",
};

export default async function MembersPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string; error?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  if (!supabase) redirect("/login?setup=required");

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("church_id,is_active")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.is_active) redirect("/login");
  if (!profile.church_id) redirect("/setup");

  const { data: members, error } = await supabase
    .from("members")
    .select("id,member_code,full_name,phone,email,status,created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-amber-700">Pessoas</p>
          <h1 className="mt-1 text-3xl font-semibold text-[#142b4a]">Membros</h1>
          <p className="mt-2 text-sm text-slate-500">Registo e consulta de membros da congregação.</p>
        </div>
        <span className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
          {members?.length ?? 0} registos apresentados
        </span>
      </header>

      {params.created && (
        <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          Membro registado com sucesso.
        </p>
      )}
      {params.error && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {params.error === "invalid"
            ? "Verifique o nome e o estado selecionado."
            : "Não foi possível guardar. Confirme se a sua conta tem a permissão para criar membros."}
        </p>
      )}
      {error && (
        <p role="alert" className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          Não foi possível carregar os membros. A política de acesso da base de dados pode não permitir esta consulta.
        </p>
      )}

      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-[#142b4a]">Adicionar membro</h2>
        <p className="mt-1 text-sm text-slate-500">Os dados são guardados na base de dados da igreja.</p>
        <form action={createMember} className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="text-sm font-medium text-slate-700 md:col-span-2">
            Nome completo *
            <input name="full_name" required minLength={3} maxLength={160} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-3 outline-none focus:border-amber-600" />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Telefone
            <input name="phone" type="tel" maxLength={40} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-3 outline-none focus:border-amber-600" />
          </label>
          <label className="text-sm font-medium text-slate-700">
            E-mail
            <input name="email" type="email" maxLength={254} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-3 outline-none focus:border-amber-600" />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Estado
            <select name="status" defaultValue="em_integracao" className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-3 outline-none focus:border-amber-600">
              <option value="visitante">Visitante</option>
              <option value="em_integracao">Em integração</option>
              <option value="ativo">Activo</option>
              <option value="inativo">Inactivo</option>
              <option value="transferido">Transferido</option>
            </select>
          </label>
          <div className="flex items-end">
            <button className="w-full rounded-lg bg-[#142b4a] px-5 py-3 font-semibold text-white transition hover:bg-[#1d3c63]">
              Guardar membro
            </button>
          </div>
        </form>
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="font-semibold text-[#142b4a]">Membros registados</h2>
          <p className="mt-1 text-xs text-slate-500">Lista dos 100 registos mais recentes visíveis para a sua conta.</p>
        </div>
        {members && members.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-6 py-3 font-semibold">Nome</th>
                  <th className="px-6 py-3 font-semibold">Código</th>
                  <th className="px-6 py-3 font-semibold">Contacto</th>
                  <th className="px-6 py-3 font-semibold">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {members.map((member) => (
                  <tr key={member.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-medium text-[#142b4a]">{member.full_name}</td>
                    <td className="px-6 py-4 text-slate-500">{member.member_code || "—"}</td>
                    <td className="px-6 py-4 text-slate-600">{member.phone || member.email || "—"}</td>
                    <td className="px-6 py-4">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[member.status] ?? "bg-slate-100 text-slate-600"}`}>
                        {statusLabels[member.status] ?? member.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-12 text-center">
            <p className="font-medium text-[#142b4a]">Ainda não existem membros registados.</p>
            <p className="mt-2 text-sm text-slate-500">Use o formulário acima para criar o primeiro registo.</p>
          </div>
        )}
      </section>
    </div>
  );
}
