import { env } from "cloudflare:workers";
import { getChatGPTUser } from "../../chatgpt-auth";

import { applyModelOrder, validModelOrder } from "../../model-order";

const ORDER_KEY = "metadata/model-order.json";

const MAX_BYTES = 100 * 1024 * 1024;
const VALID_EXTENSIONS = new Set(["glb", "gltf"]);
const OWNER_EMAIL = "lucmcote@gmail.com";

function publicHeaders() {
  const headers: Record<string, string> = { "cache-control": "no-store" };
  if (process.env.PUBLIC_MODEL_ACCESS === "enabled") {
    headers["access-control-allow-origin"] = "*";
  }
  return headers;
}

async function isOwner() {
  const user = await getChatGPTUser();
  return user?.email.toLowerCase() === OWNER_EMAIL;
}

async function listModels() {
  let cursor: string | undefined;
  const objects = [];
  do {
    const listing = await env.MODELS.list({ prefix: "models/", limit: 1000, include: ["customMetadata"], cursor });
    objects.push(...listing.objects);
    cursor = listing.truncated ? listing.cursor : undefined;
  } while (cursor);
  return objects.map((object) => ({
    id: object.key.slice("models/".length),
    name: object.customMetadata?.name || object.key.slice("models/".length),
    size: object.size,
    uploadedAt: object.customMetadata?.uploadedAt || object.uploaded.toISOString(),
    url: `/api/models/${encodeURIComponent(object.key.slice("models/".length))}`,
  }));
}

async function readOrder() {
  const object = await env.MODELS.get(ORDER_KEY);
  const data = object ? await object.json<{ ids: string[] }>() : { ids: [] };
  return { ids: data.ids, revision: object?.etag || null };
}

export async function GET() {
  const [models, order, canImport] = await Promise.all([listModels(), readOrder(), isOwner()]);
  return Response.json({ models: applyModelOrder(models, order.ids), orderRevision: order.revision, canImport }, { headers: publicHeaders() });
}

export async function PATCH(request: Request) {
  if (!(await isOwner())) return Response.json({ error: "Only the portfolio owner can reorder models." }, { status: 403 });
  let data: { ids?: unknown; revision?: unknown };
  try { data = await request.json(); } catch { return Response.json({ error: "Invalid order request." }, { status: 400 }); }
  if (!data || typeof data !== "object") return Response.json({ error: "Invalid order request." }, { status: 400 });
  const [models, order] = await Promise.all([listModels(), readOrder()]);
  if (data.revision !== order.revision || !validModelOrder(data.ids, models)) {
    return Response.json({ error: "The collection changed. Reload the Studio before saving its order." }, { status: 409 });
  }
  const object = await env.MODELS.put(ORDER_KEY, JSON.stringify({ ids: data.ids }), {
    httpMetadata: { contentType: "application/json" },
    onlyIf: order.revision ? { etagMatches: order.revision } : { etagDoesNotMatch: "*" },
  });
  if (!object) return Response.json({ error: "Another order was saved. Reload the Studio before trying again." }, { status: 409 });
  return Response.json({ models: applyModelOrder(models, data.ids), orderRevision: object.etag }, { headers: { "cache-control": "no-store" } });
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

  const [models, order] = await Promise.all([listModels(), readOrder()]);
  return Response.json({
    models: applyModelOrder(models, order.ids), orderRevision: order.revision,
    model: { id, name: rawName, size: object.size, uploadedAt, url: `/api/models/${encodeURIComponent(id)}` },
  }, { status: 201 });
}
