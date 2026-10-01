export function moveToTarget<T extends { id: string }>(models: T[], sourceId: string, targetId: string) {
  const from = models.findIndex(model => model.id === sourceId);
  const to = models.findIndex(model => model.id === targetId);
  if (from < 0 || to < 0 || from === to) return models;
  const next = [...models];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}
export function validateUpload(file: { name: string; size: number }) {
  if (!/\.(glb|gltf)$/i.test(file.name)) return "Choose a GLB or GLTF file.";
  if (!file.size) return "This file is empty.";
  if (file.size > 100 * 1024 * 1024) return "This file exceeds the 100 MB limit.";
  return null;
}
export async function uploadSequentially<T>(files: T[], save: (file: T, index: number) => Promise<void>) {
  let succeeded = 0;
  for (let index = 0; index < files.length; index++) {
    try { await save(files[index], index); succeeded++; } catch { /* Keep the rest of the batch moving. */ }
  }
  return { succeeded, failed: files.length - succeeded };
}
