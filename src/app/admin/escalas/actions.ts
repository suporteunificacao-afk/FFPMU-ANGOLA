"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const path = "/admin/escalas";
type SupabaseClientType = NonNullable<Awaited<ReturnType<typeof createClient>>>;
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

async function validateLinks(supabase: SupabaseClientType, churchId: string, branchId: string | null, serviceId: string, memberId: string) {
  const [{ data: service }, { data: member }] = await Promise.all([
    supabase.from("church_services").select("id").eq("id", serviceId).eq("church_id", churchId).eq("branch_id", branchId).maybeSingle(),
    supabase.from("members").select("id").eq("id", memberId).eq("church_id", churchId).eq("branch_id", branchId).maybeSingle(),
  ]);
  return Boolean(service && member);
}

export async function createRosterAssignment(formData: FormData) {
  const { supabase, user, profile } = await context();
  const serviceId = clean(formData.get("service_id"), 64);
  const memberId = clean(formData.get("member_id"), 64);
  const positionTitle = clean(formData.get("position_title"), 120);
  const notes = clean(formData.get("notes"), 1000) || null;
  if (!serviceId || !memberId || positionTitle.length < 2) redirect(path + "?error=invalid");
  if (!await validateLinks(supabase, profile.church_id, profile.branch_id, serviceId, memberId)) redirect(path + "?error=invalid");
  const { data: last } = await supabase.from("service_roster_assignments").select("display_order")
    .eq("service_id", serviceId).eq("church_id", profile.church_id).order("display_order", { ascending: false }).limit(1).maybeSingle();
  const { error } = await supabase.from("service_roster_assignments").insert({
    church_id: profile.church_id, branch_id: profile.branch_id, service_id, member_id,
    position_title, notes, display_order: (last?.display_order ?? 0) + 1, created_by: user.id,
  });
  if (error) redirect(path + (error.code === "23505" ? "?error=duplicate" : "?error=save"));
  revalidatePath(path);
  redirect(path + "?created=1");
}

export async function updateRosterAssignment(formData: FormData) {
  const { supabase, profile } = await context();
  const id = clean(formData.get("assignment_id"), 64);
  const positionTitle = clean(formData.get("position_title"), 120);
  const notes = clean(formData.get("notes"), 1000) || null;
  if (!id || positionTitle.length < 2) redirect(path + "?error=invalid");
  const { data, error } = await supabase.from("service_roster_assignments")
    .update({ position_title: positionTitle, notes, updated_at: new Date().toISOString() })
    .eq("id", id).eq("church_id", profile.church_id).eq("branch_id", profile.branch_id).select("id").maybeSingle();
  if (error || !data) redirect(path + "?error=save");
  revalidatePath(path);
  redirect(path + "?updated=1");
}

export async function deleteRosterAssignment(formData: FormData) {
  const { supabase, profile } = await context();
  const id = clean(formData.get("assignment_id"), 64);
  if (!id) redirect(path + "?error=invalid");
  const { data, error } = await supabase.from("service_roster_assignments").delete()
    .eq("id", id).eq("church_id", profile.church_id).eq("branch_id", profile.branch_id).select("id").maybeSingle();
  if (error || !data) redirect(path + "?error=save");
  revalidatePath(path);
  redirect(path + "?deleted=1");
}
