import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const statusLabels: Record<string, string> = {
  visitante: "Visitante",
  em_integracao: "Em integração",
  ativo: "Activo",
  inativo: "Inactivo",
  transferido: "Transferido",
};

function Detail({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="rounded-lg bg-slate-50 p-4">
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 break-words text-sm text-[#142b4a]">{value || "—"}</dd>
    </div>
  );
}

export default async function MemberDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
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
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="font-semibold text-[#142b4a]">Dados pessoais e contacto</h2>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          <Detail label="Género" value={member.gender} />
          <Detail label="Data de nascimento" value={member.birth_date} />
          <Detail label="Telefone" value={member.phone} />
          <Detail label="WhatsApp" value={member.whatsapp} />
          <Detail label="E-mail" value={member.email} />
          <Detail label="Morada" value={member.address} />
        </dl>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="font-semibold text-[#142b4a]">Percurso na igreja</h2>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          <Detail label="Data de entrada" value={member.joined_at} />
          <Detail label="Data de baptismo" value={member.baptized_at} />
          <Detail label="Registado em" value={member.created_at ? new Date(member.created_at).toLocaleDateString("pt-AO") : null} />
        </dl>
        <div className="mt-3 rounded-lg bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Observações</p>
          <p className="mt-1 whitespace-pre-wrap text-sm text-[#142b4a]">{member.notes || "Sem observações registadas."}</p>
        </div>
      </div>
      <p className="text-xs text-slate-500">Esta ficha respeita as permissões de leitura definidas na base de dados. A edição será disponibilizada após validação do fluxo de actualização e das permissões correspondentes.</p>
    </section>
  );
}
