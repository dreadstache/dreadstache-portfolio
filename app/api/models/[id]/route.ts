import { env } from "cloudflare:workers";
import { getChatGPTUser } from "../../../chatgpt-auth";

const OWNER_EMAIL = "lucmcote@gmail.com";

function validId(id: string) {
  return Boolean(id && !id.includes("/") && !id.includes(".."));
}

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!validId(id)) return new Response("Invalid model id", { status: 400 });

  const object = await env.MODELS.get(`models/${id}`);
  if (!object) return new Response("Model not found", { status: 404 });

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("cache-control", "public, max-age=3600");
  if (process.env.PUBLIC_MODEL_ACCESS === "enabled") {
    headers.set("access-control-allow-origin", "*");
  }
  headers.set("content-disposition", `inline; filename="${(object.customMetadata?.name || id).replace(/["\r\n]/g, "")}"`);
  return new Response(object.body, { headers });
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getChatGPTUser();
  if (user?.email.toLowerCase() !== OWNER_EMAIL) {
    return Response.json({ error: "Only the portfolio owner can remove models." }, { status: 403 });
  }

  const { id } = await context.params;
  if (!validId(id)) return Response.json({ error: "Invalid model id." }, { status: 400 });

  const key = `models/${id}`;
  if (!(await env.MODELS.head(key))) {
    return Response.json({ error: "That model is no longer in the library." }, { status: 404 });
  }

  await env.MODELS.delete(key);
  return Response.json({ removed: id });
}
