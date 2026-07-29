import { ObjectId } from 'mongodb';
import { getDatabase } from '../config/db.js';

export const createAppointment = async (req, res) => {
  try {
    const body = req.body;
    const db = await getDatabase();

    const appointment = {
      ...body,
      status: 'pending',
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
    const { role, targetId } = req.query;

    const db = await getDatabase();
    const query = {};
    if (role === 'doctor' && targetId) query.doctorId = targetId;
    if (role === 'hospital' && targetId) query.hospitalId = targetId;

    const appointments = await db.collection('appointments')
      .find(query)
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();

    return res.json({ success: true, appointments });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const updateAppointment = async (req, res) => {
  try {
    const { id, status } = req.body;
    const db = await getDatabase();

    await db.collection('appointments').updateOne(
      { _id: new ObjectId(id) },
      { $set: { status, updatedAt: new Date() } }
    );

    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};
