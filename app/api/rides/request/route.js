/**
 * app/api/rides/request/route.js
 * Proxies ride booking requests to the Express backend.
 * No auto-accept, no in-memory store — single source of truth is Express+MongoDB.
 */
import { NextResponse } from 'next/server';

const BACKEND = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export async function POST(req) {
  try {
    const body = await req.json();
    const res = await fetch(`${BACKEND}/rides/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error('[proxy/rides/request] Error:', err.message);
    return NextResponse.json({ success: false, error: 'Backend unavailable' }, { status: 502 });
  }
}
