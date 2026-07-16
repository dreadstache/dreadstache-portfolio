import { env } from "cloudflare:workers";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!id || id.includes("/") || id.includes("..")) return new Response("Invalid model id", { status: 400 });

  const object = await env.MODELS.get(`models/${id}`);
  if (!object) return new Response("Model not found", { status: 404 });

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("cache-control", "public, max-age=3600");
  headers.set("content-disposition", `inline; filename="${(object.customMetadata?.name || id).replace(/["\r\n]/g, "")}"`);
  return new Response(object.body, { headers });
}
