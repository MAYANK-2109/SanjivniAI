/**
 * app/api/rides/request/route.js
 * Creates a new ambulance ride request.
 *
 * POST /api/rides/request
 * Body: { tier, patient, fare }
 *
 * Returns: { success, rideId }
 *
 * Falls back to in-memory store when MongoDB is unavailable.
 */
import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { IN_MEMORY_RIDES, generateMockRideId } from '@/lib/mockData';

export async function POST(req) {
  try {
    const data = await req.json();

    // ── 1. Try MongoDB ──────────────────────────────────────────────
    try {
      const db = await getDatabase();
      if (db) {
        const rideDoc = {
          ...data,
          status: 'pending',
          createdAt: new Date(),
        };
        const result = await db.collection('rides').insertOne(rideDoc);
        return NextResponse.json({ success: true, rideId: result.insertedId.toString(), _source: 'mongodb' });
      }
    } catch (dbErr) {
      console.warn('[rides/request] MongoDB error, using in-memory store:', dbErr.message);
    }

    // ── 2. Fallback: in-memory store ────────────────────────────────
    const rideId = generateMockRideId();
    IN_MEMORY_RIDES.set(rideId, {
      _id: rideId,
      ...data,
      status: 'pending',
      createdAt: new Date(),
    });

    // Simulate driver acceptance after 5 seconds (for demo)
    setTimeout(() => {
      const ride = IN_MEMORY_RIDES.get(rideId);
      if (ride && ride.status === 'pending') {
        ride.status = 'accepted';
        ride.driverId = 'DRV-001';
        ride.driver = {
          name: 'Rajesh Kumar',
          initials: 'RK',
          color: '#EF4444',
          rating: '4.9',
          trips: 1240,
          experience: '8 yrs',
          phone: '+919876543210',
          vehicle: 'DL-01-AB-1234',
          model: 'Tata Winger ALS',
        };
        ride.acceptedAt = new Date();
        IN_MEMORY_RIDES.set(rideId, ride);
      }
    }, 5000);

    return NextResponse.json({ success: true, rideId, _source: 'mock' });
  } catch (err) {
    console.error('[rides/request] Fatal error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
