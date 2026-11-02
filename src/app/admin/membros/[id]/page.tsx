import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateMember } from "../actions";
import { MemberPhotoPicker } from "../photo-picker";

const fieldClass = "mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-amber-600";
const labelClass = "block text-sm font-medium text-slate-700";

function Field({ label, name, value, type = "text", maxLength, required }: {
  label: string; name: string; value: string | number | null; type?: string; maxLength?: number; required?: boolean;
}) {
  return <label className={labelClass}>{label}<input name={name} type={type} defaultValue={value ?? ""} maxLength={maxLength} required={required} className={fieldClass} /></label>;
}

function Seminar({ days, completed, date, place }: { days: "2" | "7" | "21" | "40"; completed: boolean; date: string | null; place: string | null }) {
  const key = days + "_days";
  return (
    <div className="grid gap-3 rounded-lg border border-slate-200 p-3 sm:grid-cols-[180px_1fr_1fr] sm:items-end">
      <label className="flex items-center gap-2 text-sm font-medium text-slate-700"><input type="checkbox" name={key + "_completed"} defaultChecked={completed} className="h-4 w-4 rounded border-slate-300 text-amber-700" />Seminário de {days} dias realizado</label>
      <Field label="Data" name={key + "_date"} value={date} type="date" />
      <Field label="Lugar" name={key + "_place"} value={place} maxLength={160} />
    </div>
  );
}

const languages = ["Português", "Francês", "Inglês", "Umbundu", "Kimbundu", "Kikongo", "Ibinda", "Cokwe", "Lingala"];

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
  const { data: profile } = await supabase.from("profiles").select("church_id,is_active").eq("id", user.id).maybeSingle();
  if (!profile?.is_active) redirect("/login");
  if (!profile.church_id) redirect("/setup");

  const { data: member, error } = await supabase.from("members")
    .select("*").eq("id", id).maybeSingle();
  if (error) return <section className="rounded-xl border border-amber-200 bg-amber-50 p-6"><h1 className="text-xl font-semibold">Ficha indisponível</h1><p className="mt-2 text-sm">Não foi possível consultar este registo. Verifique as permissões de leitura.</p><Link href="/admin/membros" className="mt-4 inline-block underline">Voltar aos membros</Link></section>;
  if (!member) notFound();

  let familyName = "";
  if (member.family_id) {
    const { data: family } = await supabase.from("families").select("family_name").eq("id", member.family_id).maybeSingle();
    familyName = family?.family_name ?? "";
  }
  let photoUrl: string | null = null;
  if (member.photo_path) {
    const { data } = await supabase.storage.from("member-photos").createSignedUrl(member.photo_path, 3600);
    photoUrl = data?.signedUrl ?? null;
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Link href="/admin/membros" className="text-sm font-semibold text-amber-700 hover:underline">← Voltar aos membros</Link>
      <header className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><p className="text-sm font-medium text-amber-700">Ficha individual</p><h1 className="mt-1 text-3xl font-semibold text-[#142b4a]">{member.full_name}</h1><p className="mt-2 text-sm text-slate-500">Código: {member.member_code || "Ainda não atribuído"}</p></div>
          <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">{member.status}</span>
        </div>
      </header>

      {query.updated && <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">Dados do membro actualizados com sucesso.</p>}
      {query.error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{query.error === "invalid" ? "Existem campos inválidos. Reveja os dados e as datas." : query.error === "photo" ? "A fotografia deve ser JPG, PNG ou WEBP e ter no máximo 2 MB." : query.error === "family" ? "Não foi possível associar a família." : "Não foi possível actualizar. Confirme se tem a permissão members.update."}</p>}

      <form action={updateMember} className="space-y-5">
        <input type="hidden" name="member_id" value={member.id} />
        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="font-semibold text-[#142b4a]">Identificação e fotografia</h2>
          <div className="mt-5 grid gap-6 md:grid-cols-[170px_1fr]">
            <MemberPhotoPicker initialUrl={photoUrl} />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2"><Field label="Nome completo" name="full_name" value={member.full_name} maxLength={160} /></div>
              <Field label="Data de nascimento" name="birth_date" value={member.birth_date} type="date" />
              <label className={labelClass}>Género<select name="gender" defaultValue={member.gender ?? ""} className={fieldClass}><option value="">Seleccione</option><option value="Masculino">Masculino</option><option value="Feminino">Feminino</option><option value="Outro">Outro</option></select></label>
              <Field label="Filiação (Pai)" name="father_name" value={member.father_name} maxLength={160} />
              <Field label="Filiação (Mãe)" name="mother_name" value={member.mother_name} maxLength={160} />
              <Field label="Naturalidade" name="naturality" value={member.naturality} maxLength={160} />
              <Field label="Nacionalidade" name="nationality" value={member.nationality} maxLength={100} />
              <Field label="Província" name="province" value={member.province} maxLength={120} />
              <Field label="Município" name="municipality" value={member.municipality} maxLength={120} />
              <Field label="Povoação" name="population" value={member.population} maxLength={160} />
              <label className={labelClass}>Estado civil<select name="civil_status" defaultValue={member.civil_status ?? ""} className={fieldClass}><option value="">Seleccione</option><option>Solteiro(a)</option><option>Casado(a)</option><option>Divorciado(a)</option><option>Viúvo(a)</option><option>União de facto</option></select></label>
              <Field label="Profissão" name="profession" value={member.profession} maxLength={120} />
              <Field label="Pai/Mãe espiritual" name="spiritual_parent" value={member.spiritual_parent} maxLength={160} />
              <Field label="Data de ingresso na igreja" name="joined_at" value={member.joined_at} type="date" />
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="font-semibold text-[#142b4a]">Dados do cônjuge</h2>
          <p className="mt-1 text-xs text-slate-500">Preencha esta secção quando aplicável.</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <Field label="Nome do esposo(a)" name="spouse_name" value={member.spouse_name} maxLength={160} />
            <Field label="Filiação (Pai)" name="spouse_father_name" value={member.spouse_father_name} maxLength={160} />
            <Field label="Filiação (Mãe)" name="spouse_mother_name" value={member.spouse_mother_name} maxLength={160} />
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="font-semibold text-[#142b4a]">Contactos</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Telefone" name="phone" value={member.phone} maxLength={40} />
            <Field label="WhatsApp" name="whatsapp" value={member.whatsapp} maxLength={40} />
            <Field label="E-mail" name="email" value={member.email} type="email" maxLength={254} />
            <Field label="Morada" name="address" value={member.address} maxLength={500} />
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="font-semibold text-[#142b4a]">Família e categoria</h2>
          <p className="mt-1 text-xs text-slate-500">Use o mesmo nome de família para associar pais e filhos ao mesmo agregado familiar.</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Família" name="family_name" value={familyName} maxLength={160} required />
            <Field label="Categoria / grupo" name="category" value={member.category} maxLength={100} required />
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="font-semibold text-[#142b4a]">Percurso na igreja</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Data de baptismo" name="baptized_at" value={member.baptized_at} type="date" />
            <Field label="Data da bênção" name="blessing_date" value={member.blessing_date} type="date" />
            <Field label="Local da bênção" name="blessing_location" value={member.blessing_location} maxLength={160} />
            <Field label="Fundo da bênção" name="blessing_fund" value={member.blessing_fund} maxLength={160} />
            <Field label="Jejum" name="fasting" value={member.fasting} maxLength={160} />
            <Field label="Centro" name="local_center" value={member.local_center} maxLength={160} />
            <Field label="N.º de filhos da 2.ª geração" name="children_second_generation" value={member.children_second_generation} type="number" />
            <Field label="Data de intronização como Cheonbo" name="intronization_date" value={member.intronization_date} type="date" />
            <Field label="Vida pública" name="public_life" value={member.public_life} maxLength={300} />
            <Field label="Local da vida pública" name="public_life_location" value={member.public_life_location} maxLength={160} />
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="font-semibold text-[#142b4a]">Seminários realizados</h2>
          <p className="mt-1 text-xs text-slate-500">Assinale quando o seminário tiver sido concluído.</p>
          <div className="mt-4 space-y-3">
            <Seminar days="2" completed={member.seminar_2_days_completed} date={member.seminar_2_days_date} place={member.seminar_2_days_place} />
            <Seminar days="7" completed={member.seminar_7_days_completed} date={member.seminar_7_days_date} place={member.seminar_7_days_place} />
            <Seminar days="21" completed={member.seminar_21_days_completed} date={member.seminar_21_days_date} place={member.seminar_21_days_place} />
            <Seminar days="40" completed={member.seminar_40_days_completed} date={member.seminar_40_days_date} place={member.seminar_40_days_place} />
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="font-semibold text-[#142b4a]">Línguas faladas</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {languages.map((language) => <label key={language} className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" name="languages" value={language} defaultChecked={(member.languages ?? []).includes(language)} className="h-4 w-4 rounded border-slate-300 text-amber-700" />{language}</label>)}
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="font-semibold text-[#142b4a]">Estado e observações</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className={labelClass}>Estado<select name="status" defaultValue={member.status} className={fieldClass}><option value="visitante">Visitante</option><option value="em_integracao">Em integração</option><option value="ativo">Activo</option><option value="inativo">Inactivo</option><option value="transferido">Transferido</option></select></label>
            <label className={labelClass}>Observações<textarea name="notes" rows={3} maxLength={5000} defaultValue={member.notes ?? ""} className={fieldClass} /></label>
          </div>
        </section>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-slate-500">A gravação é autorizada pelas políticas RLS da igreja.</p>
          <button className="rounded-lg bg-[#142b4a] px-6 py-3 text-sm font-semibold text-white hover:bg-[#1d3c63]">Guardar alterações</button>
        </div>
      </form>
    </div>
  );
}
