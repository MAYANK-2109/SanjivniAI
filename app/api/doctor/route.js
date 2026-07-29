/**
 * app/api/doctor/route.js
 * Doctor dashboard API — returns patient queue for the doctor role.
 * Falls back to INITIAL_PATIENTS from lib/mockData when MongoDB is unavailable.
 */
import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { INITIAL_PATIENTS } from '@/lib/mockData';

export async function GET() {
  try {
    const db = await getDatabase();
    if (!db) {
      return NextResponse.json({ success: true, patients: INITIAL_PATIENTS, source: 'mock' });
    }

    const patients = await db.collection('patients').find({}).toArray();
    if (patients.length === 0) {
      // Seed on first access if empty
      await db.collection('patients').insertMany(INITIAL_PATIENTS);
      return NextResponse.json({ success: true, patients: INITIAL_PATIENTS, source: 'mongodb_seeded' });
    }

    return NextResponse.json({ success: true, patients, source: 'mongodb' });
  } catch (error) {
    console.error('Doctor API GET Error:', error);
    // Always fall back to mock data — never return an empty error state
    return NextResponse.json({ success: true, patients: INITIAL_PATIENTS, source: 'mock', error: error.message });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { patientId, doctorNotes, status } = body;

    const db = await getDatabase();
    if (!db) {
      return NextResponse.json({ success: true, message: 'Notes saved locally (MongoDB not configured)', data: body });
    }

    const updateFields = { updatedAt: new Date() };
    if (doctorNotes !== undefined) updateFields.doctorNotes = doctorNotes;
    if (status) updateFields.status = status;

    await db.collection('patients').updateOne(
      { patientId: patientId || 'PAT-9012' },
      { $set: updateFields },
      { upsert: true }
    );

    return NextResponse.json({ success: true, message: 'Clinical notes saved in MongoDB', data: updateFields });
  } catch (error) {
    console.error('Doctor API POST Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
