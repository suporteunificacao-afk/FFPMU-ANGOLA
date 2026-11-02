"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const allowedStatuses = ["visitante", "em_integracao", "ativo", "inativo", "transferido"];
const allowedLanguages = ["Português", "Francês", "Inglês", "Umbundu", "Kimbundu", "Kikongo", "Ibinda", "Cokwe", "Lingala"];

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function readDate(formData: FormData, key: string) {
  const value = readText(formData, key);
  if (!value) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const parsed = new Date(value + "T00:00:00.000Z");
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value ? value : undefined;
}

function photoFile(formData: FormData) {
  const value = formData.get("photo");
  if (!(value instanceof File) || value.size === 0) return null;
  if (value.size > 2 * 1024 * 1024) return undefined;
  if (!["image/jpeg", "image/png", "image/webp"].includes(value.type)) return undefined;
  return value;
}

function photoExtension(file: File) {
  return file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
}

type SupabaseServerClient = NonNullable<Awaited<ReturnType<typeof createClient>>>;

async function resolveFamily(supabase: SupabaseServerClient, churchId: string, branchId: string | null, userId: string, familyName: string) {
  if (!familyName) return null;
  const { data: existing } = await supabase.from("families").select("id").eq("church_id", churchId).eq("family_name", familyName).maybeSingle();
  if (existing) return existing.id;
  const { data: created, error } = await supabase.from("families")
    .insert({ church_id: churchId, branch_id: branchId, family_name: familyName, created_by: userId })
    .select("id").maybeSingle();
  if (created) return created.id;
  const { data: raced } = await supabase.from("families").select("id").eq("church_id", churchId).eq("family_name", familyName).maybeSingle();
  if (raced) return raced.id;
  throw new Error(error?.message ?? "Não foi possível associar a família.");
}

function buildMemberPayload(formData: FormData, familyId: string | null) {
  const fullName = readText(formData, "full_name").replace(/\s+/g, " ");
  const email = readText(formData, "email").toLowerCase();
  const status = readText(formData, "status") || "em_integracao";
  const dates = ["birth_date", "joined_at", "baptized_at", "seminar_2_days_date", "seminar_7_days_date", "seminar_21_days_date", "seminar_40_days_date", "blessing_date", "intronization_date"];
  const parsedDates = Object.fromEntries(dates.map((key) => [key, readDate(formData, key)]));
  const invalidDate = Object.values(parsedDates).some((value) => value === undefined);
  const languages = formData.getAll("languages").filter((value): value is string => typeof value === "string" && allowedLanguages.includes(value));
  const childrenCount = readText(formData, "children_second_generation");

  if (
    fullName.length < 3 || fullName.length > 160 ||
    email.length > 254 || (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) ||
    !allowedStatuses.includes(status) || invalidDate ||
    !readText(formData, "category") || readText(formData, "category").length > 100 ||
    !readText(formData, "family_name") || readText(formData, "family_name").length > 160 ||
    (childrenCount !== "" && (!/^\d+$/.test(childrenCount) || Number(childrenCount) > 1000))
  ) return null;

  const date = (key: string) => parsedDates[key] as string | null;
  const text = (key: string, max = 250) => {
    const value = readText(formData, key);
    return value.length <= max ? value || null : undefined;
  };
  const optionalFields = [
    ["phone", 40], ["whatsapp", 40], ["address", 500], ["gender", 40],
    ["father_name", 160], ["mother_name", 160], ["spouse_name", 160],
    ["spouse_father_name", 160], ["spouse_mother_name", 160], ["naturality", 160],
    ["province", 120], ["municipality", 120], ["population", 160],
    ["civil_status", 60], ["nationality", 100], ["profession", 120],
    ["spiritual_parent", 160], ["seminar_2_days_place", 160],
    ["seminar_7_days_place", 160], ["seminar_21_days_place", 160],
    ["seminar_40_days_place", 160], ["public_life", 300],
    ["public_life_location", 160], ["blessing_location", 160],
    ["blessing_fund", 160], ["fasting", 160], ["local_center", 160], ["notes", 5000],
  ] as const;
  const optionalValues = Object.fromEntries(optionalFields.map(([key, max]) => [key, text(key, max)]));
  if (Object.values(optionalValues).some((value) => value === undefined)) return null;

  return {
    full_name: fullName, gender: optionalValues.gender, birth_date: date("birth_date"),
    phone: optionalValues.phone, whatsapp: optionalValues.whatsapp, email: email || null,
    address: optionalValues.address, joined_at: date("joined_at"), baptized_at: date("baptized_at"),
    status, notes: optionalValues.notes, family_id: familyId, category: text("category", 100),
    father_name: optionalValues.father_name, mother_name: optionalValues.mother_name,
    spouse_name: optionalValues.spouse_name, spouse_father_name: optionalValues.spouse_father_name,
    spouse_mother_name: optionalValues.spouse_mother_name, naturality: optionalValues.naturality,
    province: optionalValues.province, municipality: optionalValues.municipality,
    population: optionalValues.population, civil_status: optionalValues.civil_status,
    nationality: optionalValues.nationality, profession: optionalValues.profession,
    spiritual_parent: optionalValues.spiritual_parent,
    seminar_2_days_completed: formData.get("seminar_2_days_completed") === "on",
    seminar_2_days_date: date("seminar_2_days_date"), seminar_2_days_place: optionalValues.seminar_2_days_place,
    seminar_7_days_completed: formData.get("seminar_7_days_completed") === "on",
    seminar_7_days_date: date("seminar_7_days_date"), seminar_7_days_place: optionalValues.seminar_7_days_place,
    seminar_21_days_completed: formData.get("seminar_21_days_completed") === "on",
    seminar_21_days_date: date("seminar_21_days_date"), seminar_21_days_place: optionalValues.seminar_21_days_place,
    seminar_40_days_completed: formData.get("seminar_40_days_completed") === "on",
    seminar_40_days_date: date("seminar_40_days_date"), seminar_40_days_place: optionalValues.seminar_40_days_place,
    public_life: optionalValues.public_life, public_life_location: optionalValues.public_life_location,
    blessing_date: date("blessing_date"), blessing_location: optionalValues.blessing_location,
    blessing_fund: optionalValues.blessing_fund, fasting: optionalValues.fasting,
    children_second_generation: childrenCount ? Number(childrenCount) : null,
    local_center: optionalValues.local_center, intronization_date: date("intronization_date"), languages,
  };
}

async function getActiveContext() {
  const supabase = await createClient();
  if (!supabase) redirect("/login?setup=required");
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("church_id,branch_id,is_active").eq("id", user.id).maybeSingle();
  if (!profile?.is_active) redirect("/login");
  if (!profile.church_id) redirect("/setup");
  return { supabase, user, profile };
}

export async function createMember(formData: FormData) {
  const { supabase, user, profile } = await getActiveContext();
  const file = photoFile(formData);
  if (file === undefined) redirect("/admin/membros?error=photo");
  const familyName = readText(formData, "family_name").replace(/\s+/g, " ");
  if (familyName.length > 160) redirect("/admin/membros?error=invalid");
  let familyId: string | null;
  try { familyId = await resolveFamily(supabase, profile.church_id!, profile.branch_id, user.id, familyName); }
  catch { redirect("/admin/membros?error=family"); }
  const payload = buildMemberPayload(formData, familyId);
  if (!payload) redirect("/admin/membros?error=invalid");

  const memberId = crypto.randomUUID();
  let photoPath: string | null = null;
  if (file) {
    photoPath = profile.church_id + "/" + memberId + "/profile." + photoExtension(file);
    const { error: uploadError } = await supabase.storage.from("member-photos").upload(photoPath, file, { contentType: file.type, cacheControl: "3600", upsert: false });
    if (uploadError) redirect("/admin/membros?error=photo");
  }
  const { error } = await supabase.from("members").insert({ id: memberId, church_id: profile.church_id, branch_id: profile.branch_id, created_by: user.id, photo_path: photoPath, ...payload });
  if (error) {
    if (photoPath) await supabase.storage.from("member-photos").remove([photoPath]);
    redirect("/admin/membros?error=save");
  }
  revalidatePath("/admin/membros");
  revalidatePath("/admin");
  redirect("/admin/membros?created=1");
}

export async function updateMember(formData: FormData) {
  const { supabase, user, profile } = await getActiveContext();
  const id = readText(formData, "member_id");
  if (!id) redirect("/admin/membros?error=invalid");
  const file = photoFile(formData);
  if (file === undefined) redirect("/admin/membros/" + encodeURIComponent(id) + "?error=photo");
  const familyName = readText(formData, "family_name").replace(/\s+/g, " ");
  if (familyName.length > 160) redirect("/admin/membros/" + encodeURIComponent(id) + "?error=invalid");
  let familyId: string | null;
  try { familyId = await resolveFamily(supabase, profile.church_id!, profile.branch_id, user.id, familyName); }
  catch { redirect("/admin/membros/" + encodeURIComponent(id) + "?error=family"); }
  const payload = buildMemberPayload(formData, familyId);
  if (!payload) redirect("/admin/membros/" + encodeURIComponent(id) + "?error=invalid");

  const { data: existing } = await supabase.from("members").select("id,photo_path").eq("id", id).eq("church_id", profile.church_id).maybeSingle();
  if (!existing) redirect("/admin/membros/" + encodeURIComponent(id) + "?error=save");

  let photoPath = existing.photo_path as string | null;
  let newPhotoPath: string | null = null;
  const removePhoto = readText(formData, "remove_photo") === "true";
  if (file) {
    newPhotoPath = profile.church_id + "/" + id + "/profile." + photoExtension(file);
    const { error: uploadError } = await supabase.storage.from("member-photos").upload(newPhotoPath, file, { contentType: file.type, cacheControl: "3600", upsert: true });
    if (uploadError) redirect("/admin/membros/" + encodeURIComponent(id) + "?error=photo");
    photoPath = newPhotoPath;
  } else if (removePhoto) {
    photoPath = null;
  }

  const { data: updatedMember, error } = await supabase.from("members")
    .update({ ...payload, photo_path: photoPath, updated_at: new Date().toISOString() })
    .eq("id", id).eq("church_id", profile.church_id).select("id").maybeSingle();
  if (error || !updatedMember) {
    if (newPhotoPath && newPhotoPath !== existing.photo_path) await supabase.storage.from("member-photos").remove([newPhotoPath]);
    redirect("/admin/membros/" + encodeURIComponent(id) + "?error=save");
  }
  if ((removePhoto || (newPhotoPath && existing.photo_path && existing.photo_path !== newPhotoPath)) && existing.photo_path) {
    await supabase.storage.from("member-photos").remove([existing.photo_path]);
  }

  revalidatePath("/admin/membros");
  revalidatePath("/admin/membros/" + id);
  revalidatePath("/admin");
  redirect("/admin/membros/" + id + "?updated=1");
}
