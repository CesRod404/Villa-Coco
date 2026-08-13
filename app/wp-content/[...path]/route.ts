const WORDPRESS_ORIGIN = (
  process.env.WORDPRESS_PROXY_ORIGIN ||
  process.env.WORDPRESS_API_URL ||
  process.env.NEXT_PUBLIC_WORDPRESS_URL ||
  "http://localhost:8881"
).replace(/\/+$/, "");

type MediaRouteContext = {
  params: Promise<{ path: string[] }>;
};

export async function GET(request: Request, context: MediaRouteContext) {
  const { path } = await context.params;
  const mediaPath = path.map(encodeURIComponent).join("/");
  const search = new URL(request.url).search;
  const upstream = await fetch(
    `${WORDPRESS_ORIGIN}/wp-content/${mediaPath}${search}`,
    {
      cache: "no-store",
      headers: { "ngrok-skip-browser-warning": "1" },
    },
  );

  const headers = new Headers();
  for (const name of [
    "accept-ranges",
    "cache-control",
    "content-length",
    "content-type",
    "etag",
    "last-modified",
  ]) {
    const value = upstream.headers.get(name);
    if (value) headers.set(name, value);
  }

  return new Response(upstream.body, {
    status: upstream.status,
    headers,
  });
}
