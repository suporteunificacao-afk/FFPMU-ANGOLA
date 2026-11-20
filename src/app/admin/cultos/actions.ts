"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const path = "/admin/cultos";
const clean = (value: FormDataEntryValue | null, max = 500) => String(value ?? "").trim().slice(0, max);

async function context() {
  const supabase = await createClient();
  if (!supabase) redirect("/login?setup=required");
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("church_id,branch_id,is_active").eq("id", user.id).maybeSingle();
  if (!profile?.is_active) redirect("/login");
  if (!profile.church_id) redirect("/setup");
  return { supabase, user, profile };
}

function values(formData: FormData) {
  const title = clean(formData.get("title"), 160);
  const serviceType = clean(formData.get("service_type"), 80);
  const serviceDate = clean(formData.get("service_date"), 10);
  const startTime = clean(formData.get("start_time"), 5);
  const endTime = clean(formData.get("end_time"), 5) || null;
  const location = clean(formData.get("location"), 160) || null;
  const responsibleName = clean(formData.get("responsible_name"), 160) || null;
  const notes = clean(formData.get("notes"), 2000) || null;
  if (title.length < 2 || serviceType.length < 2 || !/^\d{4}-\d{2}-\d{2}$/.test(serviceDate) || !/^\d{2}:\d{2}$/.test(startTime)) return null;
  if (endTime && (!/^\d{2}:\d{2}$/.test(endTime) || endTime <= startTime)) return null;
  return { title, service_type: serviceType, service_date: serviceDate, start_time: startTime, end_time: endTime, location, responsible_name: responsibleName, notes };
}

export async function createChurchService(formData: FormData) {
  const { supabase, user, profile } = await context();
  const data = values(formData);
  if (!data) redirect(path + "?error=invalid");
  const { error } = await supabase.from("church_services").insert({
    ...data, church_id: profile.church_id, branch_id: profile.branch_id, created_by: user.id,
  });
  if (error) redirect(path + "?error=save");
  revalidatePath(path);
  redirect(path + "?created=1");
}

export async function updateChurchService(formData: FormData) {
  const { supabase, profile } = await context();
  const id = clean(formData.get("service_id"), 64);
  const data = values(formData);
  const status = clean(formData.get("status"), 20);
  if (!id || !data || !["Agendado", "Realizado", "Cancelado"].includes(status)) redirect(path + "?error=invalid");
  const { data: updated, error } = await supabase.from("church_services")
    .update({ ...data, status, updated_at: new Date().toISOString() })
    .eq("id", id).eq("church_id", profile.church_id).eq("branch_id", profile.branch_id)
    .select("id").maybeSingle();
  if (error || !updated) redirect(path + "?error=save");
  revalidatePath(path);
  redirect(path + "?updated=1");
}
