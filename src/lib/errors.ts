export function mensajeError(error: unknown, fallback = "Ocurrió un error inesperado."): string {
  if (error instanceof Error) {
    const hint = (error as { hint?: unknown }).hint;
    return typeof hint === "string" && hint ? `${error.message} (${hint})` : error.message;
  }
  return fallback;
}
