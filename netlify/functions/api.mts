import type { Context } from "@netlify/functions";

export default async (req: Request, context: Context) => {
  const API_KEY = Netlify.env.get("GOLF_API_KEY");
  if (!API_KEY) {
    return new Response(JSON.stringify({ error: "API key not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const url = new URL(req.url);
  const apiPath = url.pathname.replace(/^\/api/, "");
  const targetUrl = `https://api.golfcourseapi.com/v1${apiPath}${url.search}`;

  const response = await fetch(targetUrl, {
    headers: {
      Authorization: `Key ${API_KEY}`,
      "Content-Type": "application/json",
    },
  });

  const body = await response.text();
  return new Response(body, {
    status: response.status,
    headers: { "Content-Type": "application/json" },
  });
};

export const config = {
  path: "/api/*",
};
