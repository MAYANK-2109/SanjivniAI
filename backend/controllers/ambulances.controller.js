import { getDatabase } from '../config/db.js';

export const getNearbyAmbulances = async (req, res) => {
  try {
    const { lat, lng } = req.body;
    const db = await getDatabase();

    if (!db) throw new Error('Database connection unavailable');

    let query = {};
    if (lat && lng) {
      query = {
        location: {
          $near: {
            $geometry: { type: 'Point', coordinates: [lng, lat] },
            $maxDistance: 10000,
          },
        },
        status: 'available',
      };
    } else {
      query = { status: 'available' };
    }

    const ambulances = await db.collection('ambulances').find(query).limit(10).toArray();
    return res.json({ success: true, ambulances });
  } catch (error) {
    console.error('[ambulances api]', error);
    return res.status(500).json({ error: error.message });
  }
};
