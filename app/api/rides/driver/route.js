/**
 * app/api/rides/driver/route.js
 * Proxies driver-side ride operations to the Express backend.
 *
 * GET  /api/rides/driver?lat=&lng=&tier=  → next pending ride within 10km
 * POST /api/rides/driver                  → accept / decline / update_status
 */
import { NextResponse } from 'next/server';

const BACKEND = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const params = searchParams.toString(); // preserves lat, lng, tier
    const res  = await fetch(`${BACKEND}/rides/driver${params ? `?${params}` : ''}`);
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error('[proxy/rides/driver GET] Error:', err.message);
    return NextResponse.json({ success: false, error: 'Backend unavailable' }, { status: 502 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const res  = await fetch(`${BACKEND}/rides/driver`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error('[proxy/rides/driver POST] Error:', err.message);
    return NextResponse.json({ success: false, error: 'Backend unavailable' }, { status: 502 });
  }
}
