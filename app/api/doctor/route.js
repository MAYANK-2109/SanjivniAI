import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { INITIAL_PATIENTS } from '../seed/route';

export async function GET() {
  try {
    const db = await getDatabase();
    if (!db) {
      return NextResponse.json({ success: true, patients: INITIAL_PATIENTS, source: 'mock' });
    }

    const patients = await db.collection('patients').find({}).toArray();
    if (patients.length === 0) {
      await db.collection('patients').insertMany(INITIAL_PATIENTS);
      return NextResponse.json({ success: true, patients: INITIAL_PATIENTS, source: 'mongodb' });
    }

    return NextResponse.json({ success: true, patients, source: 'mongodb' });
  } catch (error) {
    console.error('Doctor API GET Error:', error);
    return NextResponse.json({ success: true, patients: INITIAL_PATIENTS, source: 'mock', error: error.message });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { patientId, doctorNotes, status } = body;

    const db = await getDatabase();
    if (!db) {
      return NextResponse.json({ success: true, message: 'Notes saved locally (No Mongo URI set)', data: body });
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
