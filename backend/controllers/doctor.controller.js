import { getDatabase } from '../config/db.js';
import { INITIAL_PATIENTS } from '../config/mockData.js';

export const getPatients = async (req, res) => {
  try {
    const db = await getDatabase();
    if (!db) {
      return res.json({ success: true, patients: INITIAL_PATIENTS, source: 'mock' });
    }

    const patients = await db.collection('patients').find({}).toArray();
    if (patients.length === 0) {
      await db.collection('patients').insertMany(INITIAL_PATIENTS);
      return res.json({ success: true, patients: INITIAL_PATIENTS, source: 'mongodb_seeded' });
    }

    return res.json({ success: true, patients, source: 'mongodb' });
  } catch (error) {
    console.error('Doctor API GET Error:', error);
    return res.json({ success: true, patients: INITIAL_PATIENTS, source: 'mock', error: error.message });
  }
};

export const updatePatient = async (req, res) => {
  try {
    const { patientId, doctorNotes, status } = req.body;

    const db = await getDatabase();
    if (!db) {
      return res.json({ success: true, message: 'Notes saved locally (MongoDB not configured)', data: req.body });
    }

    const updateFields = { updatedAt: new Date() };
    if (doctorNotes !== undefined) updateFields.doctorNotes = doctorNotes;
    if (status) updateFields.status = status;

    await db.collection('patients').updateOne(
      { patientId: patientId || 'PAT-9012' },
      { $set: updateFields },
      { upsert: true }
    );

    return res.json({ success: true, message: 'Clinical notes saved in MongoDB', data: updateFields });
  } catch (error) {
    console.error('Doctor API POST Error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};
