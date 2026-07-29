import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';

export async function GET() {
  try {
    const db = await getDatabase();
    if (!db) {
      throw new Error("Database connection unavailable");
    }

    const profiles = await db.collection('profiles').find({}).toArray();
    return NextResponse.json({ success: true, profiles });
  } catch (error) {
    console.error('[auth API]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
