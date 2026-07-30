import { SupabaseClient } from "@supabase/supabase-js";

export const STORAGE_BUCKET = "exotic-jetsky";

export async function subirArchivo(
  supabase: SupabaseClient,
  carpeta: string,
  file: File
): Promise<string> {
  const extension = file.name.split(".").pop();
  const path = `${carpeta}/${crypto.randomUUID()}.${extension}`;

  const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(path, file);
  if (error) throw error;

  const {
    data: { publicUrl },
  } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);

  return publicUrl;
}
