/**
 * app/api/triage/history/route.js
 * Returns recent triage history for the doctor dashboard.
 * Falls back to empty array (no error) when MongoDB is offline.
 */
import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';

export async function GET() {
  try {
    const db = await getDatabase();

    if (!db) {
      // Gracefully return empty history — doctor dashboard handles this case
      return NextResponse.json({ success: true, history: [], _source: 'mock' });
    }

    const history = await db.collection('triage_history')
      .find({})
      .sort({ timestamp: -1 })
      .limit(50)
      .toArray();

    return NextResponse.json({ success: true, history, _source: 'mongodb' });
  } catch (error) {
    console.error('[triage history api]', error);
    // Return empty history instead of a 500 error — UI handles the empty state
    return NextResponse.json({ success: true, history: [], _source: 'mock_fallback' });
  }
}
