"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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

const clean = (value: FormDataEntryValue | null, max = 500) => String(value ?? "").trim().slice(0, max);
const listPath = "/admin/departamentos";
const detailPath = (id: string) => listPath + "/" + id;

export async function createDepartment(formData: FormData) {
  const { supabase, user, profile } = await context();
  const name = clean(formData.get("name"), 120);
  if (name.length < 2) redirect(listPath + "?error=invalid");
  const { error } = await supabase.from("departments").insert({
    church_id: profile.church_id, branch_id: profile.branch_id, created_by: user.id,
  });
  if (error) redirect(listPath + "?error=save");
  revalidatePath(listPath);
  redirect(listPath + "?created=1");
}

export async function updateDepartment(formData: FormData) {
  const { supabase, profile } = await context();
  const id = clean(formData.get("department_id"), 64);
  const name = clean(formData.get("name"), 120);
  const description = clean(formData.get("description"), 2000);
  const isActive = formData.get("is_active") === "on";
  if (!id || name.length < 2) redirect(listPath + "?error=invalid");
  const { data, error } = await supabase.from("departments").update({
    name, is_active: isActive, updated_at: new Date().toISOString(),
  }).eq("id", id).eq("church_id", profile.church_id).eq("branch_id", profile.branch_id).select("id").maybeSingle();
  if (error || !data) redirect(detailPath(id) + "?error=save");
  revalidatePath(listPath);
  revalidatePath(detailPath(id));
  redirect(detailPath(id) + "?updated=1");
}

export async function addDepartmentMember(formData: FormData) {
  const { supabase, profile } = await context();
  const departmentId = clean(formData.get("department_id"), 64);
  const displayName = clean(formData.get("display_name"), 160);
  const memberId = clean(formData.get("member_id"), 64) || null;
  const title = clean(formData.get("position_title"), 120);
  if (!departmentId || displayName.length < 2 || !title) redirect(detailPath(departmentId) + "?error=invalid");
  const [{ data: department }, { data: member }, { data: last }] = await Promise.all([
    supabase.from("departments").select("id").eq("id", departmentId).eq("church_id", profile.church_id).eq("branch_id", profile.branch_id).maybeSingle(),
    memberId ? supabase.from("members").select("id").eq("id", memberId).eq("church_id", profile.church_id).eq("branch_id", profile.branch_id).maybeSingle() : Promise.resolve({ data: null }),
    supabase.from("department_members").select("display_order").eq("department_id", departmentId).eq("church_id", profile.church_id).order("display_order", { ascending: false }).limit(1).maybeSingle(),
  ]);
  if (!department || (memberId && !member)) redirect(detailPath(departmentId) + "?error=invalid");
  const { error } = await supabase.from("department_members").insert({
    church_id: profile.church_id, department_id: departmentId, member_id: memberId,
    display_name: displayName, position_title: title, display_order: (last?.display_order ?? 0) + 1,
  });
  if (error) redirect(detailPath(departmentId) + "?error=member");
  revalidatePath(detailPath(departmentId));
  revalidatePath(listPath);
  redirect(detailPath(departmentId) + "?memberAdded=1");
}

export async function updateDepartmentPosition(formData: FormData) {
  const { supabase, profile } = await context();
  const departmentId = clean(formData.get("department_id"), 64);
  const positionId = clean(formData.get("position_id"), 64);
  const title = clean(formData.get("position_title"), 120);
  if (!departmentId || !positionId || !title) redirect(detailPath(departmentId) + "?error=invalid");
  const { error } = await supabase.from("department_members").update({
    position_title: title, updated_at: new Date().toISOString(),
  }).eq("id", positionId).eq("department_id", departmentId).eq("church_id", profile.church_id);
  if (error) redirect(detailPath(departmentId) + "?error=save");
  revalidatePath(detailPath(departmentId));
  redirect(detailPath(departmentId) + "?updated=1");
}

export async function moveDepartmentPosition(formData: FormData) {
  const { supabase, profile } = await context();
  const departmentId = clean(formData.get("department_id"), 64);
  const positionId = clean(formData.get("position_id"), 64);
  const direction = clean(formData.get("direction"), 4);
  if (!departmentId || !positionId || !["up", "down"].includes(direction)) redirect(detailPath(departmentId) + "?error=invalid");

  const { data: rows } = await supabase.from("department_members").select("id,display_order")
    .eq("department_id", departmentId).eq("church_id", profile.church_id).order("display_order", { ascending: true });
  const index = (rows ?? []).findIndex(row => row.id === positionId);
  const otherIndex = direction === "up" ? index - 1 : index + 1;
  if (index < 0 || otherIndex < 0 || otherIndex >= (rows ?? []).length) redirect(detailPath(departmentId));
  const current = rows![index];
  const other = rows![otherIndex];
  const temp = Math.max(...rows!.map(row => row.display_order), 0) + 1000;
  const first = await supabase.from("department_members").update({ display_order: temp }).eq("id", current.id).eq("church_id", profile.church_id);
  if (first.error) redirect(detailPath(departmentId) + "?error=order");
  const second = await supabase.from("department_members").update({ display_order: current.display_order }).eq("id", other.id).eq("church_id", profile.church_id);
  if (second.error) redirect(detailPath(departmentId) + "?error=order");
  const third = await supabase.from("department_members").update({ display_order: other.display_order }).eq("id", current.id).eq("church_id", profile.church_id);
  if (third.error) redirect(detailPath(departmentId) + "?error=order");
  revalidatePath(detailPath(departmentId));
  redirect(detailPath(departmentId) + "?ordered=1");
}

export async function removeDepartmentMember(formData: FormData) {
  const { supabase, profile } = await context();
  const departmentId = clean(formData.get("department_id"), 64);
  const positionId = clean(formData.get("position_id"), 64);
  if (!departmentId || !positionId) redirect(detailPath(departmentId) + "?error=invalid");
  const { error } = await supabase.from("department_members").delete()
    .eq("id", positionId).eq("department_id", departmentId).eq("church_id", profile.church_id);
  if (error) redirect(detailPath(departmentId) + "?error=save");
  revalidatePath(detailPath(departmentId));
  revalidatePath(listPath);
  redirect(detailPath(departmentId) + "?removed=1");
}
