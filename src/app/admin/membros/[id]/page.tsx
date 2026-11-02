import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateMember } from "../actions";

const statusLabels: Record<string, string> = {
  visitante: "Visitante",
  em_integracao: "Em integração",
  ativo: "Activo",
  inativo: "Inactivo",
  transferido: "Transferido",
};

const fieldClass = "mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-amber-600";

function Field({ label, name, value, type = "text", maxLength }: {
  label: string; name: string; value: string | null; type?: string; maxLength?: number;
}) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      {label}
      <input name={name} type={type} defaultValue={value ?? ""} maxLength={maxLength} className={fieldClass} />
    </label>
  );
}

export default async function MemberDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ updated?: string; error?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
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

  const { data: member, error } = await supabase
    .from("members")
    .select("id,member_code,full_name,gender,birth_date,phone,whatsapp,email,address,joined_at,baptized_at,status,notes,created_at")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return (
      <section className="mx-auto max-w-4xl rounded-xl border border-amber-200 bg-amber-50 p-6">
        <h1 className="text-xl font-semibold text-[#142b4a]">Ficha indisponível</h1>
        <p className="mt-2 text-sm text-amber-900">Não foi possível consultar este registo. Verifique as permissões de leitura e tente novamente.</p>
        <Link href="/admin/membros" className="mt-4 inline-block text-sm font-semibold text-[#142b4a] underline">Voltar aos membros</Link>
      </section>
    );
  }
  if (!member) notFound();

  return (
    <section className="mx-auto max-w-4xl space-y-6">
      <Link href="/admin/membros" className="text-sm font-semibold text-amber-700 hover:underline">← Voltar aos membros</Link>
      <header className="rounded-xl border border-slate-200 bg-white p-6">
        <p className="text-sm font-medium text-amber-700">Ficha individual</p>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold text-[#142b4a]">{member.full_name}</h1>
            <p className="mt-2 text-sm text-slate-500">Código: {member.member_code || "Ainda não atribuído"}</p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">{statusLabels[member.status] ?? member.status}</span>
        </div>
      </header>

      {query.updated && <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">Dados do membro actualizados com sucesso.</p>}
      {query.error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{query.error === "invalid" ? "Existem campos inválidos. Reveja os dados e tente novamente." : "Não foi possível actualizar. Confirme se tem a permissão members.update."}</p>}

      <form action={updateMember} className="space-y-6">
        <input type="hidden" name="member_id" value={member.id} />
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="font-semibold text-[#142b4a]">Dados pessoais e contacto</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2"><Field label="Nome completo *" name="full_name" value={member.full_name} maxLength={160} /></div>
            <Field label="Género" name="gender" value={member.gender} maxLength={40} />
            <Field label="Data de nascimento" name="birth_date" value={member.birth_date} type="date" />
            <Field label="Telefone" name="phone" value={member.phone} maxLength={40} />
            <Field label="WhatsApp" name="whatsapp" value={member.whatsapp} maxLength={40} />
            <Field label="E-mail" name="email" value={member.email} type="email" maxLength={254} />
            <Field label="Morada" name="address" value={member.address} maxLength={500} />
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="font-semibold text-[#142b4a]">Percurso na igreja</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Data de entrada" name="joined_at" value={member.joined_at} type="date" />
            <Field label="Data de baptismo" name="baptized_at" value={member.baptized_at} type="date" />
            <label className="block text-sm font-medium text-slate-700">Estado
              <select name="status" defaultValue={member.status} className={fieldClass}>
                <option value="visitante">Visitante</option>
                <option value="em_integracao">Em integração</option>
                <option value="ativo">Activo</option>
                <option value="inativo">Inactivo</option>
                <option value="transferido">Transferido</option>
              </select>
            </label>
            <Field label="Registado em" name="created_at_display" value={member.created_at ? new Date(member.created_at).toLocaleDateString("pt-AO") : null} />
          </div>
          <label className="mt-4 block text-sm font-medium text-slate-700">Observações
            <textarea name="notes" rows={4} maxLength={5000} defaultValue={member.notes ?? ""} className={fieldClass} />
          </label>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-slate-500">A gravação é autorizada pela política members.update da base de dados.</p>
          <button className="rounded-lg bg-[#142b4a] px-5 py-3 text-sm font-semibold text-white hover:bg-[#1d3c63]">Guardar alterações</button>
        </div>
      </form>
    </section>
  );
}
