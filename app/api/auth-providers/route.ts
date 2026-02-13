import { NextResponse } from "next/server";
import { getEnv } from '@/lib/cloudflare/env';

export const runtime = 'edge';

export async function GET() {
  const cfEnv = getEnv();
  const env = cfEnv as unknown as Record<string, string>;

  const url = `${env.NCB_AUTH_API_URL}/providers?Instance=${env.NCB_INSTANCE}`;
  const res = await fetch(url);
  const data = await res.json();
  return NextResponse.json(data);
}
