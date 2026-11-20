"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const path = "/admin/presencas";
const clean = (value: FormDataEntryValue | null, max = 500) => String(value ?? "").trim().slice(0, max);
const validStatuses = ["Presente", "Ausente", "Justificada"];

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

async function scopedRow(supabase: Awaited<ReturnType<typeof createClient>>, table: "church_services" | "members" | "visitors", id: string, churchId: string, branchId: string | null) {
  if (!supabase) return null;
  let query = supabase.from(table).select("id").eq("id", id).eq("church_id", churchId);
  query = branchId ? query.eq("branch_id", branchId) : query.is("branch_id", null);
  const { data } = await query.maybeSingle();
  return data;
}

export async function createAttendance(formData: FormData) {
  const { supabase, user, profile } = await context();
  const serviceId = clean(formData.get("service_id"), 64);
  const memberId = clean(formData.get("member_id"), 64);
  const visitorId = clean(formData.get("visitor_id"), 64);
  const guestName = clean(formData.get("guest_name"), 160) || null;
  const status = clean(formData.get("status"), 20);
  const notes = clean(formData.get("notes"), 1000) || null;
  const selected = [memberId, visitorId, guestName].filter(Boolean);
  if (!serviceId || selected.length !== 1 || !validStatuses.includes(status)) redirect(path + "?error=invalid");
  const service = await scopedRow(supabase, "church_services", serviceId, profile.church_id, profile.branch_id);
  if (!service) redirect(path + "?error=invalid");
  if (memberId && !await scopedRow(supabase, "members", memberId, profile.church_id, profile.branch_id)) redirect(path + "?error=invalid");
  if (visitorId && !await scopedRow(supabase, "visitors", visitorId, profile.church_id, profile.branch_id)) redirect(path + "?error=invalid");

  const { error } = await supabase.from("service_attendance").insert({
    church_id: profile.church_id,
    branch_id: profile.branch_id,
    service_id: serviceId,
    member_id: memberId || null,
    visitor_id: visitorId || null,
    guest_name: guestName,
    status,
    notes,
    marked_by: user.id,
  });
  if (error) redirect(path + "?service_id=" + serviceId + (error.code === "23505" ? "&error=duplicate" : "&error=save"));
  revalidatePath(path);
  redirect(path + "?service_id=" + serviceId + "&created=1");
}

export async function updateAttendance(formData: FormData) {
  const { supabase, profile } = await context();
  const id = clean(formData.get("attendance_id"), 64);
  const serviceId = clean(formData.get("service_id"), 64);
  const status = clean(formData.get("status"), 20);
  const notes = clean(formData.get("notes"), 1000) || null;
  if (!id || !serviceId || !validStatuses.includes(status)) redirect(path + "?error=invalid");
  let updateQuery = supabase.from("service_attendance")
    .update({ status, notes, marked_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", id).eq("service_id", serviceId).eq("church_id", profile.church_id);
  updateQuery = profile.branch_id ? updateQuery.eq("branch_id", profile.branch_id) : updateQuery.is("branch_id", null);
  const { data, error } = await updateQuery.select("id").maybeSingle();
  if (error || !data) redirect(path + "?service_id=" + serviceId + "&error=save");
  revalidatePath(path);
  redirect(path + "?service_id=" + serviceId + "&updated=1");
}

export async function deleteAttendance(formData: FormData) {
  const { supabase, profile } = await context();
  const id = clean(formData.get("attendance_id"), 64);
  const serviceId = clean(formData.get("service_id"), 64);
  if (!id || !serviceId) redirect(path + "?error=invalid");
  let deleteQuery = supabase.from("service_attendance").delete()
    .eq("id", id).eq("service_id", serviceId).eq("church_id", profile.church_id);
  deleteQuery = profile.branch_id ? deleteQuery.eq("branch_id", profile.branch_id) : deleteQuery.is("branch_id", null);
  const { data, error } = await deleteQuery.select("id").maybeSingle();
  if (error || !data) redirect(path + "?service_id=" + serviceId + "&error=save");
  revalidatePath(path);
  redirect(path + "?service_id=" + serviceId + "&deleted=1");
}
