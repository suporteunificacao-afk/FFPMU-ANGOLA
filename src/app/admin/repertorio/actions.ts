"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const path = "/admin/repertorio";
const clean = (value: FormDataEntryValue | null, max = 2000) => String(value ?? "").trim().slice(0, max);

async function context() {
  const supabase = await createClient();
  if (!supabase) redirect("/login?setup=required");
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles")
    .select("church_id,branch_id,is_active").eq("id", user.id).maybeSingle();
  if (!profile?.is_active) redirect("/login");
  if (!profile.church_id) redirect("/setup");
  return { supabase, user, profile };
}

function songValues(formData: FormData) {
  const title = clean(formData.get("title"), 180);
  const artistOrComposer = clean(formData.get("artist_or_composer"), 180) || null;
  const originalKey = clean(formData.get("original_key"), 12) || null;
  const category = clean(formData.get("category"), 100) || null;
  const lyrics = clean(formData.get("lyrics"), 30000) || null;
  const referenceUrl = clean(formData.get("reference_url"), 1000) || null;
  const notes = clean(formData.get("notes"), 2000) || null;
  if (title.length < 2) return null;
  if (referenceUrl && !/^https:\/\//i.test(referenceUrl)) return null;
  if (lyrics && formData.get("lyrics_authorized") !== "on") return null;
  return {
    title, artist_or_composer: artistOrComposer, original_key: originalKey,
    category, lyrics, reference_url: referenceUrl, notes,
  };
}

async function validateService(supabase: Awaited<ReturnType<typeof createClient>>, churchId: string, branchId: string | null, serviceId: string) {
  if (!supabase) return false;
  let query = supabase.from("church_services").select("id").eq("id", serviceId).eq("church_id", churchId);
  query = branchId ? query.eq("branch_id", branchId) : query.is("branch_id", null);
  const { data } = await query.maybeSingle();
  return Boolean(data);
}

export async function createSong(formData: FormData) {
  const { supabase, user, profile } = await context();
  const data = songValues(formData);
  if (!data) redirect(path + "?error=invalid");
  const { error } = await supabase.from("songs").insert({
    ...data, church_id: profile.church_id, branch_id: profile.branch_id, created_by: user.id,
  });
  if (error) redirect(path + "?error=save");
  revalidatePath(path);
  redirect(path + "?songCreated=1");
}

export async function updateSong(formData: FormData) {
  const { supabase, profile } = await context();
  const id = clean(formData.get("song_id"), 64);
  const data = songValues(formData);
  if (!id || !data) redirect(path + "?error=invalid");
  const { data: updated, error } = await supabase.from("songs").update({
    ...data, updated_at: new Date().toISOString(),
  }).eq("id", id).eq("church_id", profile.church_id).eq("branch_id", profile.branch_id)
    .select("id").maybeSingle();
  if (error || !updated) redirect(path + "?error=save");
  revalidatePath(path);
  redirect(path + "?songUpdated=1");
}

export async function archiveSong(formData: FormData) {
  const { supabase, profile } = await context();
  const id = clean(formData.get("song_id"), 64);
  if (!id) redirect(path + "?error=invalid");
  const { data, error } = await supabase.from("songs").update({
    is_active: false, updated_at: new Date().toISOString(),
  }).eq("id", id).eq("church_id", profile.church_id).eq("branch_id", profile.branch_id)
    .select("id").maybeSingle();
  if (error || !data) redirect(path + "?error=save");
  revalidatePath(path);
  redirect(path + "?songArchived=1");
}

export async function createRepertoire(formData: FormData) {
  const { supabase, user, profile } = await context();
  const title = clean(formData.get("title"), 180);
  const serviceId = clean(formData.get("service_id"), 64) || null;
  const notes = clean(formData.get("notes"), 2000) || null;
  const isFavorite = formData.get("is_favorite") === "on";
  if (title.length < 2) redirect(path + "?error=invalid");
  if (serviceId && !await validateService(supabase, profile.church_id, profile.branch_id, serviceId)) {
    redirect(path + "?error=service");
  }
  const { error } = await supabase.from("repertoires").insert({
    church_id: profile.church_id, branch_id: profile.branch_id, service_id,
    title, notes, is_favorite: isFavorite, created_by: user.id,
  });
  if (error) redirect(path + "?error=save");
  revalidatePath(path);
  redirect(path + "?repertoireCreated=1");
}

export async function updateRepertoire(formData: FormData) {
  const { supabase, profile } = await context();
  const id = clean(formData.get("repertoire_id"), 64);
  const title = clean(formData.get("title"), 180);
  const serviceId = clean(formData.get("service_id"), 64) || null;
  const notes = clean(formData.get("notes"), 2000) || null;
  const isFavorite = formData.get("is_favorite") === "on";
  if (!id || title.length < 2) redirect(path + "?error=invalid");
  if (serviceId && !await validateService(supabase, profile.church_id, profile.branch_id, serviceId)) {
    redirect(path + "?error=service");
  }
  const { data, error } = await supabase.from("repertoires").update({
    title, service_id: serviceId, notes, is_favorite: isFavorite, updated_at: new Date().toISOString(),
  }).eq("id", id).eq("church_id", profile.church_id).eq("branch_id", profile.branch_id)
    .select("id").maybeSingle();
  if (error || !data) redirect(path + "?error=save");
  revalidatePath(path);
  redirect(path + "?repertoireUpdated=1");
}

export async function addSongToRepertoire(formData: FormData) {
  const { supabase, user, profile } = await context();
  const repertoireId = clean(formData.get("repertoire_id"), 64);
  const songId = clean(formData.get("song_id"), 64);
  const performedKey = clean(formData.get("performed_key"), 12) || null;
  const notes = clean(formData.get("notes"), 1000) || null;
  if (!repertoireId || !songId) redirect(path + "?error=invalid");
  const [{ data: repertoire }, { data: song }, { data: last }] = await Promise.all([
    supabase.from("repertoires").select("id").eq("id", repertoireId)
      .eq("church_id", profile.church_id).eq("branch_id", profile.branch_id).maybeSingle(),
    supabase.from("songs").select("id").eq("id", songId)
      .eq("church_id", profile.church_id).eq("branch_id", profile.branch_id).eq("is_active", true).maybeSingle(),
    supabase.from("repertoire_items").select("display_order").eq("repertoire_id", repertoireId)
      .eq("church_id", profile.church_id).order("display_order", { ascending: false }).limit(1).maybeSingle(),
  ]);
  if (!repertoire || !song) redirect(path + "?error=invalid");
  const { error } = await supabase.from("repertoire_items").insert({
    church_id: profile.church_id, branch_id: profile.branch_id, repertoire_id: repertoireId,
    song_id: songId, performed_key: performedKey, notes,
    display_order: (last?.display_order ?? 0) + 1, created_by: user.id,
  });
  if (error) redirect(path + (error.code === "23505" ? "?error=duplicate" : "?error=save"));
  revalidatePath(path);
  redirect(path + "?songAdded=1");
}

export async function updateRepertoireItem(formData: FormData) {
  const { supabase, profile } = await context();
  const itemId = clean(formData.get("item_id"), 64);
  const performedKey = clean(formData.get("performed_key"), 12) || null;
  const notes = clean(formData.get("notes"), 1000) || null;
  if (!itemId) redirect(path + "?error=invalid");
  const { data, error } = await supabase.from("repertoire_items").update({
    performed_key: performedKey, notes, updated_at: new Date().toISOString(),
  }).eq("id", itemId).eq("church_id", profile.church_id).eq("branch_id", profile.branch_id)
    .select("id").maybeSingle();
  if (error || !data) redirect(path + "?error=save");
  revalidatePath(path);
  redirect(path + "?itemUpdated=1");
}

export async function moveRepertoireItem(formData: FormData) {
  const { supabase, profile } = await context();
  const repertoireId = clean(formData.get("repertoire_id"), 64);
  const itemId = clean(formData.get("item_id"), 64);
  const direction = clean(formData.get("direction"), 4);
  if (!repertoireId || !itemId || !["up", "down"].includes(direction)) redirect(path + "?error=invalid");
  const { data: rows, error } = await supabase.from("repertoire_items")
    .select("id,display_order").eq("repertoire_id", repertoireId)
    .eq("church_id", profile.church_id).eq("branch_id", profile.branch_id)
    .order("display_order", { ascending: true });
  if (error || !rows) redirect(path + "?error=save");
  const index = rows.findIndex(row => row.id === itemId);
  const otherIndex = direction === "up" ? index - 1 : index + 1;
  if (index < 0 || otherIndex < 0 || otherIndex >= rows.length) redirect(path);
  const current = rows[index];
  const other = rows[otherIndex];
  const first = await supabase.from("repertoire_items").update({ display_order: other.display_order })
    .eq("id", current.id).eq("church_id", profile.church_id);
  const second = await supabase.from("repertoire_items").update({ display_order: current.display_order })
    .eq("id", other.id).eq("church_id", profile.church_id);
  if (first.error || second.error) redirect(path + "?error=order");
  revalidatePath(path);
  redirect(path + "?orderUpdated=1");
}

export async function removeSongFromRepertoire(formData: FormData) {
  const { supabase, profile } = await context();
  const itemId = clean(formData.get("item_id"), 64);
  if (!itemId) redirect(path + "?error=invalid");
  const { data, error } = await supabase.from("repertoire_items").delete()
    .eq("id", itemId).eq("church_id", profile.church_id).eq("branch_id", profile.branch_id)
    .select("id").maybeSingle();
  if (error || !data) redirect(path + "?error=save");
  revalidatePath(path);
  redirect(path + "?songRemoved=1");
}
