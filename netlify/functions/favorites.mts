import { getStore } from "@netlify/blobs";
import type { Context } from "@netlify/functions";

type FavoritesPayload = {
  ids: string[];
  data: Record<string, unknown>;
};

export default async (req: Request, context: Context) => {
  const userId = context.clientContext?.user?.sub;
  if (!userId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const store = getStore("favorites");
  const key = `user-${userId}`;

  if (req.method === "GET") {
    const value = await store.get(key, { type: "json" }).catch(() => null);
    return new Response(
      JSON.stringify(value ?? { ids: [], data: {} }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }

  if (req.method === "POST") {
    const body = (await req.json()) as FavoritesPayload;
    await store.setJSON(key, { ids: body.ids ?? [], data: body.data ?? {} });
    return new Response(
      JSON.stringify({ ok: true }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }

  return new Response(JSON.stringify({ error: "Method not allowed" }), {
    status: 405,
    headers: { "Content-Type": "application/json" },
  });
};

export const config = {
  path: "/favorites",
};
