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

  if (!profile?.is_active) redirect("/login");
  if (!profile.church_id) redirect("/setup");

  const readText = (key: string) => {
    const value = formData.get(key);
    return typeof value === "string" ? value.trim() : "";
  };

  const fullName = readText("full_name").replace(/\s+/g, " ");
  const phone = readText("phone");
  const email = readText("email").toLowerCase();
  const status = readText("status") || "em_integracao";

  const allowedStatuses = ["visitante", "em_integracao", "ativo", "inativo", "transferido"];
  const validEmail = !email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  if (
    fullName.length < 3 ||
    fullName.length > 160 ||
    phone.length > 40 ||
    email.length > 254 ||
    !validEmail ||
    !allowedStatuses.includes(status)
  ) {
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
