/**
 * app/api/doctors/route.js
 * Returns referred doctors filtered by specialization.
 *
 * Priority:
 *  1. MongoDB (live data)
 *  2. lib/doctors.js static data (always available — no DB required)
 */
import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { getDoctorsBySpec, ALL_DOCTORS } from '@/lib/doctors';

export async function POST(request) {
  try {
    const { specialization, tags } = await request.json();

    // ── 1. Try MongoDB ──────────────────────────────────────────────
    try {
      const db = await getDatabase();
      if (db) {
        let query = {};
        if (specialization) {
          const specParts = specialization.split('/').map((s) => s.trim());
          const orConditions = specParts.map((s) => ({
            specialization: { $regex: s, $options: 'i' },
          }));
          if (tags && tags.length > 0) {
            orConditions.push({ tags: { $in: tags } });
          }
          query = { $or: orConditions };
        }

        const doctors = await db.collection('doctors').find(query).limit(10).toArray();

        // If MongoDB has doctors, return them
        if (doctors.length > 0) {
          return NextResponse.json({ success: true, doctors, _source: 'mongodb' });
        }
      }
    } catch (dbErr) {
      console.warn('[doctors api] MongoDB query failed, falling back to static data:', dbErr.message);
    }

    // ── 2. Fallback: static data from lib/doctors.js ────────────────
    const doctors = getDoctorsBySpec(specialization || '');
    return NextResponse.json({ success: true, doctors, _source: 'static' });

  } catch (error) {
    console.error('[doctors api] Fatal error:', error);
    // Last resort: return full list
    return NextResponse.json({ success: true, doctors: ALL_DOCTORS.slice(0, 6), _source: 'static_fallback' });
  }
}

export async function GET() {
  return NextResponse.json({ success: true, doctors: ALL_DOCTORS, _source: 'static' });
}
