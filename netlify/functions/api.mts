import type { Context } from "@netlify/functions";

// Allowlist of path prefixes the front-end legitimately needs
const ALLOWED_PREFIXES = ["/courses", "/search"];

export default async (req: Request, context: Context) => {
  const API_KEY = (typeof Netlify !== "undefined" ? Netlify.env.get("GOLF_API_KEY") : null) || process.env.GOLF_API_KEY;
  if (!API_KEY) {
    return new Response(JSON.stringify({ error: "API key not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const url = new URL(req.url);
  const apiPath = url.pathname.replace(/^\/api/, "");

  if (!ALLOWED_PREFIXES.some(prefix => apiPath.startsWith(prefix))) {
    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

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
