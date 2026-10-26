export type ResultDetail = { label: string; value: string };

// Resultado de una accion del ViewModel; la pantalla decide como mostrarlo (dialogo de la app).
export type ActionResult = { ok: boolean; title: string; message: string; details?: ResultDetail[] };

export function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}
