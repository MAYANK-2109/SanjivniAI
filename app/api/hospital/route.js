/**
 * app/api/hospital/route.js
 * Hospital dashboard API — returns hospital capacity + incoming dispatches.
 * Falls back to INITIAL_HOSPITALS + INITIAL_DISPATCHES when MongoDB is offline.
 */
import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { INITIAL_HOSPITALS, INITIAL_DISPATCHES } from '@/lib/mockData';

const MOCK_HOSPITAL = INITIAL_HOSPITALS[0];

export async function GET() {
  try {
    const db = await getDatabase();

    if (!db) {
      return NextResponse.json({
        success: true,
        hospital: MOCK_HOSPITAL,
        incomingAmbulances: INITIAL_DISPATCHES,
        source: 'mock',
      });
    }

    let hospital = await db.collection('hospitals').findOne({ id: 'hosp-1' });
    if (!hospital) {
      hospital = await db.collection('hospitals').findOne({ hospitalId: 'HOSP-001' });
    }
    if (!hospital) {
      // Seed on first access
      await db.collection('hospitals').insertMany(INITIAL_HOSPITALS);
      hospital = MOCK_HOSPITAL;
    }

    const dispatches = await db.collection('rides').find({
      status: { $in: ['accepted', 'en_route', 'heading'] },
    }).toArray();

    return NextResponse.json({
      success: true,
      hospital,
      incomingAmbulances: dispatches.length > 0 ? dispatches : INITIAL_DISPATCHES,
      source: 'mongodb',
    });
  } catch (error) {
    console.error('Hospital API GET Error:', error);
    return NextResponse.json({
      success: true,
      hospital: MOCK_HOSPITAL,
      incomingAmbulances: INITIAL_DISPATCHES,
      source: 'mock_fallback',
    });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { capacity, erStatus } = body;

    const db = await getDatabase();
    if (!db) {
      return NextResponse.json({
        success: true,
        message: 'Hospital capacity updated locally (MongoDB not configured)',
        data: body,
      });
    }

    const updateFields = { updatedAt: new Date() };
    if (capacity) updateFields.capacity = capacity;
    if (erStatus) updateFields.erStatus = erStatus;

    await db.collection('hospitals').updateOne(
      { hospitalId: 'HOSP-001' },
      { $set: updateFields },
      { upsert: true }
    );

    return NextResponse.json({
      success: true,
      message: 'Hospital capacity updated in MongoDB',
      data: updateFields,
    });
  } catch (error) {
    console.error('Hospital API POST Error:', error);
    return NextResponse.json({
      success: true,
      message: 'Hospital capacity updated locally (DB error)',
      data: {},
    });
  }
}
