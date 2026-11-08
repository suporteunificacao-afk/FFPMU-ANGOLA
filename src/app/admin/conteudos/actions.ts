"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const adminPath = "/admin/conteudos";
const clean = (value: FormDataEntryValue | null, max = 4000) => String(value ?? "").trim().slice(0, max);
const slugify = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 170);

async function context() {
  const supabase = await createClient();
  if (!supabase) redirect("/login?setup=required");
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("church_id,is_active,branch_id").eq("id", user.id).maybeSingle();
  if (!profile?.is_active || !profile.church_id) redirect("/login");
  const { data: assignments } = await supabase.from("role_assignments").select("region_id,community_id,branch_id")
    .eq("user_id", user.id).eq("church_id", profile.church_id).limit(1);
  return { supabase, user, profile, scope: assignments?.[0] ?? { region_id: null, community_id: null, branch_id: profile.branch_id } };
}


const libraryMimeTypes = [
  "application/pdf", "image/jpeg", "image/png", "image/webp",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
];
const libraryExtensions: Record<string,string> = {
  "application/pdf":"pdf", "image/jpeg":"jpg", "image/png":"png", "image/webp":"webp",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":"docx",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":"xlsx",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation":"pptx",
};

export async function uploadLibraryFile(formData: FormData) {
  const { supabase, user, profile } = await context();
  const id = clean(formData.get("id"), 64);
  const file = formData.get("file");
  if (!id || !(file instanceof File) || file.size < 1 || file.size > 20 * 1024 * 1024 || !libraryMimeTypes.includes(file.type)) {
    redirect(adminPath + "?error=file");
  }
  const { data: item } = await supabase.from("public_content_items")
    .select("id,content_type,file_path").eq("id", id).eq("church_id", profile.church_id).maybeSingle();
  if (!item || item.content_type !== "biblioteca") redirect(adminPath + "?error=file");
  if (item.file_path) {
    const { error: removeError } = await supabase.storage.from("public-library").remove([item.file_path]);
    if (removeError) redirect(adminPath + "?error=file");
  }
  const path = profile.church_id + "/" + id + "/" + crypto.randomUUID() + "." + libraryExtensions[file.type];
  const { error: prepareError } = await supabase.from("public_content_items").update({
    file_path: path, file_name: file.name.slice(0, 255), file_mime_type: file.type, file_size: file.size,
    updated_by: user.id, updated_at: new Date().toISOString(),
  }).eq("id", id).eq("church_id", profile.church_id);
  if (prepareError) redirect(adminPath + "?error=file");
  const { error: uploadError } = await supabase.storage.from("public-library").upload(path, file, {
    contentType: file.type, cacheControl: "3600", upsert: false,
  });
  if (uploadError) {
    await supabase.from("public_content_items").update({file_path:null,file_name:null,file_mime_type:null,file_size:null})
      .eq("id", id).eq("church_id", profile.church_id);
    redirect(adminPath + "?error=file");
  }
  revalidatePath(adminPath);
  revalidatePath("/biblioteca");
  redirect(adminPath + "?fileUploaded=1");
}

export async function removeLibraryFile(formData: FormData) {
  const { supabase, user, profile } = await context();
  const id = clean(formData.get("id"), 64);
  const { data: item } = await supabase.from("public_content_items")
    .select("id,file_path").eq("id", id).eq("church_id", profile.church_id).maybeSingle();
  if (!item?.file_path) redirect(adminPath + "?error=file");
  const { error: removeError } = await supabase.storage.from("public-library").remove([item.file_path]);
  if (removeError) redirect(adminPath + "?error=file");
  const { error } = await supabase.from("public_content_items").update({
    file_path:null,file_name:null,file_mime_type:null,file_size:null,
    updated_by:user.id,updated_at:new Date().toISOString(),
  }).eq("id", id).eq("church_id", profile.church_id);
  if (error) redirect(adminPath + "?error=file");
  revalidatePath(adminPath);
  revalidatePath("/biblioteca");
  redirect(adminPath + "?fileRemoved=1");
}

export async function createPublicContent(formData: FormData) {
  const { supabase, user, profile, scope } = await context();
  const title = clean(formData.get("title"), 180);
  const contentType = clean(formData.get("content_type"), 20);
  const summary = clean(formData.get("summary"), 500) || null;
  const body = clean(formData.get("body"), 20000) || null;
  const category = clean(formData.get("category"), 80) || null;
  const externalUrl = clean(formData.get("external_url"), 1000) || null;
  const isPublic = formData.get("is_public") === "on";
  const status = clean(formData.get("status"), 20);
  if (title.length < 3 || !["noticia","comunicado","biblioteca"].includes(contentType) || !["Rascunho","Publicado"].includes(status) || (externalUrl && !/^https:\/\//i.test(externalUrl))) redirect(adminPath + "?error=invalid");
  const slug = slugify(title) + "-" + crypto.randomUUID().slice(0,8);
  const publishedAt = status === "Publicado" && isPublic ? new Date().toISOString() : null;
  const { error } = await supabase.from("public_content_items").insert({
    church_id: profile.church_id, region_id: scope.region_id, community_id: scope.community_id,
    branch_id: scope.branch_id, content_type: contentType, title, slug, summary, body, category,
    external_url: externalUrl, is_public: isPublic, status: publishedAt ? "Publicado" : "Rascunho",
    published_at: publishedAt, created_by: user.id, updated_by: user.id,
  });
  if (error) redirect(adminPath + "?error=save");
  revalidatePath(adminPath);
  revalidatePath("/noticias");
  revalidatePath("/biblioteca");
  redirect(adminPath + "?created=1");
}


export async function editPublicContent(formData: FormData) {
  const { supabase, user, profile } = await context();
  const id = clean(formData.get("id"), 64);
  const title = clean(formData.get("title"), 180);
  const contentType = clean(formData.get("content_type"), 20);
  const summary = clean(formData.get("summary"), 500) || null;
  const body = clean(formData.get("body"), 20000) || null;
  const category = clean(formData.get("category"), 80) || null;
  const externalUrl = clean(formData.get("external_url"), 1000) || null;
  if (!id || title.length < 3 || !["noticia","comunicado","biblioteca"].includes(contentType) || (externalUrl && !/^https:\/\//i.test(externalUrl))) redirect(adminPath + "?error=invalid");
  const { data: current, error: readError } = await supabase.from("public_content_items")
    .select("status,is_public,published_at").eq("id", id).eq("church_id", profile.church_id).maybeSingle();
  if (readError || !current) redirect(adminPath + "?error=save");
  const { error } = await supabase.from("public_content_items").update({
    title, content_type: contentType, summary, body, category, external_url: externalUrl,
    updated_by: user.id, updated_at: new Date().toISOString(),
  }).eq("id", id).eq("church_id", profile.church_id);
  if (error) redirect(adminPath + "?error=save");
  revalidatePath(adminPath);
  revalidatePath("/noticias");
  revalidatePath("/biblioteca");
  redirect(adminPath + "?edited=1");
}

export async function updatePublicContentStatus(formData: FormData) {
  const { supabase, user, profile } = await context();
  const id = clean(formData.get("id"), 64);
  const status = clean(formData.get("status"), 20);
  if (!id || !["Rascunho","Publicado","Arquivado"].includes(status)) redirect(adminPath + "?error=invalid");
  const isPublic = formData.get("is_public") === "on";
  if (status === "Publicado" && !isPublic) redirect(adminPath + "?error=visibility");
  const { data, error } = await supabase.from("public_content_items").update({
    status, is_public: isPublic, published_at: status === "Publicado" ? new Date().toISOString() : null,
    updated_by: user.id, updated_at: new Date().toISOString(),
  }).eq("id", id).eq("church_id", profile.church_id).select("id").maybeSingle();
  if (error || !data) redirect(adminPath + "?error=save");
  revalidatePath(adminPath);
  revalidatePath("/noticias");
  revalidatePath("/biblioteca");
  redirect(adminPath + "?updated=1");
}

export async function deletePublicContent(formData: FormData) {
  const { supabase, profile } = await context();
  const id = clean(formData.get("id"), 64);
  if (!id) redirect(adminPath + "?error=invalid");
  const { data, error } = await supabase.from("public_content_items").delete()
    .eq("id", id).eq("church_id", profile.church_id).select("id").maybeSingle();
  if (error || !data) redirect(adminPath + "?error=delete");
  revalidatePath(adminPath);
  revalidatePath("/noticias");
  revalidatePath("/biblioteca");
  redirect(adminPath + "?deleted=1");
}
