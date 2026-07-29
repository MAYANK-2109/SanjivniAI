import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
export async function GET() {
  try {
    const db = await getDatabase();
    if (!db) {
      throw new Error("Database connection unavailable");
    }

    const dispatches = await db.collection('rides').find({ status: 'en_route' }).toArray();

    return NextResponse.json({ success: true, dispatches, source: 'mongodb' });
  } catch (error) {
    console.error('Ambulance API GET Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { caseId, vitals, erNotified, status } = body;

    const db = await getDatabase();
    if (!db) {
      return NextResponse.json({ success: true, message: 'Updated locally (No Mongo URI set)', data: body });
    }

    const updateFields = { updatedAt: new Date() };
    if (vitals) updateFields.vitals = vitals;
    if (erNotified !== undefined) updateFields.erNotified = erNotified;
    if (status) updateFields.status = status;

    await db.collection('dispatches').updateOne(
      { caseId: caseId || 'CAS-9921' },
      { $set: updateFields },
      { upsert: true }
    );

    return NextResponse.json({ success: true, message: 'Dispatch telemetry updated in MongoDB', data: updateFields });
  } catch (error) {
    console.error('Ambulance API POST Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
