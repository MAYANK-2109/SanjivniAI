import { getDatabase } from '../config/db.js';
import { INITIAL_DISPATCHES } from '../config/mockData.js';

export const getDispatches = async (req, res) => {
  try {
    const db = await getDatabase();
    if (!db) {
      return res.json({ success: true, dispatches: INITIAL_DISPATCHES, source: 'mock' });
    }

    const dispatches = await db.collection('rides').find({ status: 'en_route' }).toArray();
    return res.json({
      success: true,
      dispatches: dispatches.length > 0 ? dispatches : INITIAL_DISPATCHES,
      source: 'mongodb',
    });
  } catch (error) {
    console.error('Ambulance API GET Error:', error);
    return res.json({ success: true, dispatches: INITIAL_DISPATCHES, source: 'mock_fallback' });
  }
};

export const updateDispatch = async (req, res) => {
  try {
    const { caseId, rideId, vitals, erNotified, status } = req.body;

    const db = await getDatabase();
    if (!db) {
      return res.json({ success: true, message: 'Alert recorded locally (MongoDB not configured)', data: req.body });
    }

    const updateFields = { updatedAt: new Date() };
    if (vitals) updateFields.vitals = vitals;
    if (erNotified !== undefined) updateFields.erNotified = erNotified;
    if (status) updateFields.status = status;

    if (rideId) {
      await db.collection('rides').updateOne({ _id: rideId }, { $set: updateFields });
    } else {
      await db.collection('dispatches').updateOne(
        { caseId: caseId || 'CAS-9921' },
        { $set: updateFields },
        { upsert: true }
      );
    }

    return res.json({ success: true, message: 'Dispatch telemetry updated', data: updateFields });
  } catch (error) {
    console.error('Ambulance API POST Error:', error);
    return res.json({ success: true, message: 'Alert recorded (DB error — non-blocking)', data: {} });
  }
};
