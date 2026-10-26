// Resultado de una accion del ViewModel; la pantalla decide como mostrarlo (por ejemplo con Alert).
export type ActionResult = { ok: boolean; title: string; message: string };

export function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}
