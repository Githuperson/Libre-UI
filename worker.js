const BACKEND = "https://libre-y-theta.vercel.app/api.php";

export default {
  async fetch(request) {
    const url = new URL(request.url);

    // Keep the existing /api.php endpoint working, and add the cleaner
    // Libre-UI endpoint /api/search.
    if (url.pathname !== "/api/search" && url.pathname !== "/api.php") {
      return new Response("Not Found", {
        status: 404,
        headers: corsHeaders("text/plain; charset=utf-8")
      });
    }

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response(JSON.stringify({ error: { message: "Method not allowed" } }), {
        status: 405,
        headers: corsHeaders("application/json; charset=utf-8")
      });
    }

    // /api/search?q=...&p=...&t=... is translated to Libre-y's PHP API.
    const target = new URL(BACKEND);
    for (const key of ["q", "p", "t"]) {
      const value = url.searchParams.get(key);
      if (value !== null) target.searchParams.set(key, value);
    }

    if (!target.searchParams.has("p")) target.searchParams.set("p", "0");
    if (!target.searchParams.has("t")) target.searchParams.set("t", "0");

    try {
      const response = await fetch(target.toString(), {
        method: request.method,
        headers: {
          "Accept": "application/json",
          "User-Agent": "Libre-UI-Worker/1.0"
        }
      });

      const headers = corsHeaders(
        response.headers.get("content-type") || "application/json; charset=utf-8"
      );
      headers.set("Cache-Control", "public, max-age=0, s-maxage=30, stale-while-revalidate=60");

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers
      });
    } catch (error) {
      return new Response(JSON.stringify({
        error: { message: "Libre-y backend could not be reached." }
      }), {
        status: 502,
        headers: corsHeaders("application/json; charset=utf-8")
      });
    }
  }
};

function corsHeaders(contentType = null) {
  const headers = new Headers();
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Accept, Content-Type");
  headers.set("Access-Control-Max-Age", "86400");
  if (contentType) headers.set("Content-Type", contentType);
  return headers;
}
