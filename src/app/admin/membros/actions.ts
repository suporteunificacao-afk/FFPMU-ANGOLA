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

  if (!profile?.is_active || !profile.church_id) redirect("/setup");

  const fullName = String(formData.get("full_name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const status = String(formData.get("status") ?? "em_integracao");

  const allowedStatuses = ["visitante", "em_integracao", "ativo", "inativo", "transferido"];
  if (fullName.length < 3 || !allowedStatuses.includes(status)) {
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
