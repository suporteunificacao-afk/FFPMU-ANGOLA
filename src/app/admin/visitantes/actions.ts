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

export async function createVisitor(formData: FormData) {
  const { supabase, user, profile } = await context();
  const fullName = clean(formData.get("full_name"), 160);
  const firstVisitDate = clean(formData.get("first_visit_date"), 10);
  const email = clean(formData.get("email"), 254).toLowerCase();
  if (fullName.length < 2 || (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) || (firstVisitDate && !/^\d{4}-\d{2}-\d{2}$/.test(firstVisitDate))) {
    redirect("/admin/visitantes?error=invalid");
  }
  const { error } = await supabase.from("visitors").insert({
    church_id: profile.church_id, branch_id: profile.branch_id, created_by: user.id,
    full_name: fullName, phone: clean(formData.get("phone"), 40) || null,
    whatsapp: clean(formData.get("whatsapp"), 40) || null, email: email || null,
    address: clean(formData.get("address"), 500) || null,
    first_visit_date: firstVisitDate || new Date().toISOString().slice(0,10),
    invited_by: clean(formData.get("invited_by"), 160) || null,
    follow_up_notes: clean(formData.get("follow_up_notes"), 2000) || null,
  });
  if (error) redirect("/admin/visitantes?error=save");
  revalidatePath("/admin/visitantes");
  redirect("/admin/visitantes?created=1");
}

export async function recordVisitorVisit(formData: FormData) {
  const { supabase, user, profile } = await context();
  const visitorId = clean(formData.get("visitor_id"), 64);
  const activity = clean(formData.get("activity"), 160);
  const visitDate = clean(formData.get("visit_date"), 10);
  if (!visitorId || activity.length < 2 || !/^\d{4}-\d{2}-\d{2}$/.test(visitDate)) redirect("/admin/visitantes?error=invalid");
  const { data: visitor } = await supabase.from("visitors").select("id").eq("id", visitorId).eq("church_id", profile.church_id).maybeSingle();
  if (!visitor) redirect("/admin/visitantes?error=invalid");
  const { error } = await supabase.from("visitor_visits").insert({
    church_id: profile.church_id, visitor_id: visitorId, visit_date: visitDate,
    activity, notes: clean(formData.get("notes"), 2000) || null, recorded_by: user.id,
  });
  if (error) redirect("/admin/visitantes?error=save");
  await supabase.from("visitors").update({ status: "em_acompanhamento", updated_at: new Date().toISOString() })
    .eq("id", visitorId).eq("church_id", profile.church_id).neq("status", "integrado");
  revalidatePath("/admin/visitantes");
  redirect("/admin/visitantes?visit=1");
}

export async function updateVisitorFollowUp(formData: FormData) {
  const { supabase, profile } = await context();
  const visitorId = clean(formData.get("visitor_id"), 64);
  const status = clean(formData.get("status"), 32);
  if (!visitorId || !["novo","em_acompanhamento","integrado","sem_contacto"].includes(status)) redirect("/admin/visitantes?error=invalid");
  const { error } = await supabase.from("visitors").update({
    status, follow_up_notes: clean(formData.get("follow_up_notes"), 2000) || null,
    updated_at: new Date().toISOString(),
  }).eq("id", visitorId).eq("church_id", profile.church_id);
  if (error) redirect("/admin/visitantes?error=save");
  revalidatePath("/admin/visitantes");
  redirect("/admin/visitantes?updated=1");
}
