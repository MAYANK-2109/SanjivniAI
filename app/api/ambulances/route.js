import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';

export async function POST(request) {
  try {
    const { lat, lng } = await request.json();

    const db = await getDatabase();
    if (!db) {
      throw new Error("Database connection unavailable");
    }

    let query = {};
    if (lat && lng) {
      // Find nearby ambulances (within 10km)
      query = {
        location: {
          $near: {
            $geometry: { type: "Point", coordinates: [lng, lat] },
            $maxDistance: 10000 
          }
        },
        status: 'available'
      };
    } else {
      query = { status: 'available' };
    }

    const ambulances = await db.collection('ambulances').find(query).limit(10).toArray();

    return NextResponse.json({ success: true, ambulances });
  } catch (error) {
    console.error('[ambulances api]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
