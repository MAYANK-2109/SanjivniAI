import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const tier = searchParams.get('tier'); // als or bls

    const db = await getDatabase();
    
    // Find a pending ride that matches this tier (or if no tier specified, any pending)
    const query = { status: 'pending' };
    if (tier) query['tier.id'] = tier;

    const pendingRide = await db.collection('rides').findOne(query, { sort: { createdAt: 1 } });

    return NextResponse.json({ success: true, ride: pendingRide });
  } catch (err) {
    console.error('Driver ride fetch error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { rideId, driverId, action, status } = await req.json(); // action = 'accept' or 'decline' or 'update_status'
    
    const db = await getDatabase();
    
    if (action === 'accept') {
      const result = await db.collection('rides').findOneAndUpdate(
        { _id: new ObjectId(rideId), status: 'pending' },
        { $set: { status: 'accepted', driverId: driverId, acceptedAt: new Date() } },
        { returnDocument: 'after' }
      );
      
      if (!result) {
        return NextResponse.json({ success: false, error: 'Ride already accepted by someone else or not pending' }, { status: 400 });
      }
      return NextResponse.json({ success: true, ride: result });
    } else if (action === 'update_status') {
      const result = await db.collection('rides').findOneAndUpdate(
        { _id: new ObjectId(rideId), driverId: driverId },
        { $set: { status: status, updatedAt: new Date() } },
        { returnDocument: 'after' }
      );
      if (!result) {
        return NextResponse.json({ success: false, error: 'Ride not found or not owned by driver' }, { status: 404 });
      }
      return NextResponse.json({ success: true, ride: result });
    } else {
      // Driver declined. We don't mark the ride as declined, we just let it stay pending for another driver.
      return NextResponse.json({ success: true });
    }
  } catch (err) {
    console.error('Driver ride accept error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
