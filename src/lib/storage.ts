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

function pathDesdeUrlPublica(url: string): string | null {
  const marcador = `/object/public/${STORAGE_BUCKET}/`;
  const indice = url.indexOf(marcador);
  if (indice === -1) return null;
  return decodeURIComponent(url.slice(indice + marcador.length));
}

// Borra varios archivos del bucket en una sola llamada. No lanza si falla —
// una foto que no se pudo borrar no debe abortar el resto del flujo que la
// invoca (p.ej. eliminar una renta igual debe seguir con el registro).
export async function borrarArchivos(
  supabase: SupabaseClient,
  urls: (string | null | undefined)[]
): Promise<void> {
  const paths = urls
    .filter((u): u is string => !!u)
    .map(pathDesdeUrlPublica)
    .filter((p): p is string => !!p);

  if (paths.length === 0) return;

  const { error } = await supabase.storage.from(STORAGE_BUCKET).remove(paths);
  if (error) console.error("borrarArchivos:", error);
}
