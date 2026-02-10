import { NextResponse } from "next/server";
import { getRequestContext } from '@cloudflare/next-on-pages';

export const runtime = 'edge';

export async function GET() {
  const { env: cfEnv } = getRequestContext();
  const env = cfEnv as unknown as Record<string, string>;

  const url = `${env.NCB_AUTH_API_URL}/providers?Instance=${env.NCB_INSTANCE}`;
  const res = await fetch(url);
  const data = await res.json();
  return NextResponse.json(data);
}
