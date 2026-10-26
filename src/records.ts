export type ApiRecord = Record<string, any>;

// Devuelve el primer valor no vacio entre varios nombres de campo posibles de la API.
export function pick(record: ApiRecord, ...keys: string[]) {
  for (const key of keys) {
    const value = record?.[key];
    if (value !== undefined && value !== null && value !== '') return value;
  }
  return undefined;
}

// Extrae la lista de registros de una respuesta, sea un arreglo directo o un objeto con la lista dentro.
export function records(payload: unknown, keys: string[]) {
  if (Array.isArray(payload)) return payload as ApiRecord[];
  const data = payload as ApiRecord;
  for (const key of keys) {
    if (Array.isArray(data?.[key])) return data[key] as ApiRecord[];
  }
  return [] as ApiRecord[];
}

export function toNumber(value: unknown, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}
