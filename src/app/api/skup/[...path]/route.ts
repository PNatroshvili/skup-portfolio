const UPSTREAM_BASE = "https://api.skup.ge/v1";

const FORWARDED_REQUEST_HEADERS = ["authorization", "content-type", "accept"];

async function proxy(request: Request, { params }: { params: Promise<{ path?: string[] }> }) {
  const { path = [] } = await params;
  const incomingUrl = new URL(request.url);
  const upstreamUrl =
    UPSTREAM_BASE +
    (path.length ? "/" + path.map(encodeURIComponent).join("/") : "") +
    incomingUrl.search;

  const headers = new Headers();
  for (const name of FORWARDED_REQUEST_HEADERS) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }

  try {
    const upstream = await fetch(upstreamUrl, {
      method: request.method,
      headers,
      body: request.method === "GET" || request.method === "HEAD" ? undefined : await request.arrayBuffer(),
      cache: "no-store",
    });

    const responseHeaders = new Headers();
    const contentType = upstream.headers.get("content-type");
    const contentDisposition = upstream.headers.get("content-disposition");
    if (contentType) responseHeaders.set("content-type", contentType);
    if (contentDisposition) responseHeaders.set("content-disposition", contentDisposition);

    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: responseHeaders,
    });
  } catch {
    return Response.json(
      { message: "The restaurant API is temporarily unavailable." },
      { status: 502 },
    );
  }
}

export const dynamic = "force-dynamic";

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
export const OPTIONS = proxy;
