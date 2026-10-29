import { supabase } from "@/integrations/supabase/client";

const TEN_YEARS = 60 * 60 * 24 * 365 * 10;

/** Uploads an image to the private media bucket and returns a long-lived URL usable anywhere (site and e-mails). */
export async function uploadImage(folder: string, file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Choisissez une image (JPG, PNG, WEBP).");
  if (file.size > 5 * 1024 * 1024) throw new Error("Image trop lourde (5 Mo maximum).");
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("media").upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw new Error("Envoi de l'image impossible. Réessayez.");
  const { data, error: e2 } = await supabase.storage.from("media").createSignedUrl(path, TEN_YEARS);
  if (e2 || !data) throw new Error("Image envoyée mais lien indisponible.");
  return data.signedUrl;
}

/** Uploads a video from the device gallery to the media bucket and returns a long-lived URL. */
export async function uploadVideo(folder: string, file: File): Promise<string> {
  if (!file.type.startsWith("video/")) throw new Error("Choisissez une vidéo (MP4, MOV, WEBM).");
  if (file.size > 50 * 1024 * 1024) throw new Error("Vidéo trop lourde (50 Mo maximum).");
  const ext = (file.name.split(".").pop() || "mp4").toLowerCase().replace(/[^a-z0-9]/g, "");
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("media").upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw new Error("Envoi de la vidéo impossible. Réessayez.");
  const { data, error: e2 } = await supabase.storage.from("media").createSignedUrl(path, TEN_YEARS);
  if (e2 || !data) throw new Error("Vidéo envoyée mais lien indisponible.");
  return data.signedUrl;
}

export function isDirectVideo(url: string): boolean {
  return /\.(mp4|mov|webm|m4v|ogg)(\?|#|$)/i.test(url) || url.includes("/storage/v1/object/");
}
