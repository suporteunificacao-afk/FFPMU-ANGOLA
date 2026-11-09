"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function getContext() {
  const supabase = await createClient();
  if (!supabase) redirect("/login?setup=required");
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("church_id,is_active").eq("id", user.id).maybeSingle();
  if (!profile?.is_active || !profile.church_id) redirect("/setup");
  return { supabase, churchId: profile.church_id };
}

export async function createRegion(formData: FormData) {
  const { supabase, churchId } = await getContext();
  const name = String(formData.get("name") ?? "").trim();
  const code = String(formData.get("code") ?? "").trim() || null;
  if (name.length < 2 || name.length > 120) redirect("/admin/organizacao?error=region");
  const { error } = await supabase.from("regions").insert({ church_id: churchId, name, code });
  if (error) redirect("/admin/organizacao?error=save");
  revalidatePath("/admin/organizacao");
  redirect("/admin/organizacao?created=region");
}

export async function createCommunity(formData: FormData) {
  const { supabase, churchId } = await getContext();
  const regionId = String(formData.get("region_id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const code = String(formData.get("code") ?? "").trim() || null;
  const address = String(formData.get("address") ?? "").trim() || null;
  if (!regionId || name.length < 2 || name.length > 120) redirect("/admin/organizacao?error=community");
  const { data: region } = await supabase.from("regions").select("id").eq("id", regionId).eq("church_id", churchId).maybeSingle();
  if (!region) redirect("/admin/organizacao?error=community");
  const { error } = await supabase.from("communities").insert({ church_id: churchId, region_id: regionId, name, code, address });
  if (error) redirect("/admin/organizacao?error=save");
  revalidatePath("/admin/organizacao");
  redirect("/admin/organizacao?created=community");
}

export async function setRegionActive(formData: FormData) {
  const { supabase, churchId } = await getContext();
  const id = String(formData.get("id") ?? "");
  const isActive = formData.get("is_active") === "true";
  const { error } = await supabase.from("regions").update({ is_active: isActive, updated_at: new Date().toISOString() }).eq("id", id).eq("church_id", churchId);
  if (error) redirect("/admin/organizacao?error=save");
  revalidatePath("/admin/organizacao");
  redirect("/admin/organizacao?updated=1");
}

export async function setCommunityActive(formData: FormData) {
  const { supabase, churchId } = await getContext();
  const id = String(formData.get("id") ?? "");
  const isActive = formData.get("is_active") === "true";
  const { error } = await supabase.from("communities").update({ is_active: isActive, updated_at: new Date().toISOString() }).eq("id", id).eq("church_id", churchId);
  if (error) redirect("/admin/organizacao?error=save");
  revalidatePath("/admin/organizacao");
  redirect("/admin/organizacao?updated=1");
}

export async function createLocalUnit(formData: FormData) {
  const { supabase, churchId } = await getContext();
  const communityId = String(formData.get("community_id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim() || null;
  if (!communityId || name.length < 2 || name.length > 120) redirect("/admin/organizacao?error=local");
  const { data: community } = await supabase.from("communities").select("id,region_id").eq("id", communityId).eq("church_id", churchId).maybeSingle();
  if (!community) redirect("/admin/organizacao?error=local");
  const { error } = await supabase.from("branches").insert({ church_id: churchId, region_id: community.region_id, community_id: community.id, name, address });
  if (error) redirect("/admin/organizacao?error=save");
  revalidatePath("/admin/organizacao");
  redirect("/admin/organizacao?created=local");
}

export async function attachLocalUnit(formData: FormData) {
  const { supabase, churchId } = await getContext();
  const branchId = String(formData.get("branch_id") ?? "");
  const communityId = String(formData.get("community_id") ?? "");
  const { data: community } = await supabase.from("communities").select("id,region_id").eq("id", communityId).eq("church_id", churchId).maybeSingle();
  if (!community) redirect("/admin/organizacao?error=local");
  const { error } = await supabase.from("branches").update({ community_id: community.id, region_id: community.region_id }).eq("id", branchId).eq("church_id", churchId);
  if (error) redirect("/admin/organizacao?error=save");
  revalidatePath("/admin/organizacao");
  redirect("/admin/organizacao?updated=1");
}
