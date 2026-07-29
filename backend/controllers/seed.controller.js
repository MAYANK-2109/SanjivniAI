import { getDatabase } from '../config/db.js';
import {
  INITIAL_PROFILES,
  INITIAL_DISPATCHES,
  INITIAL_PATIENTS,
  INITIAL_HOSPITALS,
} from '../config/mockData.js';

export const seedDatabase = async (req, res) => {
  try {
    const db = await getDatabase();
    if (!db) {
      return res.status(400).json({
        success: false,
        message: 'MongoDB URI is not configured in .env yet.',
      });
    }

    await db.collection('profiles').deleteMany({});
    await db.collection('profiles').insertMany(INITIAL_PROFILES);

    await db.collection('dispatches').deleteMany({});
    await db.collection('dispatches').insertMany(INITIAL_DISPATCHES);

    await db.collection('patients').deleteMany({});
    await db.collection('patients').insertMany(INITIAL_PATIENTS);

    await db.collection('hospitals').deleteMany({});
    await db.collection('hospitals').insertMany(INITIAL_HOSPITALS);

    return res.json({
      success: true,
      message: 'MongoDB successfully seeded with Sanjeevani collections!',
      collectionsSeeded: ['profiles', 'dispatches', 'patients', 'hospitals'],
    });
  } catch (error) {
    console.error('MongoDB Seed Error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};
