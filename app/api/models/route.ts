import { env } from "cloudflare:workers";

const MAX_BYTES = 100 * 1024 * 1024;
const VALID_EXTENSIONS = new Set(["glb", "gltf"]);

export async function GET() {
  const listing = await env.MODELS.list({ prefix: "models/", limit: 100 });
  const models = listing.objects
    .map((object) => ({
      id: object.key.slice("models/".length),
      name: object.customMetadata?.name || object.key.slice("models/".length),
      size: object.size,
      uploadedAt: object.customMetadata?.uploadedAt || object.uploaded.toISOString(),
      url: `/api/models/${encodeURIComponent(object.key.slice("models/".length))}`,
    }))
    .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));

  return Response.json({ models });
}

export async function POST(request: Request) {
  const rawName = decodeURIComponent(request.headers.get("x-model-name") || "model.glb");
  const extension = rawName.split(".").pop()?.toLowerCase() || "";
  const declaredSize = Number(request.headers.get("content-length") || 0);

  if (!VALID_EXTENSIONS.has(extension)) {
    return Response.json({ error: "Only GLB and GLTF models are supported." }, { status: 415 });
  }
  if (!request.body) return Response.json({ error: "The model file is empty." }, { status: 400 });
  if (declaredSize > MAX_BYTES) return Response.json({ error: "Models must be 100 MB or smaller." }, { status: 413 });

  const safeBase = rawName.replace(/\.(glb|gltf)$/i, "").replace(/[^a-z0-9_-]+/gi, "-").replace(/^-|-$/g, "").slice(0, 60) || "model";
  const id = `${Date.now()}-${crypto.randomUUID()}-${safeBase}.${extension}`;
  const uploadedAt = new Date().toISOString();

  const object = await env.MODELS.put(`models/${id}`, request.body, {
    httpMetadata: { contentType: extension === "glb" ? "model/gltf-binary" : "model/gltf+json" },
    customMetadata: { name: rawName.slice(0, 160), uploadedAt },
  });

  return Response.json({
    model: { id, name: rawName, size: object.size, uploadedAt, url: `/api/models/${encodeURIComponent(id)}` },
  }, { status: 201 });
}
