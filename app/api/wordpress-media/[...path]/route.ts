const WORDPRESS_ORIGINS = Array.from(
  new Set(
    [
      process.env.WORDPRESS_PROXY_ORIGIN,
      process.env.WORDPRESS_API_URL,
      process.env.WORDPRESS_PUBLIC_URL,
      process.env.NEXT_PUBLIC_WORDPRESS_URL,
      "http://localhost:8881",
    ]
      .filter((origin): origin is string => Boolean(origin))
      .map((origin) => origin.replace(/\/+$/, "")),
  ),
);

type MediaRouteContext = {
  params: Promise<{ path: string[] }>;
};

function mediaResponse(upstream: Response) {
  const headers = new Headers();

  for (const name of [
    "accept-ranges",
    "content-length",
    "content-type",
    "etag",
    "last-modified",
  ]) {
    const value = upstream.headers.get(name);
    if (value) headers.set(name, value);
  }

  headers.set(
    "cache-control",
    upstream.headers.get("cache-control") ||
      "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
  );

  return new Response(upstream.body, {
    status: upstream.status,
    headers,
  });
}

export async function GET(request: Request, context: MediaRouteContext) {
  const { path } = await context.params;

  if (
    path.length === 0 ||
    path.some(
      (segment) =>
        segment === "." ||
        segment === ".." ||
        segment.includes("\\") ||
        segment.includes("\0"),
    )
  ) {
    return new Response("Ruta de imagen no válida.", { status: 400 });
  }

  const mediaPath = path.map(encodeURIComponent).join("/");
  const search = new URL(request.url).search;

  for (const origin of WORDPRESS_ORIGINS) {
    try {
      const upstream = await fetch(
        `${origin}/wp-content/${mediaPath}${search}`,
        {
          cache: "no-store",
          headers: { "ngrok-skip-browser-warning": "1" },
          signal: AbortSignal.timeout(15_000),
        },
      );

      if (upstream.ok) return mediaResponse(upstream);
      await upstream.body?.cancel();
    } catch {
      // Try the next configured WordPress origin.
    }
  }

  return new Response("No se pudo cargar la imagen desde WordPress.", {
    status: 502,
    headers: { "cache-control": "no-store" },
  });
}
