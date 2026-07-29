/**
 * app/api/rides/driver/route.js
 * Driver-side ride management — fetch pending rides & accept/decline.
 *
 * GET  /api/rides/driver?tier=<bls|als|air>  →  returns next pending ride
 * POST /api/rides/driver  →  { rideId, driverId, action: 'accept'|'decline'|'update_status', status? }
 *
 * Falls back to in-memory store when MongoDB is unavailable.
 */
import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { IN_MEMORY_RIDES } from '@/lib/mockData';

function isObjectId(str) {
  return /^[a-f\d]{24}$/i.test(str);
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const tier = searchParams.get('tier');

    // ── 1. Try MongoDB ──────────────────────────────────────────────
    try {
      const db = await getDatabase();
      if (db) {
        const query = { status: 'pending' };
        if (tier) query['tier.id'] = tier;
        const pendingRide = await db.collection('rides').findOne(query, { sort: { createdAt: 1 } });
        return NextResponse.json({ success: true, ride: pendingRide, _source: 'mongodb' });
      }
    } catch (dbErr) {
      console.warn('[rides/driver GET] MongoDB error, using in-memory store:', dbErr.message);
    }

    // ── 2. Fallback: in-memory store ────────────────────────────────
    let pendingRide = null;
    for (const [, ride] of IN_MEMORY_RIDES) {
      if (ride.status === 'pending') {
        if (!tier || ride.tier?.id === tier) {
          pendingRide = ride;
          break;
        }
      }
    }
    return NextResponse.json({ success: true, ride: pendingRide, _source: 'mock' });

  } catch (err) {
    console.error('[rides/driver GET] Fatal error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { rideId, driverId, action, status } = await req.json();

    if (!rideId) {
      return NextResponse.json({ success: false, error: 'rideId is required' }, { status: 400 });
    }

    // ── 1. In-memory store (mock rides) ────────────────────────────
    if (IN_MEMORY_RIDES.has(rideId)) {
      const ride = IN_MEMORY_RIDES.get(rideId);

      if (action === 'accept') {
        if (ride.status !== 'pending') {
          return NextResponse.json({ success: false, error: 'Ride already accepted or not pending' }, { status: 400 });
        }
        ride.status = 'accepted';
        ride.driverId = driverId;
        ride.acceptedAt = new Date();
        IN_MEMORY_RIDES.set(rideId, ride);
        return NextResponse.json({ success: true, ride });
      }

      if (action === 'update_status') {
        ride.status = status;
        ride.updatedAt = new Date();
        IN_MEMORY_RIDES.set(rideId, ride);
        return NextResponse.json({ success: true, ride });
      }

      // decline — keep pending for another driver
      return NextResponse.json({ success: true });
    }

    // ── 2. MongoDB (real rides) ─────────────────────────────────────
    if (isObjectId(rideId)) {
      try {
        const db = await getDatabase();
        if (db) {
          const { ObjectId } = await import('mongodb');

          if (action === 'accept') {
            const result = await db.collection('rides').findOneAndUpdate(
              { _id: new ObjectId(rideId), status: 'pending' },
              { $set: { status: 'accepted', driverId, acceptedAt: new Date() } },
              { returnDocument: 'after' }
            );
            if (!result) {
              return NextResponse.json({ success: false, error: 'Ride already accepted or not found' }, { status: 400 });
            }
            return NextResponse.json({ success: true, ride: result });
          }

          if (action === 'update_status') {
            const result = await db.collection('rides').findOneAndUpdate(
              { _id: new ObjectId(rideId), driverId },
              { $set: { status, updatedAt: new Date() } },
              { returnDocument: 'after' }
            );
            if (!result) {
              return NextResponse.json({ success: false, error: 'Ride not found or not owned by driver' }, { status: 404 });
            }
            return NextResponse.json({ success: true, ride: result });
          }

          // decline
          return NextResponse.json({ success: true });
        }
      } catch (dbErr) {
        console.warn('[rides/driver POST] MongoDB error:', dbErr.message);
        return NextResponse.json({ success: false, error: 'Database error: ' + dbErr.message }, { status: 500 });
      }
    }

    return NextResponse.json({ success: false, error: 'Ride not found' }, { status: 404 });
  } catch (err) {
    console.error('[rides/driver POST] Fatal error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
