import { NextRequest, NextResponse } from "next/server";

export const runtime = 'edge';

function getConfig() {
  const instance = process.env.NCB_INSTANCE;
  const apiUrl = process.env.NCB_AUTH_API_URL;

  if (!instance || !apiUrl) {
    throw new Error(`Missing environment variables: NCB_INSTANCE=${instance ? 'set' : 'MISSING'}, NCB_AUTH_API_URL=${apiUrl ? 'set' : 'MISSING'}`);
  }

  return { instance, apiUrl };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params;
    return proxy(req, path.join("/"));
  } catch (error) {
    console.error('Auth GET error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params;
    const pathStr = path.join("/");

    if (pathStr === "sign-out") {
      return handleSignOut(req);
    }

    return proxy(req, pathStr, await req.text());
  } catch (error) {
    console.error('Auth POST error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}

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

function transformSetCookieForLocalhost(cookie: string): string {
  const parts = cookie.split(";");
  const nameValue = parts[0].trim();

  let cleanedNameValue = nameValue;
  if (nameValue.startsWith("__Secure-better-auth.")) {
    cleanedNameValue = nameValue.replace("__Secure-", "");
  } else if (nameValue.startsWith("__Host-better-auth.")) {
    cleanedNameValue = nameValue.replace("__Host-", "");
  }

  const otherAttributes = parts
    .slice(1)
    .map((attr) => attr.trim())
    .filter((attr) => {
      const lower = attr.toLowerCase();
      return (
        !lower.startsWith("domain=") &&
        !lower.startsWith("secure") &&
        !lower.startsWith("samesite=")
      );
    });

  otherAttributes.push("SameSite=Lax");

  return [cleanedNameValue, ...otherAttributes].join("; ");
}

async function handleSignOut(req: NextRequest) {
  const config = getConfig();
  const response = new NextResponse(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });

  try {
    const searchParams = new URLSearchParams();
    searchParams.set("Instance", config.instance);
    const url = `${config.apiUrl}/sign-out?${searchParams.toString()}`;
    const origin = req.headers.get("origin") || req.nextUrl.origin;
    const authCookies = extractAuthCookies(req.headers.get("cookie") || "");

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Database-Instance": config.instance,
        Cookie: authCookies,
        Origin: origin,
      },
      body: "{}",
    });

    const cookies = res.headers.getSetCookie?.() || [];
    for (const cookie of cookies) {
      response.headers.append(
        "Set-Cookie",
        transformSetCookieForLocalhost(cookie)
      );
    }
  } catch {
    // Ignore upstream errors
  }

  const cookiesToClear = [
    "better-auth.session_token",
    "better-auth.session_data",
  ];

  for (const cookieName of cookiesToClear) {
    response.headers.append(
      "Set-Cookie",
      `${cookieName}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`
    );
  }

  return response;
}

async function proxy(req: NextRequest, path: string, body?: string) {
  const config = getConfig();
  const searchParams = new URLSearchParams();
  searchParams.set("Instance", config.instance);
  const url = `${config.apiUrl}/${path}?${searchParams.toString()}`;
  const origin = req.headers.get("origin") || req.nextUrl.origin;

  const authCookies = extractAuthCookies(req.headers.get("cookie") || "");

  const res = await fetch(url, {
    method: req.method,
    headers: {
      "Content-Type": "application/json",
      "X-Database-Instance": config.instance,
      Cookie: authCookies,
      Origin: origin,
    },
    body: body || undefined,
  });

  const data = await res.text();
  const response = new NextResponse(data, {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  });

  const cookies = res.headers.getSetCookie?.() || [];
  for (const cookie of cookies) {
    response.headers.append(
      "Set-Cookie",
      transformSetCookieForLocalhost(cookie)
    );
  }

  return response;
}
