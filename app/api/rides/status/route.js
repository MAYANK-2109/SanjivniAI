import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const rideId = searchParams.get('id');
    if (!rideId) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    const db = await getDatabase();
    const ride = await db.collection('rides').findOne({ _id: new ObjectId(rideId) });

    if (!ride) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // If accepted, attach the driver details
    if (ride.status === 'accepted' && ride.driverId) {
      const driver = await db.collection('ambulances').findOne({ driver_id: ride.driverId });
      if (driver) {
        ride.driver = driver;
      }
    }

    return NextResponse.json({ success: true, ride });
  } catch (err) {
    console.error('Ride status error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
