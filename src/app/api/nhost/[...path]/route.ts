import { type NextRequest, NextResponse } from "next/server";
import https from "node:https";

// Determine the upstream Nhost base URL from the path prefix
function getUpstreamBase(service: string): string | null {
  const serviceMap: Record<string, string> = {
    auth: "https://local.auth.local.nhost.run",
    graphql: "https://local.graphql.local.nhost.run",
    storage: "https://local.storage.local.nhost.run",
    functions: "https://local.functions.local.nhost.run",
  };
  return serviceMap[service] ?? null;
}

// Make an https request using node's https module (respects NODE_TLS_REJECT_UNAUTHORIZED)
function httpsRequest(
  url: string,
  method: string,
  headers: Record<string, string>,
  body?: Buffer
): Promise<{ status: number; headers: Record<string, string>; body: Buffer }> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const options: https.RequestOptions = {
      hostname: parsed.hostname,
      port: parsed.port ? parseInt(parsed.port) : 443,
      path: parsed.pathname + parsed.search,
      method,
      headers,
      rejectUnauthorized: false, // explicitly disable cert validation for local dev
      timeout: 15000,
    };

    const req = https.request(options, (res) => {
      const chunks: Buffer[] = [];
      res.on("data", (chunk: Buffer) => chunks.push(chunk));
      res.on("end", () => {
        const responseHeaders: Record<string, string> = {};
        for (const [key, val] of Object.entries(res.headers)) {
          if (val !== undefined) {
            responseHeaders[key] = Array.isArray(val) ? val.join(", ") : val;
          }
        }
        resolve({
          status: res.statusCode ?? 500,
          headers: responseHeaders,
          body: Buffer.concat(chunks),
        });
      });
    });

    req.on("error", reject);
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("upstream request timed out after 15s"));
    });

    if (body && body.length > 0) {
      req.write(body);
    }
    req.end();
  });
}

async function proxyRequest(req: NextRequest, params: Promise<{ path: string[] }>) {
  const { path } = await params;
  const [service, ...rest] = path;

  const upstreamBase = getUpstreamBase(service);
  if (!upstreamBase) {
    return NextResponse.json({ error: "Unknown Nhost service" }, { status: 404 });
  }

  const tail = rest.join("/");
  const reqUrl = new URL(req.url);
  const upstreamUrl = `${upstreamBase}/v1/${tail}${reqUrl.search}`;

  // Forward headers, stripping problematic ones
  const forwardHeaders: Record<string, string> = {};
  req.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (lower !== "host" && lower !== "connection" && lower !== "transfer-encoding") {
      forwardHeaders[key] = value;
    }
  });

  // Read body for mutating requests
  let bodyBuffer: Buffer | undefined;
  if (req.method !== "GET" && req.method !== "HEAD") {
    try {
      const ab = await req.arrayBuffer();
      bodyBuffer = Buffer.from(ab);
    } catch {
      bodyBuffer = undefined;
    }
  }

  try {
    const upstream = await httpsRequest(
      upstreamUrl,
      req.method,
      forwardHeaders,
      bodyBuffer
    );

    const responseHeaders = new Headers();
    for (const [key, value] of Object.entries(upstream.headers)) {
      const lower = key.toLowerCase();
      // Skip headers that would conflict with buffered response
      if (lower === "transfer-encoding" || lower === "content-encoding") continue;
      // Replace CORS headers with our own
      if (lower.startsWith("access-control-")) continue;
      responseHeaders.set(key, value);
    }

    const origin = req.headers.get("origin") || "*";
    responseHeaders.set("Access-Control-Allow-Origin", origin);
    responseHeaders.set("Access-Control-Allow-Credentials", "true");

    return new NextResponse(upstream.body, {
      status: upstream.status,
      headers: responseHeaders,
    });
  } catch (err) {
    console.error("[nhost-proxy] upstream error:", String(err));
    return NextResponse.json(
      { error: "Upstream request failed", detail: String(err) },
      { status: 502 }
    );
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(req, params);
}
export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(req, params);
}
export async function PUT(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(req, params);
}
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(req, params);
}
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(req, params);
}
export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get("origin") || "*";
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
      "Access-Control-Allow-Headers":
        "Content-Type, Authorization, x-hasura-admin-secret, x-nhost-*",
      "Access-Control-Allow-Credentials": "true",
      "Access-Control-Max-Age": "86400",
    },
  });
}
