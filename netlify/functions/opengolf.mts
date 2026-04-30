const ALLOWED_PREFIXES = ["/courses", "/search"];

export default async (req: Request) => {
  const url = new URL(req.url);
  const apiPath = url.pathname.replace(/^\/ogapi/, "");

  if (!ALLOWED_PREFIXES.some(prefix => apiPath.startsWith(prefix))) {
    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const targetUrl = `https://api.opengolfapi.org/v1${apiPath}${url.search}`;

  const response = await fetch(targetUrl);
  const body = await response.text();

  return new Response(body, {
    status: response.status,
    headers: { "Content-Type": "application/json" },
  });
};

export const config = {
  path: "/ogapi/*",
};
