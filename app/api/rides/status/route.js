/**
 * app/api/rides/status/route.js
 * Polls the status of a ride by ID.
 *
 * GET /api/rides/status?id=<rideId>
 *
 * Handles both real MongoDB ObjectIds and mock IDs (mock-xxx-xxx).
 */
import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { IN_MEMORY_RIDES, MOCK_DRIVERS } from '@/lib/mockData';

function isObjectId(str) {
  return /^[a-f\d]{24}$/i.test(str);
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const rideId = searchParams.get('id');

    if (!rideId) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }

    // ── 1. Check in-memory store first (for mock rides) ─────────────
    if (IN_MEMORY_RIDES.has(rideId)) {
      const ride = IN_MEMORY_RIDES.get(rideId);
      return NextResponse.json({ success: true, ride, _source: 'mock' });
    }

    // ── 2. Try MongoDB for real ObjectId rides ───────────────────────
    if (isObjectId(rideId)) {
      try {
        const db = await getDatabase();
        if (db) {
          const { ObjectId } = await import('mongodb');
          const ride = await db.collection('rides').findOne({ _id: new ObjectId(rideId) });

          if (!ride) {
            return NextResponse.json({ error: 'Ride not found' }, { status: 404 });
          }

          // Attach driver details if accepted
          if (ride.status === 'accepted' && ride.driverId) {
            const driver = await db.collection('ambulances').findOne({ driver_id: ride.driverId });
            if (driver) {
              ride.driver = driver;
            } else {
              // Use mock driver as fallback
              ride.driver = MOCK_DRIVERS.find((d) => d.driver_id === ride.driverId) || MOCK_DRIVERS[0];
            }
          }

          return NextResponse.json({ success: true, ride, _source: 'mongodb' });
        }
      } catch (dbErr) {
        console.warn('[rides/status] MongoDB error:', dbErr.message);
      }
    }

    // ── 3. Not found anywhere ───────────────────────────────────────
    return NextResponse.json({ error: 'Ride not found', rideId }, { status: 404 });
  } catch (err) {
    console.error('[rides/status] Fatal error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
