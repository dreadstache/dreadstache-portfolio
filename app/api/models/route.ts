import { env } from "cloudflare:workers";
import { getChatGPTUser } from "../../chatgpt-auth";

const MAX_BYTES = 100 * 1024 * 1024;
const VALID_EXTENSIONS = new Set(["glb", "gltf"]);
const OWNER_EMAIL = "lucmcote@gmail.com";

function publicHeaders() {
  const headers: Record<string, string> = { "cache-control": "public, max-age=60" };
  if (process.env.PUBLIC_MODEL_ACCESS === "enabled") {
    headers["access-control-allow-origin"] = "*";
  }
  return headers;
}

async function isOwner() {
  const user = await getChatGPTUser();
  return user?.email.toLowerCase() === OWNER_EMAIL;
}

export async function GET() {
  const listing = await env.MODELS.list({ prefix: "models/", limit: 100, include: ["customMetadata"] });
  const models = listing.objects
    .map((object) => ({
      id: object.key.slice("models/".length),
      name: object.customMetadata?.name || object.key.slice("models/".length),
      size: object.size,
      uploadedAt: object.customMetadata?.uploadedAt || object.uploaded.toISOString(),
      url: `/api/models/${encodeURIComponent(object.key.slice("models/".length))}`,
    }))
    .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));

  return Response.json(
    { models, canImport: await isOwner() },
    { headers: publicHeaders() },
  );
}

export async function POST(request: Request) {
  if (!(await isOwner())) {
    return Response.json({ error: "Only the portfolio owner can import models." }, { status: 403 });
  }

  const rawName = decodeURIComponent(request.headers.get("x-model-name") || "model.glb");
  const extension = rawName.split(".").pop()?.toLowerCase() || "";
  const declaredSize = Number(request.headers.get("content-length") || 0);

  if (!VALID_EXTENSIONS.has(extension)) {
    return Response.json({ error: "Only GLB and GLTF models are supported." }, { status: 415 });
  }
  if (!request.body) return Response.json({ error: "The model file is empty." }, { status: 400 });
  if (declaredSize > MAX_BYTES) return Response.json({ error: "Models must be 100 MB or smaller." }, { status: 413 });

  const bytes = await request.arrayBuffer();
  if (!bytes.byteLength) return Response.json({ error: "The model file is empty." }, { status: 400 });
  if (bytes.byteLength > MAX_BYTES) return Response.json({ error: "Models must be 100 MB or smaller." }, { status: 413 });

  const safeBase = rawName.replace(/\.(glb|gltf)$/i, "").replace(/[^a-z0-9_-]+/gi, "-").replace(/^-|-$/g, "").slice(0, 60) || "model";
  const id = `${Date.now()}-${crypto.randomUUID()}-${safeBase}.${extension}`;
  const uploadedAt = new Date().toISOString();

  const object = await env.MODELS.put(`models/${id}`, bytes, {
    httpMetadata: { contentType: extension === "glb" ? "model/gltf-binary" : "model/gltf+json" },
    customMetadata: { name: rawName.slice(0, 160), uploadedAt },
  });

  return Response.json({
    model: { id, name: rawName, size: object.size, uploadedAt, url: `/api/models/${encodeURIComponent(id)}` },
  }, { status: 201 });
}
