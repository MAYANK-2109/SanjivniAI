/**
 * app/api/rides/status/route.js
 * Proxies ride status checks to the Express backend.
 */
import { NextResponse } from 'next/server';

const BACKEND = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    const res  = await fetch(`${BACKEND}/rides/status?id=${id}`);
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error('[proxy/rides/status] Error:', err.message);
    return NextResponse.json({ success: false, error: 'Backend unavailable' }, { status: 502 });
  }
}
