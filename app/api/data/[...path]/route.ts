import { NextRequest, NextResponse } from "next/server";

export const runtime = 'edge';

const CONFIG = {
  instance: process.env.NCB_INSTANCE!,
  dataApiUrl: process.env.NCB_DATA_API_URL!,
  authApiUrl: process.env.NCB_AUTH_API_URL!,
};

function extractAuthCookies(cookieHeader: string): string {
  if (!cookieHeader) return "";

  const cookies = cookieHeader.split(";");
  const authCookies: string[] = [];

  for (const cookie of cookies) {
    const trimmed = cookie.trim();
    if (
      trimmed.startsWith("better-auth.session_token=") ||
      trimmed.startsWith("better-auth.session_data=")
    ) {
      authCookies.push(trimmed);
    }
  }

  return authCookies.join("; ");
}

async function getSessionUser(
  cookieHeader: string
): Promise<{ id: string } | null> {
  const authCookies = extractAuthCookies(cookieHeader);
  if (!authCookies) return null;

  const url = `${CONFIG.authApiUrl}/get-session?Instance=${CONFIG.instance}`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "X-Database-Instance": CONFIG.instance,
      Cookie: authCookies,
    },
  });

  if (res.ok) {
    const data = await res.json();
    return data.user || null;
  }
  return null;
}

async function proxyToNCB(req: NextRequest, path: string, body?: string) {
  const searchParams = new URLSearchParams();
  searchParams.set("Instance", CONFIG.instance);

  req.nextUrl.searchParams.forEach((val, key) => {
    if (key !== "Instance" && key !== "instance" && key !== "path") searchParams.append(key, val);
  });

  const url = `${CONFIG.dataApiUrl}/${path}?${searchParams.toString()}`;
  const origin = req.headers.get("origin") || req.nextUrl.origin;

  const cookieHeader = req.headers.get("cookie") || "";
  const authCookies = extractAuthCookies(cookieHeader);

  const res = await fetch(url, {
    method: req.method,
    headers: {
      "Content-Type": "application/json",
      "X-Database-Instance": CONFIG.instance,
      Cookie: authCookies,
      Origin: origin,
    },
    body: body || undefined,
  });

  const data = await res.text();

  return new NextResponse(data, {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const cookieHeader = req.headers.get("cookie") || "";

  const user = await getSessionUser(cookieHeader);
  if (!user) {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  return proxyToNCB(req, path.join("/"));
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const pathStr = path.join("/");
  const body = await req.text();
  const cookieHeader = req.headers.get("cookie") || "";

  const user = await getSessionUser(cookieHeader);
  if (!user) {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (pathStr.startsWith("create/") && body) {
    try {
      const parsed = JSON.parse(body);
      delete parsed.user_id;
      parsed.user_id = user.id;
      return proxyToNCB(req, pathStr, JSON.stringify(parsed));
    } catch {
      // Continue without modification
    }
  }

  return proxyToNCB(req, pathStr, body);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const body = await req.text();
  const cookieHeader = req.headers.get("cookie") || "";

  const user = await getSessionUser(cookieHeader);
  if (!user) {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (body) {
    try {
      const parsed = JSON.parse(body);
      delete parsed.user_id;
      return proxyToNCB(req, path.join("/"), JSON.stringify(parsed));
    } catch {
      // Continue without modification
    }
  }

  return proxyToNCB(req, path.join("/"), body);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const cookieHeader = req.headers.get("cookie") || "";

  const user = await getSessionUser(cookieHeader);
  if (!user) {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  return proxyToNCB(req, path.join("/"));
}
