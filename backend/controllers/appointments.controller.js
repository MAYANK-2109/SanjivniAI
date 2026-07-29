import { ObjectId } from 'mongodb';
import { getDatabase } from '../config/db.js';

export const createAppointment = async (req, res) => {
  try {
    const body = req.body;
    const db = await getDatabase();

    const appointment = {
      ...body,
      status: 'pending',
      doctorNotes: '',
      createdAt: new Date(),
    };

    const result = await db.collection('appointments').insertOne(appointment);
    return res.json({ success: true, id: result.insertedId });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const getAppointments = async (req, res) => {
  try {
    const { role, targetId, today } = req.query;

    const db = await getDatabase();
    const query = {};
    if (role === 'doctor' && targetId) query.doctorId = targetId;
    if (role === 'hospital' && targetId) query.hospitalId = targetId;

    // Filter for today's appointments if requested
    if (today === 'true') {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date();
      end.setHours(23, 59, 59, 999);
      query.date = {
        $gte: start.toISOString().split('T')[0],
        $lte: end.toISOString().split('T')[0],
      };
    }

    const appointments = await db.collection('appointments')
      .find(query)
      .sort({ date: 1, time: 1 })
      .limit(100)
      .toArray();

    return res.json({ success: true, appointments });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const updateAppointment = async (req, res) => {
  try {
    const { id, status, doctorNotes } = req.body;
    if (!id) return res.status(400).json({ success: false, error: 'id is required' });

    const db = await getDatabase();

    const update = { updatedAt: new Date() };
    if (status !== undefined) update.status = status;
    if (doctorNotes !== undefined) update.doctorNotes = doctorNotes;

    await db.collection('appointments').updateOne(
      { _id: new ObjectId(id) },
      { $set: update }
    );

    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};
