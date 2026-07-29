import { getDatabase } from '../config/db.js';
import { IN_MEMORY_RIDES, generateMockRideId, MOCK_DRIVERS } from '../config/mockData.js';
import { ObjectId } from 'mongodb';

function isObjectId(str) {
  return /^[a-f\d]{24}$/i.test(str);
}

export const requestRide = async (req, res) => {
  try {
    const data = req.body;

    try {
      const db = await getDatabase();
      if (db) {
        const rideDoc = { ...data, status: 'pending', createdAt: new Date() };
        const result = await db.collection('rides').insertOne(rideDoc);
        return res.json({ success: true, rideId: result.insertedId.toString(), _source: 'mongodb' });
      }
    } catch (dbErr) {
      console.warn('[rides/request] MongoDB error, using in-memory store:', dbErr.message);
    }

    const rideId = generateMockRideId();
    IN_MEMORY_RIDES.set(rideId, { _id: rideId, ...data, status: 'pending', createdAt: new Date() });

    setTimeout(() => {
      const ride = IN_MEMORY_RIDES.get(rideId);
      if (ride && ride.status === 'pending') {
        ride.status = 'accepted';
        ride.driverId = 'DRV-001';
        ride.driver = {
          name: 'Rajesh Kumar', initials: 'RK', color: '#EF4444',
          rating: '4.9', trips: 1240, experience: '8 yrs',
          phone: '+919876543210', vehicle: 'DL-01-AB-1234', model: 'Tata Winger ALS',
        };
        ride.acceptedAt = new Date();
        IN_MEMORY_RIDES.set(rideId, ride);
      }
    }, 5000);

    return res.json({ success: true, rideId, _source: 'mock' });
  } catch (err) {
    console.error('[rides/request] Fatal error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const getRideStatus = async (req, res) => {
  try {
    const rideId = req.query.id;
    if (!rideId) return res.status(400).json({ error: 'Missing id' });

    if (IN_MEMORY_RIDES.has(rideId)) {
      const ride = IN_MEMORY_RIDES.get(rideId);
      return res.json({ success: true, ride, _source: 'mock' });
    }

    if (isObjectId(rideId)) {
      try {
        const db = await getDatabase();
        if (db) {
          const ride = await db.collection('rides').findOne({ _id: new ObjectId(rideId) });
          if (!ride) return res.status(404).json({ error: 'Ride not found' });

          if (ride.status === 'accepted' && ride.driverId) {
            const driver = await db.collection('ambulances').findOne({ driver_id: ride.driverId });
            ride.driver = driver || MOCK_DRIVERS.find((d) => d.driver_id === ride.driverId) || MOCK_DRIVERS[0];
          }

          return res.json({ success: true, ride, _source: 'mongodb' });
        }
      } catch (dbErr) {
        console.warn('[rides/status] MongoDB error:', dbErr.message);
      }
    }

    return res.status(404).json({ error: 'Ride not found', rideId });
  } catch (err) {
    console.error('[rides/status] Fatal error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const driverGetRide = async (req, res) => {
  try {
    const { tier } = req.query;

    try {
      const db = await getDatabase();
      if (db) {
        const query = { status: 'pending' };
        if (tier) query['tier.id'] = tier;
        const pendingRide = await db.collection('rides').findOne(query, { sort: { createdAt: 1 } });
        return res.json({ success: true, ride: pendingRide, _source: 'mongodb' });
      }
    } catch (dbErr) {
      console.warn('[rides/driver GET] MongoDB error, using in-memory store:', dbErr.message);
    }

    let pendingRide = null;
    for (const [, ride] of IN_MEMORY_RIDES) {
      if (ride.status === 'pending') {
        if (!tier || ride.tier?.id === tier) { pendingRide = ride; break; }
      }
    }
    return res.json({ success: true, ride: pendingRide, _source: 'mock' });
  } catch (err) {
    console.error('[rides/driver GET] Fatal error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const driverUpdateRide = async (req, res) => {
  try {
    const { rideId, driverId, action, status } = req.body;
    if (!rideId) return res.status(400).json({ success: false, error: 'rideId is required' });

    if (IN_MEMORY_RIDES.has(rideId)) {
      const ride = IN_MEMORY_RIDES.get(rideId);
      if (action === 'accept') {
        if (ride.status !== 'pending') return res.status(400).json({ success: false, error: 'Ride already accepted or not pending' });
        ride.status = 'accepted'; ride.driverId = driverId; ride.acceptedAt = new Date();
        IN_MEMORY_RIDES.set(rideId, ride);
        return res.json({ success: true, ride });
      }
      if (action === 'update_status') {
        ride.status = status; ride.updatedAt = new Date();
        IN_MEMORY_RIDES.set(rideId, ride);
        return res.json({ success: true, ride });
      }
      return res.json({ success: true });
    }

    if (isObjectId(rideId)) {
      try {
        const db = await getDatabase();
        if (db) {
          if (action === 'accept') {
            const result = await db.collection('rides').findOneAndUpdate(
              { _id: new ObjectId(rideId), status: 'pending' },
              { $set: { status: 'accepted', driverId, acceptedAt: new Date() } },
              { returnDocument: 'after' }
            );
            if (!result) return res.status(400).json({ success: false, error: 'Ride already accepted or not found' });
            return res.json({ success: true, ride: result });
          }
          if (action === 'update_status') {
            const result = await db.collection('rides').findOneAndUpdate(
              { _id: new ObjectId(rideId), driverId },
              { $set: { status, updatedAt: new Date() } },
              { returnDocument: 'after' }
            );
            if (!result) return res.status(404).json({ success: false, error: 'Ride not found or not owned by driver' });
            return res.json({ success: true, ride: result });
          }
          return res.json({ success: true });
        }
      } catch (dbErr) {
        console.warn('[rides/driver POST] MongoDB error:', dbErr.message);
        return res.status(500).json({ success: false, error: 'Database error: ' + dbErr.message });
      }
    }

    return res.status(404).json({ success: false, error: 'Ride not found' });
  } catch (err) {
    console.error('[rides/driver POST] Fatal error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};
