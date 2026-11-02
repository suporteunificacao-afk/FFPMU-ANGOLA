"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createMember(formData: FormData) {
  const supabase = await createClient();
  if (!supabase) redirect("/login?setup=required");

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("church_id,branch_id,is_active")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.is_active) redirect("/login");
  if (!profile.church_id) redirect("/setup");

  const readText = (key: string) => {
    const value = formData.get(key);
    return typeof value === "string" ? value.trim() : "";
  };

  const fullName = readText("full_name").replace(/\s+/g, " ");
  const phone = readText("phone");
  const email = readText("email").toLowerCase();
  const status = readText("status") || "em_integracao";

  const allowedStatuses = ["visitante", "em_integracao", "ativo", "inativo", "transferido"];
  const validEmail = !email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  if (
    fullName.length < 3 ||
    fullName.length > 160 ||
    phone.length > 40 ||
    email.length > 254 ||
    !validEmail ||
    !allowedStatuses.includes(status)
  ) {
    redirect("/admin/membros?error=invalid");
  }

  const { error } = await supabase.from("members").insert({
    church_id: profile.church_id,
    branch_id: profile.branch_id,
    created_by: user.id,
    full_name: fullName,
    phone: phone || null,
    email: email || null,
    status,
  });

  if (error) {
    // RLS continua a ser a autoridade final para a permissão members.create.
    redirect("/admin/membros?error=save");
  }

  revalidatePath("/admin/membros");
  revalidatePath("/admin");
  redirect("/admin/membros?created=1");
}

export async function updateMember(formData: FormData) {
  const supabase = await createClient();
  if (!supabase) redirect("/login?setup=required");

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("church_id,is_active")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.is_active) redirect("/login");
  if (!profile.church_id) redirect("/setup");

  const readText = (key: string) => {
    const value = formData.get(key);
    return typeof value === "string" ? value.trim() : "";
  };
  const id = readText("member_id");
  const fullName = readText("full_name").replace(/\\s+/g, " ");
  const gender = readText("gender");
  const birthDate = readText("birth_date");
  const phone = readText("phone");
  const whatsapp = readText("whatsapp");
  const email = readText("email").toLowerCase();
  const address = readText("address");
  const joinedAt = readText("joined_at");
  const baptizedAt = readText("baptized_at");
  const notes = readText("notes");
  const status = readText("status");

  const allowedStatuses = ["visitante", "em_integracao", "ativo", "inativo", "transferido"];
  const validEmail = !email || /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email);
  const validDate = (value: string) => {\n    if (!value) return true;\n    if (!/^\\d{4}-\\d{2}-\\d{2}$/.test(value)) return false;\n    const parsed = new Date(`${value}T00:00:00.000Z`);\n    return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;\n  };
  if (
    !id || fullName.length < 3 || fullName.length > 160 ||
    phone.length > 40 || whatsapp.length > 40 || email.length > 254 ||
    !validEmail || !allowedStatuses.includes(status) ||
    gender.length > 40 || address.length > 500 || notes.length > 5000 ||
    !validDate(birthDate) || !validDate(joinedAt) || !validDate(baptizedAt)
  ) {
    redirect(`/admin/membros/${encodeURIComponent(id)}?error=invalid`);
  }

  const { data: updatedMember, error } = await supabase.from("members").update({
    full_name: fullName,
    gender: gender || null,
    birth_date: birthDate || null,
    phone: phone || null,
    whatsapp: whatsapp || null,
    email: email || null,
    address: address || null,
    joined_at: joinedAt || null,
    baptized_at: baptizedAt || null,
    status,
    notes: notes || null,
    updated_at: new Date().toISOString(),
  }).eq("id", id).eq("church_id", profile.church_id);

  if (error) {
    redirect(`/admin/membros/${encodeURIComponent(id)}?error=save`);
  }

  revalidatePath("/admin/membros");
  revalidatePath(`/admin/membros/${id}`);
  revalidatePath("/admin");
  redirect(`/admin/membros/${id}?updated=1`);
}
