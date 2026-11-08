"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const path = "/admin/eventos";
const clean = (v: FormDataEntryValue | null, max = 500) => String(v ?? "").trim().slice(0, max);

async function context() {
  const supabase = await createClient();
  if (!supabase) redirect("/login?setup=required");
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("church_id,branch_id,is_active").eq("id", user.id).maybeSingle();
  if (!profile?.is_active) redirect("/login");
  if (!profile.church_id) redirect("/setup");
  const { data: assignments } = await supabase.from("role_assignments")
    .select("region_id,community_id,branch_id").eq("user_id", user.id).eq("church_id", profile.church_id).limit(1);
  const scope = assignments?.[0] ?? { region_id: null, community_id: null, branch_id: profile.branch_id };
  return { supabase, user, profile, scope };
}

function dateValue(v: string) {
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export async function createEvent(formData: FormData) {
  const { supabase, user, profile, scope } = await context();
  const title = clean(formData.get("title"), 180);
  const description = clean(formData.get("description"), 4000) || null;
  const eventType = clean(formData.get("event_type"), 80) || "Outro";
  const startsAt = dateValue(clean(formData.get("starts_at"), 30));
  const endsRaw = clean(formData.get("ends_at"), 30);
  const endsAt = endsRaw ? dateValue(endsRaw) : null;
  const location = clean(formData.get("location"), 180) || null;
  const capacityRaw = clean(formData.get("capacity"), 8);
  const capacity = capacityRaw ? Number(capacityRaw) : null;
  const isPublic = formData.get("is_public") === "on";
  const registrationRequired = formData.get("registration_required") === "on";
  if (title.length < 2 || !startsAt || (endsRaw && !endsAt) || (endsAt && endsAt <= startsAt) || (capacity !== null && (!Number.isInteger(capacity) || capacity < 1))) {
    redirect(path + "?error=invalid");
  }
  const { error } = await supabase.from("events").insert({
    church_id: profile.church_id, region_id: scope.region_id, community_id: scope.community_id,
    branch_id: scope.branch_id, title, description, event_type: eventType, starts_at: startsAt,
    ends_at: endsAt, location, capacity, is_public: isPublic,
    registration_required: registrationRequired, created_by: user.id,
  });
  if (error) redirect(path + "?error=save");
  revalidatePath(path);
  redirect(path + "?created=1");
}

export async function registerEventParticipant(formData: FormData) {
  const { supabase, user, profile } = await context();
  const eventId = clean(formData.get("event_id"), 64);
  const memberId = clean(formData.get("member_id"), 64) || null;
  const participantName = clean(formData.get("participant_name"), 180);
  const phone = clean(formData.get("phone"), 40) || null;
  const email = clean(formData.get("email"), 180) || null;
  const notes = clean(formData.get("notes"), 1000) || null;
  if (!eventId || (!memberId && participantName.length < 2)) redirect(path + "?error=invalid");
  let name = participantName;
  if (memberId) {
    const { data: member } = await supabase.from("members").select("full_name").eq("id", memberId).eq("church_id", profile.church_id).maybeSingle();
    if (!member) redirect(path + "?error=invalid");
    name = member.full_name;
  }
  const { data: event } = await supabase.from("events").select("id,capacity").eq("id", eventId).eq("church_id", profile.church_id).maybeSingle();
  if (!event) redirect(path + "?error=save");
  if (event.capacity) {
    const { count } = await supabase.from("event_registrations").select("id", { count: "exact", head: true }).eq("event_id", eventId).neq("status", "Cancelado");
    if ((count ?? 0) >= event.capacity) redirect(path + "?error=capacity");
  }
  const { error } = await supabase.from("event_registrations").insert({
    church_id: profile.church_id, event_id: eventId, member_id: memberId,
    participant_name: name, phone, email, notes, registered_by: user.id,
  });
  if (error) redirect(path + "?error=registration");
  revalidatePath(path);
  redirect(path + "?registered=1");
}

export async function updateEventStatus(formData: FormData) {
  const { supabase, profile } = await context();
  const eventId = clean(formData.get("event_id"), 64);
  const status = clean(formData.get("status"), 20);
  if (!eventId || !["Agendado", "Em curso", "Realizado", "Cancelado"].includes(status)) redirect(path + "?error=invalid");
  const { data, error } = await supabase.from("events").update({ status, updated_at: new Date().toISOString() })
    .eq("id", eventId).eq("church_id", profile.church_id).select("id").maybeSingle();
  if (error || !data) redirect(path + "?error=save");
  revalidatePath(path);
  redirect(path + "?updated=1");
}

export async function updateRegistrationStatus(formData: FormData) {
  const { supabase, profile } = await context();
  const registrationId = clean(formData.get("registration_id"), 64);
  const eventId = clean(formData.get("event_id"), 64);
  const status = clean(formData.get("status"), 20);
  if (!registrationId || !eventId || !["Inscrito", "Confirmado", "Presente", "Cancelado"].includes(status)) redirect(path + "?error=invalid");
  const { data, error } = await supabase.from("event_registrations")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", registrationId).eq("event_id", eventId).eq("church_id", profile.church_id).select("id").maybeSingle();
  if (error || !data) redirect(path + "?error=save");
  revalidatePath(path);
  redirect(path + "?updated=1");
}
