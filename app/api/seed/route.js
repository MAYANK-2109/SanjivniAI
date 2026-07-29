/**
 * app/api/seed/route.js
 * Seeds MongoDB with initial data for local development.
 * GET or POST /api/seed  →  seeds all collections.
 *
 * All data is imported from lib/mockData.js to avoid duplication.
 */
import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import {
  INITIAL_PROFILES,
  INITIAL_DISPATCHES,
  INITIAL_PATIENTS,
  INITIAL_HOSPITALS,
} from '@/lib/mockData';

// Re-export so legacy imports from other files don't break immediately
export { INITIAL_PROFILES, INITIAL_DISPATCHES, INITIAL_PATIENTS, INITIAL_HOSPITALS };

export async function POST() {
  try {
    const db = await getDatabase();
    if (!db) {
      return NextResponse.json(
        { success: false, message: 'MongoDB URI is not configured in .env.local yet.' },
        { status: 400 }
      );
    }

    // Seed Profiles
    await db.collection('profiles').deleteMany({});
    await db.collection('profiles').insertMany(INITIAL_PROFILES);

    // Seed Dispatches
    await db.collection('dispatches').deleteMany({});
    await db.collection('dispatches').insertMany(INITIAL_DISPATCHES);

    // Seed Patients
    await db.collection('patients').deleteMany({});
    await db.collection('patients').insertMany(INITIAL_PATIENTS);

    // Seed Hospitals
    await db.collection('hospitals').deleteMany({});
    await db.collection('hospitals').insertMany(INITIAL_HOSPITALS);

    return NextResponse.json({
      success: true,
      message: 'MongoDB successfully seeded with Sanjeevani collections!',
      collectionsSeeded: ['profiles', 'dispatches', 'patients', 'hospitals'],
    });
  } catch (error) {
    console.error('MongoDB Seed Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET() {
  return POST();
}
