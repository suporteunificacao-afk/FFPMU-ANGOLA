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
const listPath = "/admin/ministerios";
const detailPath = (id: string) => listPath + "/" + id;

export async function createMinistry(formData: FormData) {
  const { supabase, user, profile } = await context();
  const name = clean(formData.get("name"), 120);
  if (name.length < 2) redirect(listPath + "?error=invalid");
  const { error } = await supabase.from("ministrys").insert({
    name, church_id: profile.church_id, branch_id: profile.branch_id, created_by: user.id,
  });
  if (error) redirect(listPath + "?error=save");
  revalidatePath(listPath);
  redirect(listPath + "?created=1");
}

export async function updateMinistry(formData: FormData) {
  const { supabase, profile } = await context();
  const id = clean(formData.get("ministry_id"), 64);
  const name = clean(formData.get("name"), 120);
  const isActive = formData.get("is_active") === "on";
  if (!id || name.length < 2) redirect(listPath + "?error=invalid");
  const { data, error } = await supabase.from("ministrys").update({
    name, is_active: isActive, updated_at: new Date().toISOString(),
  }).eq("id", id).eq("church_id", profile.church_id).eq("branch_id", profile.branch_id).select("id").maybeSingle();
  if (error || !data) redirect(detailPath(id) + "?error=save");
  revalidatePath(listPath);
  revalidatePath(detailPath(id));
  redirect(detailPath(id) + "?updated=1");
}

export async function addMinistryMember(formData: FormData) {
  const { supabase, profile } = await context();
  const ministryId = clean(formData.get("ministry_id"), 64);
  const displayName = clean(formData.get("display_name"), 160);
  const memberId = clean(formData.get("member_id"), 64) || null;
  const title = clean(formData.get("position_title"), 120);
  if (!ministryId || displayName.length < 2 || !title) redirect(detailPath(ministryId) + "?error=invalid");
  const [{ data: ministry }, { data: member }, { data: last }] = await Promise.all([
    supabase.from("ministrys").select("id").eq("id", ministryId).eq("church_id", profile.church_id).eq("branch_id", profile.branch_id).maybeSingle(),
    memberId ? supabase.from("members").select("id").eq("id", memberId).eq("church_id", profile.church_id).eq("branch_id", profile.branch_id).maybeSingle() : Promise.resolve({ data: null }),
    supabase.from("ministry_members").select("display_order").eq("ministry_id", ministryId).eq("church_id", profile.church_id).order("display_order", { ascending: false }).limit(1).maybeSingle(),
  ]);
  if (!ministry || (memberId && !member)) redirect(detailPath(ministryId) + "?error=invalid");
  const { error } = await supabase.from("ministry_members").insert({
    church_id: profile.church_id, ministry_id: ministryId, member_id: memberId,
    display_name: displayName, position_title: title, display_order: (last?.display_order ?? 0) + 1,
  });
  if (error) redirect(detailPath(ministryId) + "?error=member");
  revalidatePath(detailPath(ministryId));
  revalidatePath(listPath);
  redirect(detailPath(ministryId) + "?memberAdded=1");
}

export async function updateMinistryPosition(formData: FormData) {
  const { supabase, profile } = await context();
  const ministryId = clean(formData.get("ministry_id"), 64);
  const positionId = clean(formData.get("position_id"), 64);
  const title = clean(formData.get("position_title"), 120);
  if (!ministryId || !positionId || !title) redirect(detailPath(ministryId) + "?error=invalid");
  const { error } = await supabase.from("ministry_members").update({
    position_title: title, updated_at: new Date().toISOString(),
  }).eq("id", positionId).eq("ministry_id", ministryId).eq("church_id", profile.church_id);
  if (error) redirect(detailPath(ministryId) + "?error=save");
  revalidatePath(detailPath(ministryId));
  redirect(detailPath(ministryId) + "?updated=1");
}

export async function moveMinistryPosition(formData: FormData) {
  const { supabase, profile } = await context();
  const ministryId = clean(formData.get("ministry_id"), 64);
  const positionId = clean(formData.get("position_id"), 64);
  const direction = clean(formData.get("direction"), 4);
  if (!ministryId || !positionId || !["up", "down"].includes(direction)) redirect(detailPath(ministryId) + "?error=invalid");

  const { data: rows } = await supabase.from("ministry_members").select("id,display_order")
    .eq("ministry_id", ministryId).eq("church_id", profile.church_id).order("display_order", { ascending: true });
  const index = (rows ?? []).findIndex(row => row.id === positionId);
  const otherIndex = direction === "up" ? index - 1 : index + 1;
  if (index < 0 || otherIndex < 0 || otherIndex >= (rows ?? []).length) redirect(detailPath(ministryId));
  const current = rows![index];
  const other = rows![otherIndex];
  const temp = Math.max(...rows!.map(row => row.display_order), 0) + 1000;
  const first = await supabase.from("ministry_members").update({ display_order: temp }).eq("id", current.id).eq("church_id", profile.church_id);
  if (first.error) redirect(detailPath(ministryId) + "?error=order");
  const second = await supabase.from("ministry_members").update({ display_order: current.display_order }).eq("id", other.id).eq("church_id", profile.church_id);
  if (second.error) redirect(detailPath(ministryId) + "?error=order");
  const third = await supabase.from("ministry_members").update({ display_order: other.display_order }).eq("id", current.id).eq("church_id", profile.church_id);
  if (third.error) redirect(detailPath(ministryId) + "?error=order");
  revalidatePath(detailPath(ministryId));
  redirect(detailPath(ministryId) + "?ordered=1");
}

export async function removeMinistryMember(formData: FormData) {
  const { supabase, profile } = await context();
  const ministryId = clean(formData.get("ministry_id"), 64);
  const positionId = clean(formData.get("position_id"), 64);
  if (!ministryId || !positionId) redirect(detailPath(ministryId) + "?error=invalid");
  const { error } = await supabase.from("ministry_members").delete()
    .eq("id", positionId).eq("ministry_id", ministryId).eq("church_id", profile.church_id);
  if (error) redirect(detailPath(ministryId) + "?error=save");
  revalidatePath(detailPath(ministryId));
  revalidatePath(listPath);
  redirect(detailPath(ministryId) + "?removed=1");
}
