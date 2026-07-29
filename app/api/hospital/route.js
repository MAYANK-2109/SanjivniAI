import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
export async function GET() {
  try {
    const db = await getDatabase();
    if (!db) {
      throw new Error("Database connection unavailable");
    }

    const hospital = await db.collection('hospitals').findOne({ id: 'hosp-1' });
    if (!hospital) {
      return NextResponse.json({ success: false, error: 'Hospital not found' }, { status: 404 });
    }

    // Find all rides that are heading to the hospital (for this simple demo, any accepted/en_route ride)
    const dispatches = await db.collection('rides').find({ status: { $in: ['accepted', 'en_route'] } }).toArray();

    return NextResponse.json({
      success: true,
      hospital,
      incomingAmbulances: dispatches,
      source: 'mongodb'
    });
  } catch (error) {
    console.error('Hospital API GET Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { capacity, erStatus } = body;

    const db = await getDatabase();
    if (!db) {
      return NextResponse.json({ success: true, message: 'Hospital capacity updated locally (No Mongo URI set)', data: body });
    }

    const updateFields = { updatedAt: new Date() };
    if (capacity) updateFields.capacity = capacity;
    if (erStatus) updateFields.erStatus = erStatus;

    await db.collection('hospitals').updateOne(
      { hospitalId: 'HOSP-001' },
      { $set: updateFields },
      { upsert: true }
    );

    return NextResponse.json({ success: true, message: 'Hospital capacity updated in MongoDB', data: updateFields });
  } catch (error) {
    console.error('Hospital API POST Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
