import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createMember } from "./actions";
import { MemberPhotoPicker } from "./photo-picker";

const fieldClass = "mt-1.5 w-full min-w-0 rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";
const labelClass = "block min-w-0 text-xs font-medium text-[#142b4a]";

function Field({ label, name, type = "text", required = false, placeholder = "", maxLength }: {
  label: string; name: string; type?: string; required?: boolean; placeholder?: string; maxLength?: number;
}) {
  return <label className={labelClass}>{label}{required && <span className="text-red-600"> *</span>}<input name={name} type={type} required={required} placeholder={placeholder} maxLength={maxLength} className={fieldClass} /></label>;
}

function SelectField({ label, name, options, required = false }: { label: string; name: string; options: string[]; required?: boolean }) {
  return <label className={labelClass}>{label}{required && <span className="text-red-600"> *</span>}<select name={name} required={required} defaultValue="" className={fieldClass}><option value="">Seleccione</option>{options.map(option => <option key={option} value={option}>{option}</option>)}</select></label>;
}

function Section({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return <section className={"rounded-lg border border-slate-200 bg-white p-4 sm:p-5 " + className}><h2 className="text-sm font-semibold text-[#102b55]">{title}</h2>{children}</section>;
}

function Seminar({ days }: { days: "2" | "7" | "21" | "40" }) {
  const key = days + "_days";
  return <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] items-center gap-x-3 gap-y-2 border-b border-slate-100 py-2.5 last:border-0 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
    <label className="flex min-w-0 items-center gap-2 text-xs text-[#142b4a]"><input type="checkbox" name={key + "_completed"} className="h-4 w-4 shrink-0 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />Seminário de {days} dias</label>
    <span className="hidden text-xs text-slate-500 sm:block">Data</span>
    <input name={key + "_date"} type="date" aria-label={"Data do seminário de " + days + " dias"} className={fieldClass + " col-start-2 row-start-1 sm:col-start-auto sm:row-auto"} />
    <input name={key + "_place"} placeholder="Lugar" aria-label={"Lugar do seminário de " + days + " dias"} className={fieldClass + " col-span-2 sm:col-span-3"} />
  </div>;
}

const languages = ["Português", "Francês", "Inglês", "Umbundu", "Kimbundu", "Kikongo", "Ibinda", "Cokwe", "Lingala"];

export default async function MembersPage({ searchParams }: {
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

  let membersQuery = supabase.from("members").select("id,member_code,full_name,phone,email,status,photo_path,created_at,family_id,category").order("created_at", { ascending: false }).limit(100);
  if (query) membersQuery = membersQuery.ilike("full_name", "%" + query + "%");
  if (statusFilter) membersQuery = membersQuery.eq("status", statusFilter);
  const { data: members, error } = await membersQuery;
  const { data: families } = await supabase.from("families").select("id,family_name");

  return <div className="mx-auto max-w-6xl space-y-5">
    <header className="flex flex-wrap items-center justify-between gap-3">
      <div><div className="text-xs text-slate-500"><Link href="/admin" className="hover:underline">Painel</Link><span className="mx-2">/</span><span>Membros</span><span className="mx-2">/</span><span>Novo membro</span></div><h1 className="mt-2 text-2xl font-semibold tracking-tight text-[#102b55]">Adicionar membro</h1><p className="mt-0.5 text-xs text-slate-500">Preencha os dados do novo membro da igreja.</p></div>
      <div className="flex gap-2"><Link href="/admin" className="rounded-md border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">Cancelar</Link><button form="new-member-form" className="rounded-md bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700">Guardar membro</button></div>
    </header>

    {params.created && <p role="status" className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">Membro registado com sucesso.</p>}
    {params.error && <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{params.error === "invalid" ? "Verifique os campos e as datas introduzidas." : params.error === "photo" ? "A fotografia deve ser JPG, PNG ou WEBP e ter no máximo 2 MB. Confirme também as permissões de armazenamento." : params.error === "family" ? "Não foi possível associar a família. Tente novamente." : "Não foi possível guardar. Confirme as permissões e tente novamente."}</p>}

    <form id="new-member-form" action={createMember} encType="multipart/form-data" className="space-y-3.5">
      <Section title="Dados pessoais">
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Nome completo" name="full_name" required maxLength={160} placeholder="Digite o nome completo" />
          <Field label="Filiação (Pai)" name="father_name" maxLength={160} placeholder="Nome do pai" />
          <Field label="Filiação (Mãe)" name="mother_name" maxLength={160} placeholder="Nome da mãe" />
          <Field label="Data de nascimento" name="birth_date" type="date" />
          <Field label="Naturalidade" name="naturality" maxLength={160} placeholder="Cidade ou local de nascimento" />
          <SelectField label="Nacionalidade" name="nationality" options={["Angolana", "Congolesa", "Namibiana", "Portuguesa", "Outra"]} />
          <Field label="Província" name="province" maxLength={120} placeholder="Província" />
          <Field label="Município" name="municipality" maxLength={120} placeholder="Município" />
          <Field label="Povoação" name="population" maxLength={160} placeholder="Digite a povoação" />
          <SelectField label="Estado civil" name="civil_status" options={["Solteiro(a)", "Casado(a)", "Divorciado(a)", "Viúvo(a)", "União de facto"]} />
          <Field label="Profissão" name="profession" maxLength={120} placeholder="Digite a profissão" />
          <Field label="Data de ingresso na igreja" name="joined_at" type="date" />
        </div>
        <div className="mt-4 grid gap-4 border-t border-slate-100 pt-4 sm:grid-cols-[150px_1fr]">
          <div className="flex flex-col items-center gap-2"><MemberPhotoPicker /><span className="text-[11px] text-slate-500">Fotografia do membro</span></div>
          <div className="grid content-start gap-3 sm:grid-cols-2"><Field label="Nome do cônjuge" name="spouse_name" maxLength={160} /><Field label="Filiação do cônjuge (Pai)" name="spouse_father_name" maxLength={160} /><Field label="Filiação do cônjuge (Mãe)" name="spouse_mother_name" maxLength={160} /><Field label="Pai/Mãe espiritual" name="spiritual_parent" maxLength={160} /></div>
        </div>
      </Section>

      <Section title="Contactos">
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><Field label="Telefone" name="phone" type="tel" maxLength={40} placeholder="Ex.: 912 345 678" /><Field label="Telefone alternativo / WhatsApp" name="whatsapp" type="tel" maxLength={40} placeholder="Ex.: 923 456 789" /><Field label="E-mail" name="email" type="email" maxLength={254} placeholder="Ex.: exemplo@email.com" /><Field label="Endereço" name="address" maxLength={500} placeholder="Rua, número, bairro, referência" /></div>
      </Section>

      <Section title="Família e categoria">
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3"><Field label="Família" name="family_name" required maxLength={160} placeholder="Nome do agregado familiar" /><Field label="Categoria" name="category" required maxLength={100} placeholder="Criança, Jovem, Adulto, Obreiro..." /><label className={labelClass}>Observações<textarea name="notes" rows={1} maxLength={5000} placeholder="Informações adicionais (opcional)" className={fieldClass} /></label></div>
      </Section>

      <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr]">
        <Section title="Percurso na igreja">
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3"><Field label="Data da bênção" name="blessing_date" type="date" /><Field label="Fundo da bênção" name="blessing_fund" maxLength={160} /><Field label="Centro local" name="local_center" maxLength={160} /><Field label="N.º de filhos da 2.ª geração" name="children_second_generation" type="number" /><Field label="Data de intronização como Cheonbo" name="intronization_date" type="date" /><Field label="Data de baptismo" name="baptized_at" type="date" /><Field label="Local da bênção" name="blessing_location" maxLength={160} /><Field label="Jejum" name="fasting" maxLength={160} /><Field label="Vida pública" name="public_life" maxLength={300} /><Field label="Local da vida pública" name="public_life_location" maxLength={160} /><Field label="Estado" name="status" placeholder=" " /></div>
        </Section>
        <Section title="Seminários realizados">
          <div className="mt-2"><Seminar days="2" /><Seminar days="7" /><Seminar days="21" /><Seminar days="40" /></div>
        </Section>
      </div>

      <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr]">
        <Section title="Línguas faladas">
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">{languages.map(language => <label key={language} className="flex items-center gap-2 text-xs text-[#142b55]"><input type="checkbox" name="languages" value={language} className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />{language}</label>)}<label className="flex items-center gap-2 text-xs text-[#142b55]"><input type="checkbox" name="other_language_enabled" className="h-4 w-4 rounded border-slate-300 text-blue-600" />Outras</label><input name="other_languages" placeholder="Especifique outras línguas" className={fieldClass + " col-span-2 sm:col-span-1"} /></div>
        </Section>
        <Section title="Observações adicionais"><textarea name="additional_notes" rows={4} maxLength={5000} placeholder="Outras informações relevantes sobre o membro (opcional)" className={fieldClass + " mt-3"} /></Section>
      </div>

      <div className="flex justify-end gap-2 border-t border-slate-200 pt-4"><Link href="/admin" className="rounded-md border border-slate-300 bg-white px-5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">Cancelar</Link><button className="rounded-md bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-blue-700">Guardar membro</button></div>
    </form>

    <Section title="Membros registados">
      <p className="mt-1 text-xs text-slate-500">Até 100 registos mais recentes visíveis para a sua conta.</p>
      <form method="get" className="mt-3 grid gap-3 sm:grid-cols-[1fr_200px_auto]"><input name="q" defaultValue={query} placeholder="Pesquisar pelo nome completo" maxLength={80} className={fieldClass} /><select name="status" defaultValue={statusFilter} className={fieldClass}><option value="">Todos os estados</option><option value="visitante">Visitante</option><option value="em_integracao">Em integração</option><option value="ativo">Activo</option><option value="inativo">Inactivo</option><option value="transferido">Transferido</option></select><button className="rounded-md border border-[#102b55] px-4 py-2 text-xs font-semibold text-[#102b55] hover:bg-slate-50">Pesquisar</button></form>
      {error ? <p className="py-8 text-center text-sm text-amber-900">Não foi possível carregar os membros.</p> : members && members.length ? <div className="mt-3 overflow-x-auto"><table className="w-full min-w-[680px] text-left text-sm"><thead className="bg-slate-50 text-xs text-slate-500"><tr><th className="px-4 py-3">Nome</th><th className="px-4 py-3">Família / Categoria</th><th className="px-4 py-3">Contacto</th><th className="px-4 py-3">Estado</th></tr></thead><tbody className="divide-y divide-slate-100">{members.map(member => <tr key={member.id}><td className="px-4 py-3 font-medium text-[#102b55]"><Link href={"/admin/membros/" + member.id} className="hover:underline">{member.full_name}</Link></td><td className="px-4 py-3 text-slate-600">{families?.find(family => family.id === member.family_id)?.family_name || "—"}<span className="block text-xs">{member.category || "Sem categoria"}</span></td><td className="px-4 py-3 text-slate-600">{member.phone || member.email || "—"}</td><td className="px-4 py-3 text-slate-600">{member.status}</td></tr>)}</tbody></table></div> : <p className="py-8 text-center text-sm text-slate-500">Ainda não existem membros registados.</p>}
    </Section>
  </div>;
}
