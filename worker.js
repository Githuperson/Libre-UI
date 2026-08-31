const BACKEND = "https://libre-y-theta.vercel.app/api.php";

export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders()
      });
    }

    // Public API: /api/search?q=...&p=...&t=...
    // Legacy /api.php is also kept working.
    if (url.pathname !== "/api/search" && url.pathname !== "/api.php") {
      return new Response(JSON.stringify({
        error: { message: "Not found" }
      }), {
        status: 404,
        headers: corsHeaders("application/json; charset=utf-8")
      });
    }

    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response(JSON.stringify({
        error: { message: "Method not allowed" }
      }), {
        status: 405,
        headers: corsHeaders("application/json; charset=utf-8")
      });
    }

    // Translate:
    // Worker /api/search?q=hi&p=0&t=0
    // -> Vercel Libre-y /api.php?q=hi&p=0&t=0
    const target = new URL(BACKEND);

    for (const [key, value] of url.searchParams) {
      target.searchParams.append(key, value);
    }

    if (!target.searchParams.has("p")) {
      target.searchParams.set("p", "0");
    }

    if (!target.searchParams.has("t")) {
      target.searchParams.set("t", "0");
    }

    try {
      const response = await fetch(target.toString(), {
        method: request.method,
        headers: {
          "Accept": "application/json",
          "User-Agent": "Libre-UI-Worker/1.0"
        }
      });

      const headers = corsHeaders(
        response.headers.get("content-type") ||
        "application/json; charset=utf-8"
      );

      headers.set(
        "Cache-Control",
        "public, max-age=0, s-maxage=30, stale-while-revalidate=60"
      );

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers
      });
    } catch (error) {
      return new Response(JSON.stringify({
        error: {
          message: "Libre-y backend could not be reached."
        }
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

  if (contentType) {
    headers.set("Content-Type", contentType);
  }

  return headers;
}
