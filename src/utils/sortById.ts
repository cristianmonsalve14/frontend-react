/** Orden estable ascendente por id (1, 2, 3...) tras cargar o recargar listas. */
export function sortById<T extends { id: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.id - b.id);
}
