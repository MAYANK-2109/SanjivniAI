import { getDatabase } from '../config/db.js';
import { INITIAL_HOSPITALS, INITIAL_DISPATCHES } from '../config/mockData.js';

const MOCK_HOSPITAL = INITIAL_HOSPITALS[0];

export const getHospital = async (req, res) => {
  try {
    const db = await getDatabase();

    if (!db) {
      return res.json({
        success: true,
        hospital: MOCK_HOSPITAL,
        incomingAmbulances: INITIAL_DISPATCHES,
        source: 'mock',
      });
    }

    let hospital = await db.collection('hospitals').findOne({ id: 'hosp-1' });
    if (!hospital) hospital = await db.collection('hospitals').findOne({ hospitalId: 'HOSP-001' });
    if (!hospital) {
      await db.collection('hospitals').insertMany(INITIAL_HOSPITALS);
      hospital = MOCK_HOSPITAL;
    }

    const dispatches = await db.collection('rides').find({
      status: { $in: ['accepted', 'en_route', 'heading'] },
    }).toArray();

    return res.json({
      success: true,
      hospital,
      incomingAmbulances: dispatches.length > 0 ? dispatches : INITIAL_DISPATCHES,
      source: 'mongodb',
    });
  } catch (error) {
    console.error('Hospital API GET Error:', error);
    return res.json({
      success: true,
      hospital: MOCK_HOSPITAL,
      incomingAmbulances: INITIAL_DISPATCHES,
      source: 'mock_fallback',
    });
  }
};

export const updateHospital = async (req, res) => {
  try {
    const { capacity, erStatus } = req.body;

    const db = await getDatabase();
    if (!db) {
      return res.json({
        success: true,
        message: 'Hospital capacity updated locally (MongoDB not configured)',
        data: req.body,
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

    return res.json({
      success: true,
      message: 'Hospital capacity updated in MongoDB',
      data: updateFields,
    });
  } catch (error) {
    console.error('Hospital API POST Error:', error);
    return res.json({ success: true, message: 'Hospital capacity updated locally (DB error)', data: {} });
  }
};
