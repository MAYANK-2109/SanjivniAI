import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';

export async function GET() {
  try {
    const db = await getDatabase();
    if (!db) {
      throw new Error("Database connection unavailable");
    }

    // Fetch the latest 50 triage requests
    const history = await db.collection('triage_history')
      .find({})
      .sort({ timestamp: -1 })
      .limit(50)
      .toArray();

    return NextResponse.json({ success: true, history });
  } catch (error) {
    console.error('[triage history api]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
