import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createMember } from "./actions";
import { MemberPhotoPicker } from "./photo-picker";

const fieldClass = "mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-amber-600";
const labelClass = "block text-sm font-medium text-slate-700";

function Field({ label, name, type = "text", required = false, placeholder = "", maxLength }: {
  label: string; name: string; type?: string; required?: boolean; placeholder?: string; maxLength?: number;
}) {
  return <label className={labelClass}>{label}{required && " *"}<input name={name} type={type} required={required} placeholder={placeholder} maxLength={maxLength} className={fieldClass} /></label>;
}

function Seminar({ days }: { days: "2" | "7" | "21" | "40" }) {
  const key = days + "_days";
  return (
    <div className="grid gap-3 rounded-lg border border-slate-200 p-3 sm:grid-cols-[180px_1fr_1fr] sm:items-end">
      <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
        <input type="checkbox" name={key + "_completed"} className="h-4 w-4 rounded border-slate-300 text-amber-700 focus:ring-amber-600" />
        Seminário de {days} dias realizado
      </label>
      <Field label="Data" name={key + "_date"} type="date" />
      <Field label="Lugar" name={key + "_place"} maxLength={160} />
    </div>
  );
}

export default async function MembersPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string; error?: string; q?: string; status?: string }>;
}) {
  const params = await searchParams;
  const query = (params.q ?? "").trim().replace(/[,%()]/g, " ").replace(/\\s+/g, " ").slice(0, 80);
  const allowedStatuses = ["visitante", "em_integracao", "ativo", "inativo", "transferido"];
  const statusFilter = allowedStatuses.includes(params.status ?? "") ? params.status! : "";
  const supabase = await createClient();
  if (!supabase) redirect("/login?setup=required");
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("church_id,is_active").eq("id", user.id).maybeSingle();
  if (!profile?.is_active) redirect("/login");
  if (!profile.church_id) redirect("/setup");

  let membersQuery = supabase.from("members")
    .select("id,member_code,full_name,phone,email,status,photo_path,created_at,family_id,category")
    .order("created_at", { ascending: false }).limit(100);
  if (query) membersQuery = membersQuery.ilike("full_name", "%" + query + "%");
  if (statusFilter) membersQuery = membersQuery.eq("status", statusFilter);
  const { data: members, error } = await membersQuery;
  const { data: families } = await supabase.from("families").select("id,family_name");

  return (
    <div className="mx-auto max-w-6xl space-y-7">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link href="/admin" className="text-sm text-slate-500 hover:underline">Painel administrativo / </Link>
          <span className="text-sm text-slate-500">Membros</span>
          <h1 className="mt-2 text-3xl font-semibold text-[#142b4a]">Adicionar membro</h1>
          <p className="mt-1 text-sm text-slate-500">Ficha completa de identificação e acompanhamento na igreja.</p>
        </div>
        <span className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">{error ? "Lista indisponível" : (members?.length ?? 0) + " membros registados"}</span>
      </header>

      {params.created && <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">Membro registado com sucesso.</p>}
      {params.error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{params.error === "invalid" ? "Verifique os campos e as datas introduzidas." : params.error === "photo" ? "A fotografia deve ser JPG, PNG ou WEBP e ter no máximo 2 MB. Confirme também as permissões de armazenamento." : params.error === "family" ? "Não foi possível associar a família. Tente novamente." : "Não foi possível guardar. Confirme as permissões e tente novamente."}</p>}

      <form action={createMember} className="space-y-5">
        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="font-semibold text-[#142b4a]">Identificação e fotografia</h2>
          <div className="mt-5 grid gap-6 md:grid-cols-[170px_1fr]">
            <MemberPhotoPicker />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2"><Field label="Nome completo" name="full_name" required maxLength={160} placeholder="Digite o nome completo" /></div>
              <Field label="Data de nascimento" name="birth_date" type="date" />
              <label className={labelClass}>Género<select name="gender" className={fieldClass}><option value="">Seleccione</option><option value="Masculino">Masculino</option><option value="Feminino">Feminino</option><option value="Outro">Outro</option></select></label>
              <Field label="Filiação (Pai)" name="father_name" maxLength={160} />
              <Field label="Filiação (Mãe)" name="mother_name" maxLength={160} />
              <Field label="Naturalidade" name="naturality" maxLength={160} />
              <Field label="Nacionalidade" name="nationality" maxLength={100} />
              <Field label="Província" name="province" maxLength={120} />
              <Field label="Município" name="municipality" maxLength={120} />
              <Field label="Povoação" name="population" maxLength={160} />
              <label className={labelClass}>Estado civil<select name="civil_status" className={fieldClass}><option value="">Seleccione</option><option>Solteiro(a)</option><option>Casado(a)</option><option>Divorciado(a)</option><option>Viúvo(a)</option><option>União de facto</option></select></label>
              <Field label="Profissão" name="profession" maxLength={120} />
              <Field label="Pai/Mãe espiritual" name="spiritual_parent" maxLength={160} />
              <Field label="Data de ingresso na igreja" name="joined_at" type="date" />
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="font-semibold text-[#142b4a]">Dados do cônjuge</h2>
          <p className="mt-1 text-xs text-slate-500">Preencha esta secção quando aplicável.</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <Field label="Nome do esposo(a)" name="spouse_name" maxLength={160} />
            <Field label="Filiação (Pai)" name="spouse_father_name" maxLength={160} />
            <Field label="Filiação (Mãe)" name="spouse_mother_name" maxLength={160} />
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="font-semibold text-[#142b4a]">Contactos</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Telefone" name="phone" type="tel" maxLength={40} />
            <Field label="WhatsApp" name="whatsapp" type="tel" maxLength={40} />
            <Field label="E-mail" name="email" type="email" maxLength={254} />
            <Field label="Morada" name="address" maxLength={500} />
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="font-semibold text-[#142b4a]">Família e categoria</h2>
          <p className="mt-1 text-xs text-slate-500">Use o mesmo nome de família para associar pais e filhos ao mesmo agregado familiar.</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Família" name="family_name" required maxLength={160} placeholder="Ex.: Família António" />
            <Field label="Categoria / grupo" name="category" required maxLength={100} placeholder="Ex.: Criança, Jovem, Adulto, Obreiro..." />
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="font-semibold text-[#142b4a]">Percurso na igreja</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Data de baptismo" name="baptized_at" type="date" />
            <Field label="Data da bênção" name="blessing_date" type="date" />
            <Field label="Local da bênção" name="blessing_location" maxLength={160} />
            <Field label="Fundo da bênção" name="blessing_fund" maxLength={160} />
            <Field label="Jejum" name="fasting" maxLength={160} />
            <Field label="Centro" name="local_center" maxLength={160} />
            <Field label="N.º de filhos da 2.ª geração" name="children_second_generation" type="number" />
            <Field label="Data de intronização como Cheonbo" name="intronization_date" type="date" />
            <Field label="Vida pública" name="public_life" maxLength={300} />
            <Field label="Local da vida pública" name="public_life_location" maxLength={160} />
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="font-semibold text-[#142b4a]">Seminários realizados</h2>
          <p className="mt-1 text-xs text-slate-500">Assinale a caixa quando o seminário tiver sido concluído; depois indique a data e o lugar.</p>
          <div className="mt-4 space-y-3">
            <Seminar days="2" />
            <Seminar days="7" />
            <Seminar days="21" />
            <Seminar days="40" />
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="font-semibold text-[#142b4a]">Línguas faladas</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {["Português", "Francês", "Inglês", "Umbundu", "Kimbundu", "Kikongo", "Ibinda", "Cokwe", "Lingala"].map((language) => (
              <label key={language} className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" name="languages" value={language} className="h-4 w-4 rounded border-slate-300 text-amber-700 focus:ring-amber-600" />{language}</label>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="font-semibold text-[#142b4a]">Estado e observações</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className={labelClass}>Estado<select name="status" defaultValue="em_integracao" className={fieldClass}><option value="visitante">Visitante</option><option value="em_integracao">Em integração</option><option value="ativo">Activo</option><option value="inativo">Inactivo</option><option value="transferido">Transferido</option></select></label>
            <label className={labelClass}>Observações<textarea name="notes" rows={3} maxLength={5000} className={fieldClass} /></label>
          </div>
        </section>

        <div className="flex flex-wrap justify-between gap-3">
          <Link href="/admin" className="rounded-lg border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancelar</Link>
          <button className="rounded-lg bg-[#142b4a] px-6 py-3 text-sm font-semibold text-white hover:bg-[#1d3c63]">Guardar membro</button>
        </div>
      </form>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="font-semibold text-[#142b4a]">Membros registados</h2>
          <p className="mt-1 text-xs text-slate-500">Até 100 registos mais recentes visíveis para a sua conta.</p>
          <form method="get" className="mt-4 grid gap-3 sm:grid-cols-[1fr_200px_auto]">
            <input name="q" defaultValue={query} placeholder="Pesquisar pelo nome completo" maxLength={80} className={fieldClass} />
            <select name="status" defaultValue={statusFilter} className={fieldClass}><option value="">Todos os estados</option><option value="visitante">Visitante</option><option value="em_integracao">Em integração</option><option value="ativo">Activo</option><option value="inativo">Inactivo</option><option value="transferido">Transferido</option></select>
            <button className="rounded-lg border border-[#142b4a] px-4 py-2.5 text-sm font-semibold text-[#142b4a] hover:bg-slate-50">Pesquisar</button>
          </form>
        </div>
        {error ? <p className="px-6 py-12 text-center text-sm text-amber-900">Não foi possível carregar os membros.</p> : members && members.length ? (
          <div className="overflow-x-auto"><table className="w-full min-w-[680px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-6 py-3">Nome</th><th className="px-6 py-3">Família / Categoria</th><th className="px-6 py-3">Contacto</th><th className="px-6 py-3">Estado</th></tr></thead>
            <tbody className="divide-y divide-slate-100">{members.map((member) => <tr key={member.id} className="hover:bg-slate-50"><td className="px-6 py-4 font-medium text-[#142b4a]"><Link href={"/admin/membros/" + member.id} className="hover:underline">{member.full_name}</Link></td><td className="px-6 py-4 text-slate-500">{families?.find((family) => family.id === member.family_id)?.family_name || "—"}<span className="block text-xs">{member.category || "Sem categoria"}</span></td><td className="px-6 py-4 text-slate-600">{member.phone || member.email || "—"}</td><td className="px-6 py-4">{member.status}</td></tr>)}</tbody>
          </table></div>
        ) : <p className="px-6 py-12 text-center text-sm text-slate-500">Ainda não existem membros registados.</p>}
      </section>
    </div>
  );
}
