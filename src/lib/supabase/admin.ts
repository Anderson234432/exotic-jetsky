import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types";

// Cliente con la service_role key — ignora RLS por completo. Solo para uso
// en Route Handlers server-side (notificaciones por correo) que necesitan
// leer datos de cliente/renta sin una sesión de admin autenticada. Nunca
// importar esto desde código que se ejecute en el navegador: la variable
// SUPABASE_SERVICE_ROLE_KEY no lleva el prefijo NEXT_PUBLIC_ a propósito.
export function createServiceClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
