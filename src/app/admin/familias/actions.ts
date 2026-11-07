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


export async function addFamilyHistoryRecord(formData: FormData) {
  const { supabase, user, profile } = await context();
  const familyId = String(formData.get("family_id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const type = String(formData.get("record_type") ?? "outro");
  const eventDate = String(formData.get("event_date") ?? "");
  const details = String(formData.get("details") ?? "").trim().slice(0, 3000);
  const memberId = String(formData.get("related_member_id") ?? "") || null;
  const allowed = ["nascimento","bencao","alteracao_familiar","acompanhamento","outro"];
  if (!familyId || title.length < 2 || title.length > 160 || !eventDate || !allowed.includes(type)) redirect("/admin/familias?error=invalid");
  if (memberId) {
    const { data: member } = await supabase.from("members").select("id").eq("id",memberId).eq("church_id",profile.church_id).eq("family_id",familyId).maybeSingle();
    if (!member) redirect("/admin/familias?error=invalid");
  }
  const { error } = await supabase.from("family_history_records").insert({church_id:profile.church_id,family_id:familyId,record_type:type,event_date:eventDate,title,details:details||null,related_member_id:memberId,created_by:user.id});
  if (error) redirect("/admin/familias?error=save");
  revalidatePath("/admin/familias");
  redirect("/admin/familias?historyAdded=1");
}

export async function removeFamilyHistoryRecord(formData: FormData) {
  const { supabase, profile } = await context();
  const recordId=String(formData.get("record_id")??""), familyId=String(formData.get("family_id")??"");
  if(!recordId||!familyId) redirect("/admin/familias?error=invalid");
  const {error,count}=await supabase.from("family_history_records").delete({count:"exact"}).eq("id",recordId).eq("family_id",familyId).eq("church_id",profile.church_id);
  if(error||count===0) redirect("/admin/familias?error=save");
  revalidatePath("/admin/familias");
  redirect("/admin/familias?historyRemoved=1");
}


export async function addFamilyDocument(formData: FormData) {
  const { supabase, user, profile } = await context();
  const familyId = String(formData.get("family_id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const value = formData.get("document");
  if (!familyId || title.length < 2 || title.length > 160 || !(value instanceof File) || value.size === 0 || value.size > 10 * 1024 * 1024) {
    redirect("/admin/familias?error=document");
  }
  const allowed = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
  if (!allowed.includes(value.type)) redirect("/admin/familias?error=document");
  const ext = value.type === "application/pdf" ? "pdf" : value.type === "image/png" ? "png" : value.type === "image/webp" ? "webp" : "jpg";
  const objectPath = profile.church_id + "/" + familyId + "/" + crypto.randomUUID() + "." + ext;
  const { error: uploadError } = await supabase.storage.from("family-documents").upload(objectPath, value, {
    contentType: value.type, cacheControl: "3600", upsert: false,
  });
  if (uploadError) redirect("/admin/familias?error=document");
  const { error } = await supabase.from("family_documents").insert({
    church_id: profile.church_id, family_id: familyId, title, object_path: objectPath,
    mime_type: value.type, file_size: value.size, created_by: user.id,
  });
  if (error) {
    await supabase.storage.from("family-documents").remove([objectPath]);
    redirect("/admin/familias?error=document");
  }
  revalidatePath("/admin/familias");
  redirect("/admin/familias?documentAdded=1");
}

export async function removeFamilyDocument(formData: FormData) {
  const { supabase, profile } = await context();
  const documentId = String(formData.get("document_id") ?? "");
  if (!documentId) redirect("/admin/familias?error=invalid");
  const { data: document } = await supabase.from("family_documents")
    .select("id,family_id,object_path").eq("id", documentId).eq("church_id", profile.church_id).maybeSingle();
  if (!document) redirect("/admin/familias?error=invalid");
  const { error: storageError } = await supabase.storage.from("family-documents").remove([document.object_path]);
  if (storageError) redirect("/admin/familias?error=document");
  const { error } = await supabase.from("family_documents").delete().eq("id", document.id).eq("church_id", profile.church_id);
  if (error) redirect("/admin/familias?error=document");
  revalidatePath("/admin/familias");
  redirect("/admin/familias?documentRemoved=1");
}
