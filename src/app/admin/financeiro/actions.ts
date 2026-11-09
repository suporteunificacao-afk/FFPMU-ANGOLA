"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const path = "/admin/financeiro";
const clean = (value: FormDataEntryValue | null, max = 500) => String(value ?? "").trim().slice(0, max);

async function context() {
  const supabase = await createClient();
  if (!supabase) redirect("/login?setup=required");
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("church_id,branch_id,is_active").eq("id", user.id).maybeSingle();
  if (!profile?.is_active) redirect("/login");
  if (!profile.church_id) redirect("/setup");
  const { data: assignments } = await supabase.from("role_assignments")
    .select("region_id,community_id,branch_id").eq("user_id", user.id)
    .eq("church_id", profile.church_id).limit(1);
  const scope = assignments?.[0] ?? { region_id: null, community_id: null, branch_id: profile.branch_id };
  return { supabase, user, profile, scope };
}

export async function createFinanceTransaction(formData: FormData) {
  const { supabase, user, profile, scope } = await context();
  const type = clean(formData.get("transaction_type"), 10);
  const category = clean(formData.get("category"), 100);
  const description = clean(formData.get("description"), 1000);
  const rawAmount = clean(formData.get("amount"), 30).replace(/\s/g, "").replace(",", ".");
  const amount = Number(rawAmount);
  const date = clean(formData.get("transaction_date"), 10);
  const method = clean(formData.get("payment_method"), 20);
  const reference = clean(formData.get("reference"), 160) || null;
  if (!["entrada", "saida"].includes(type) || category.length < 2 || description.length < 3 ||
      !Number.isFinite(amount) || amount <= 0 || amount > 999999999999 ||
      !/^\d{4}-\d{2}-\d{2}$/.test(date) || !["dinheiro","transferencia","deposito","multicaixa","outro"].includes(method)) {
    redirect(path + "?error=invalid");
  }
  const { error } = await supabase.from("finance_transactions").insert({
    church_id: profile.church_id, region_id: scope.region_id, community_id: scope.community_id,
    branch_id: scope.branch_id, transaction_type: type, category, description,
    amount: amount.toFixed(2), transaction_date: date, payment_method: method,
    reference, status: "confirmado", created_by: user.id,
  });
  if (error) redirect(path + "?error=save");
  revalidatePath(path);
  revalidatePath("/admin/relatorios");
  redirect(path + "?created=1");
}

export async function cancelFinanceTransaction(formData: FormData) {
  const { supabase, user, profile } = await context();
  const id = clean(formData.get("transaction_id"), 64);
  const reason = clean(formData.get("cancellation_reason"), 500);
  if (!id || reason.length < 5) redirect(path + "?error=reason");
  const { data, error } = await supabase.from("finance_transactions").update({
    status: "anulado", cancellation_reason: reason, cancelled_by: user.id,
    updated_at: new Date().toISOString(),
  }).eq("id", id).eq("church_id", profile.church_id).eq("status", "confirmado")
    .select("id").maybeSingle();
  if (error || !data) redirect(path + "?error=cancel");
  revalidatePath(path);
  revalidatePath("/admin/relatorios");
  redirect(path + "?cancelled=1");
}
