"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function context() {
  const supabase = await createClient();
  if (!supabase) redirect("/login?setup=required");
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("church_id,is_active").eq("id", user.id).maybeSingle();
  if (!profile?.is_active || !profile.church_id) redirect("/setup");
  return { supabase, churchId: profile.church_id, userId: user.id };
}

export async function assignRole(formData: FormData) {
  const { supabase, churchId, userId } = await context();
  const targetUserId = String(formData.get("user_id") ?? "");
  const roleId = String(formData.get("role_id") ?? "");
  const scopeType = String(formData.get("scope_type") ?? "national");
  const scopeId = String(formData.get("scope_id") ?? "");
  if (!targetUserId || !roleId) redirect("/admin/utilizadores?error=invalid");

  const [{ data: target }, { data: role }] = await Promise.all([
    supabase.from("profiles").select("id").eq("id", targetUserId).eq("church_id", churchId).eq("is_active", true).maybeSingle(),
    supabase.from("roles").select("id,name").eq("id", roleId).eq("church_id", churchId).maybeSingle(),
  ]);
  if (!target || !role) redirect("/admin/utilizadores?error=invalid");
  if (role.name === "Administrador Nacional" && scopeType !== "national") redirect("/admin/utilizadores?error=scope");
  if (role.name === "Responsável Regional" && scopeType !== "region") redirect("/admin/utilizadores?error=scope");
  if (role.name === "Responsável Local" && !["community", "branch"].includes(scopeType)) redirect("/admin/utilizadores?error=scope");

  const payload: { user_id: string; role_id: string; church_id: string; assigned_by: string; region_id?: string; community_id?: string; branch_id?: string } = {
    user_id: targetUserId, role_id: roleId, church_id: churchId, assigned_by: userId,
  };

  if (scopeType === "region") {
    const { data } = await supabase.from("regions").select("id").eq("id", scopeId).eq("church_id", churchId).maybeSingle();
    if (!data) redirect("/admin/utilizadores?error=invalid");
    payload.region_id = scopeId;
  } else if (scopeType === "community") {
    const { data } = await supabase.from("communities").select("id").eq("id", scopeId).eq("church_id", churchId).maybeSingle();
    if (!data) redirect("/admin/utilizadores?error=invalid");
    payload.community_id = scopeId;
  } else if (scopeType === "branch") {
    const { data } = await supabase.from("branches").select("id").eq("id", scopeId).eq("church_id", churchId).maybeSingle();
    if (!data) redirect("/admin/utilizadores?error=invalid");
    payload.branch_id = scopeId;
  } else if (scopeType !== "national") {
    redirect("/admin/utilizadores?error=invalid");
  }

  const { data: existing } = await supabase.from("role_assignments").select("id")
    .eq("user_id", targetUserId).eq("role_id", roleId).eq("church_id", churchId)
    .is("region_id", payload.region_id ?? null)
    .is("community_id", payload.community_id ?? null)
    .is("branch_id", payload.branch_id ?? null).maybeSingle();
  if (existing) redirect("/admin/utilizadores?error=duplicate");

  const { error } = await supabase.from("role_assignments").insert(payload);
  if (error) redirect("/admin/utilizadores?error=save");
  revalidatePath("/admin/utilizadores");
  redirect("/admin/utilizadores?assigned=1");
}
