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

export async function createFamily(formData: FormData) {
  const { supabase, user, profile } = await context();
  const familyName = String(formData.get("family_name") ?? "").trim().replace(/\\s+/g, " ");
  if (familyName.length < 2 || familyName.length > 160) redirect("/admin/familias?error=invalid");
  const { error } = await supabase.from("families").insert({
    church_id: profile.church_id, branch_id: profile.branch_id,
    family_name: familyName, created_by: user.id,
  });
  if (error) redirect("/admin/familias?error=save");
  revalidatePath("/admin/familias");
  redirect("/admin/familias?created=1");
}

export async function setFamilyResponsible(formData: FormData) {
  const { supabase, profile } = await context();
  const familyId = String(formData.get("family_id") ?? "");
  const memberId = String(formData.get("responsible_member_id") ?? "");
  if (!familyId || !memberId) redirect("/admin/familias?error=invalid");
  const { data: member } = await supabase.from("members").select("id").eq("id", memberId).eq("church_id", profile.church_id).maybeSingle();
  if (!member) redirect("/admin/familias?error=invalid");
  const { error } = await supabase.from("families").update({ responsible_member_id: memberId })
    .eq("id", familyId).eq("church_id", profile.church_id);
  if (error) redirect("/admin/familias?error=save");
  revalidatePath("/admin/familias");
  redirect("/admin/familias?updated=1");
}


export async function removeMemberFromFamily(formData: FormData) {
  const { supabase, profile } = await context();
  const familyId = String(formData.get("family_id") ?? "");
  const memberId = String(formData.get("member_id") ?? "");
  if (!familyId || !memberId || formData.get("confirm_remove") !== "on") {
    redirect("/admin/familias?error=invalid");
  }

  const { data: member } = await supabase.from("members")
    .select("id,family_id")
    .eq("id", memberId)
    .eq("church_id", profile.church_id)
    .eq("family_id", familyId)
    .maybeSingle();
  if (!member) redirect("/admin/familias?error=invalid");

  const { data: updated, error } = await supabase.from("members")
    .update({ family_id: null, updated_at: new Date().toISOString() })
    .eq("id", memberId)
    .eq("church_id", profile.church_id)
    .eq("family_id", familyId)
    .select("id")
    .maybeSingle();
  if (error || !updated) redirect("/admin/familias?error=save");

  await supabase.from("families")
    .update({ responsible_member_id: null })
    .eq("id", familyId)
    .eq("church_id", profile.church_id)
    .eq("responsible_member_id", memberId);

  revalidatePath("/admin/familias");
  revalidatePath("/admin/membros");
  revalidatePath("/admin/membros/" + memberId);
  redirect("/admin/familias?removed=1");
}


export async function addFamilyRelationship(formData: FormData) {
  const { supabase, user, profile } = await context();
  const familyId = String(formData.get("family_id") ?? "");
  const memberId = String(formData.get("member_id") ?? "");
  const relatedMemberId = String(formData.get("related_member_id") ?? "");
  const relationshipType = String(formData.get("relationship_type") ?? "");
  const notes = String(formData.get("notes") ?? "").trim().slice(0, 300);
  const allowed = ["conjuge","pai","mae","filho","filha","tutor","irmao","irma","avo","neto","outro"];
  if (!familyId || !memberId || !relatedMemberId || memberId === relatedMemberId || !allowed.includes(relationshipType)) {
    redirect("/admin/familias?error=invalid");
  }
  const { data: people } = await supabase.from("members").select("id,family_id").eq("church_id", profile.church_id).in("id", [memberId, relatedMemberId]);
  if (!people || people.length !== 2 || people.some(person => person.family_id !== familyId)) redirect("/admin/familias?error=invalid");
  const { error } = await supabase.from("family_relationships").insert({
    church_id: profile.church_id, family_id: familyId, member_id: memberId,
    related_member_id: relatedMemberId, relationship_type: relationshipType,
    notes: notes || null, created_by: user.id,
  });
  if (error) redirect("/admin/familias?error=save");
  revalidatePath("/admin/familias");
  redirect("/admin/familias?relationAdded=1");
}

export async function removeFamilyRelationship(formData: FormData) {
  const { supabase, profile } = await context();
  const relationshipId = String(formData.get("relationship_id") ?? "");
  const familyId = String(formData.get("family_id") ?? "");
  if (!relationshipId || !familyId) redirect("/admin/familias?error=invalid");
  const { error, count } = await supabase.from("family_relationships").delete({ count: "exact" })
    .eq("id", relationshipId).eq("family_id", familyId).eq("church_id", profile.church_id);
  if (error || count === 0) redirect("/admin/familias?error=save");
  revalidatePath("/admin/familias");
  redirect("/admin/familias?relationRemoved=1");
}
