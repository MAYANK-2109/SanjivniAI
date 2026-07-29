/**
 * app/api/auth/profiles/route.js
 * Returns role profiles for the current session.
 * Falls back to INITIAL_PROFILES when MongoDB is unavailable.
 */
import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { INITIAL_PROFILES } from '@/lib/mockData';

export async function GET() {
  try {
    const db = await getDatabase();
    if (!db) {
      return NextResponse.json({ success: true, profiles: INITIAL_PROFILES, _source: 'mock' });
    }

    const profiles = await db.collection('profiles').find({}).toArray();

    if (profiles.length === 0) {
      // Seed on first access
      await db.collection('profiles').insertMany(INITIAL_PROFILES);
      return NextResponse.json({ success: true, profiles: INITIAL_PROFILES, _source: 'mongodb_seeded' });
    }

    return NextResponse.json({ success: true, profiles, _source: 'mongodb' });
  } catch (error) {
    console.error('[auth profiles API]', error);
    // Always return something useful — never leave the client hanging
    return NextResponse.json({ success: true, profiles: INITIAL_PROFILES, _source: 'mock_fallback' });
  }
}
