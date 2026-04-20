export default async (req: Request) => {
  const url = new URL(req.url);
  const query = url.search;
  const targetUrl = `https://api.open-meteo.com/v1/forecast${query}`;

  const response = await fetch(targetUrl);
  const body = await response.text();

  return new Response(body, {
    status: response.status,
    headers: { "Content-Type": "application/json" },
  });
};

export const config = {
  path: "/weather",
};
