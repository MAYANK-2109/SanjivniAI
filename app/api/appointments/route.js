import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';

export async function POST(req) {
  try {
    const body = await req.json();
    const db = await getDatabase();

    const appointment = {
      ...body,
      status: 'pending', // pending | confirmed | completed | cancelled
      createdAt: new Date(),
    };

    const result = await db.collection('appointments').insertOne(appointment);
    return NextResponse.json({ success: true, id: result.insertedId });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const role = searchParams.get('role'); // 'doctor' or 'hospital'
    const targetId = searchParams.get('targetId');

    const db = await getDatabase();
    const query = {};
    if (role === 'doctor' && targetId) query.doctorId = targetId;
    if (role === 'hospital' && targetId) query.hospitalId = targetId;

    const appointments = await db.collection('appointments')
      .find(query)
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();

    return NextResponse.json({ success: true, appointments });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    const { id, status } = await req.json();
    const { ObjectId } = await import('mongodb');
    const db = await getDatabase();

    await db.collection('appointments').updateOne(
      { _id: new ObjectId(id) },
      { $set: { status, updatedAt: new Date() } }
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
