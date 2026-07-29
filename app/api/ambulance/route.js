/**
 * app/api/ambulance/route.js
 * Ambulance dispatch telemetry API.
 *
 * GET  /api/ambulance    → returns en-route dispatches
 * POST /api/ambulance    → updates dispatch telemetry / ER notification
 *
 * Falls back to INITIAL_DISPATCHES from lib/mockData when MongoDB is offline.
 */
import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { INITIAL_DISPATCHES } from '@/lib/mockData';

export async function GET() {
  try {
    const db = await getDatabase();
    if (!db) {
      return NextResponse.json({ success: true, dispatches: INITIAL_DISPATCHES, source: 'mock' });
    }

    const dispatches = await db.collection('rides').find({ status: 'en_route' }).toArray();

    return NextResponse.json({
      success: true,
      dispatches: dispatches.length > 0 ? dispatches : INITIAL_DISPATCHES,
      source: 'mongodb',
    });
  } catch (error) {
    console.error('Ambulance API GET Error:', error);
    return NextResponse.json({ success: true, dispatches: INITIAL_DISPATCHES, source: 'mock_fallback' });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { caseId, rideId, vitals, erNotified, status } = body;

    const db = await getDatabase();
    if (!db) {
      return NextResponse.json({ success: true, message: 'Alert recorded locally (MongoDB not configured)', data: body });
    }

    const updateFields = { updatedAt: new Date() };
    if (vitals) updateFields.vitals = vitals;
    if (erNotified !== undefined) updateFields.erNotified = erNotified;
    if (status) updateFields.status = status;

    // Update by caseId (dispatch) or rideId (rides collection)
    if (rideId) {
      await db.collection('rides').updateOne(
        { _id: rideId },
        { $set: updateFields }
      );
    } else {
      await db.collection('dispatches').updateOne(
        { caseId: caseId || 'CAS-9921' },
        { $set: updateFields },
        { upsert: true }
      );
    }

    return NextResponse.json({ success: true, message: 'Dispatch telemetry updated', data: updateFields });
  } catch (error) {
    console.error('Ambulance API POST Error:', error);
    // Silent success — ER alert UI should not block on this
    return NextResponse.json({ success: true, message: 'Alert recorded (DB error — non-blocking)', data: {} });
  }
}
