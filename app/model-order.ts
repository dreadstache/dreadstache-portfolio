export type ModelOrderRecord = { id: string; uploadedAt: string };

export function applyModelOrder<T extends ModelOrderRecord>(models: T[], ids: string[]): T[] {
  const ranks = new Map(ids.map((id, index) => [id, index]));
  return [...models].sort((a, b) => {
    const left = ranks.get(a.id), right = ranks.get(b.id);
    if (left !== undefined && right !== undefined) return left - right;
    if (left !== undefined) return -1;
    if (right !== undefined) return 1;
    return b.uploadedAt.localeCompare(a.uploadedAt) || a.id.localeCompare(b.id);
  });
}

export function validModelOrder(ids: unknown, models: ModelOrderRecord[]): ids is string[] {
  if (!Array.isArray(ids) || ids.length !== models.length) return false;
  const existing = new Set(models.map(model => model.id));
  return new Set(ids).size === ids.length && ids.every(id => typeof id === "string" && existing.has(id));
}
