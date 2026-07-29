import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';

export async function POST(req) {
  try {
    const data = await req.json();
    const db = await getDatabase();
    
    const rideDoc = {
      ...data,
      status: 'pending', // pending, accepted, en_route, completed, declined
      createdAt: new Date(),
    };

    const result = await db.collection('rides').insertOne(rideDoc);

    return NextResponse.json({ success: true, rideId: result.insertedId });
  } catch (err) {
    console.error('Ride request error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
