const DEFAULT_ALLOWED_HOSTS = new Set([
  "ms.outlook007.cc",
]);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
};

export default {
  async fetch(request, env = {}) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    const requestUrl = new URL(request.url);

    if (requestUrl.pathname === "/" || requestUrl.pathname === "/health") {
      return json({ ok: true, service: "account-jsonl-mailbox-proxy" });
    }

    if (requestUrl.pathname !== "/api/mailbox") {
      return json({ error: "Not found" }, 404);
    }

    if (request.method !== "GET") {
      return json({ error: "Method not allowed" }, 405);
    }

    const target = requestUrl.searchParams.get("url");
    const parsedTarget = parseTarget(target);
    if (!parsedTarget.ok) {
      return json({ error: parsedTarget.error }, 400);
    }

    const allowedHosts = allowedHostSet(env);
    if (!allowedHosts.has(parsedTarget.url.hostname)) {
      return json({
        error: "Host is not allowed",
        host: parsedTarget.url.hostname,
      }, 403);
    }

    try {
      const upstream = await fetch(parsedTarget.url.toString(), {
        method: "GET",
        headers: {
          "Accept": "application/json,text/plain,*/*",
          "User-Agent": "account-jsonl-mailbox-proxy/1.0",
        },
        cf: {
          cacheTtl: 0,
          cacheEverything: false,
        },
      });

      const headers = new Headers(corsHeaders);
      headers.set("Cache-Control", "no-store");
      headers.set("Content-Type", upstream.headers.get("content-type") || "text/plain; charset=utf-8");

      return new Response(upstream.body, {
        status: upstream.status,
        headers,
      });
    } catch (error) {
      return json({ error: error.message || "Proxy request failed" }, 502);
    }
  },
};

function parseTarget(value) {
  if (!value) {
    return { ok: false, error: "Missing url query parameter" };
  }

  let url;
  try {
    url = new URL(value);
  } catch {
    return { ok: false, error: "Invalid url query parameter" };
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return { ok: false, error: "Only http and https URLs are supported" };
  }

  return { ok: true, url };
}

function allowedHostSet(env = {}) {
  const raw = env.ALLOWED_MAILBOX_HOSTS || "";
  const hosts = raw
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

  return hosts.length ? new Set(hosts) : DEFAULT_ALLOWED_HOSTS;
}

function json(payload, status = 200) {
  return new Response(JSON.stringify(payload, null, 2), {
    status,
    headers: {
      ...corsHeaders,
      "Cache-Control": "no-store",
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}
