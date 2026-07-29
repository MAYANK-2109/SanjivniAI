import { getDatabase } from '../config/db.js';
import { IN_MEMORY_RIDES, generateMockRideId, MOCK_DRIVERS } from '../config/mockData.js';
import { ObjectId } from 'mongodb';

function isObjectId(str) {
  return /^[a-f\d]{24}$/i.test(str);
}

/** Haversine distance in km between two lat/lng points */
function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── POST /api/rides/request ──────────────────────────────────────────────────
export const requestRide = async (req, res) => {
  try {
    const data = req.body;
    // NO auto-accept. The ride stays PENDING until a real driver accepts it.
    const rideDoc = { ...data, status: 'pending', createdAt: new Date() };

    let rideIdStr;
    let isMongo = false;

    try {
      const db = await getDatabase();
      if (db) {
        const result = await db.collection('rides').insertOne(rideDoc);
        rideIdStr = result.insertedId.toString();
        isMongo = true;
      }
    } catch (dbErr) {
      console.warn('[rides/request] MongoDB error, using in-memory store:', dbErr.message);
    }

    if (!isMongo) {
      rideIdStr = generateMockRideId();
      IN_MEMORY_RIDES.set(rideIdStr, { _id: rideIdStr, ...rideDoc });
    }

    return res.json({ success: true, rideId: rideIdStr, _source: isMongo ? 'mongodb' : 'mock' });
  } catch (err) {
    console.error('[rides/request] Fatal error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

// ─── GET /api/rides/status?id=<rideId> ───────────────────────────────────────
export const getRideStatus = async (req, res) => {
  try {
    const rideId = req.query.id;
    if (!rideId) return res.status(400).json({ error: 'Missing id' });

    // In-memory fallback
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
          // driver is already embedded in the ride doc when a driver accepts
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

// ─── GET /api/rides/driver?lat=<>&lng=<>&tier=<>&driverId=<> ────────────────
// Returns one PENDING ride within 10km that this driver has NOT declined.
export const driverGetRide = async (req, res) => {
  try {
    const { tier, lat, lng, driverId } = req.query;
    const driverLat = parseFloat(lat);
    const driverLng = parseFloat(lng);
    const hasLocation = !isNaN(driverLat) && !isNaN(driverLng);

    // ── MongoDB path ──────────────────────────────────────────────────────────
    try {
      const db = await getDatabase();
      if (db) {
        const query = { status: 'pending' };
        if (tier) query['tier.id'] = tier;
        // Exclude rides this driver already declined
        if (driverId) query['declinedBy'] = { $not: { $elemMatch: { $eq: driverId } } };

        const candidates = await db
          .collection('rides')
          .find(query)
          .sort({ createdAt: 1 })
          .limit(20)
          .toArray();

        let matchedRide = null;
        for (const ride of candidates) {
          if (!hasLocation) { matchedRide = ride; break; }
          const pLat = ride.patient?.lat;
          const pLng = ride.patient?.lng;
          if (pLat != null && pLng != null) {
            const dist = haversineKm(driverLat, driverLng, pLat, pLng);
            if (dist <= 10) { matchedRide = { ...ride, _distanceKm: dist.toFixed(2) }; break; }
          } else {
            matchedRide = ride; break;
          }
        }

        return res.json({ success: true, ride: matchedRide || null, _source: 'mongodb' });
      }
    } catch (dbErr) {
      console.warn('[rides/driver GET] MongoDB error, using in-memory store:', dbErr.message);
    }

    // ── In-memory fallback ────────────────────────────────────────────────────
    let pendingRide = null;
    for (const [, ride] of IN_MEMORY_RIDES) {
      if (ride.status !== 'pending') continue;
      if (tier && ride.tier?.id !== tier) continue;
      if (driverId && (ride.declinedBy || []).includes(driverId)) continue; // skip if declined
      if (hasLocation && ride.patient?.lat != null && ride.patient?.lng != null) {
        const dist = haversineKm(driverLat, driverLng, ride.patient.lat, ride.patient.lng);
        if (dist > 10) continue;
        ride._distanceKm = dist.toFixed(2);
      }
      pendingRide = ride;
      break;
    }
    return res.json({ success: true, ride: pendingRide, _source: 'mock' });
  } catch (err) {
    console.error('[rides/driver GET] Fatal error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

// ─── POST /api/rides/driver ───────────────────────────────────────────────────
export const driverUpdateRide = async (req, res) => {
  try {
    const { rideId, driverId, driverProfile, action, status } = req.body;
    if (!rideId) return res.status(400).json({ success: false, error: 'rideId is required' });

    // ── In-memory path ────────────────────────────────────────────────────────
    if (IN_MEMORY_RIDES.has(rideId)) {
      const ride = IN_MEMORY_RIDES.get(rideId);

      if (action === 'accept') {
        if (ride.status !== 'pending')
          return res.status(400).json({ success: false, error: 'Ride already accepted or not pending' });
        ride.status = 'accepted';
        ride.driverId = driverId;
        // Embed full driver profile so patient poll gets it immediately
        ride.driver = driverProfile || MOCK_DRIVERS.find(d => d.driver_id === driverId) || MOCK_DRIVERS[0];
        ride.acceptedAt = new Date();
        IN_MEMORY_RIDES.set(rideId, ride);
        return res.json({ success: true, ride });
      }

      if (action === 'update_status') {
        ride.status = status;
        ride.updatedAt = new Date();
        IN_MEMORY_RIDES.set(rideId, ride);
        return res.json({ success: true, ride });
      }

      if (action === 'decline') {
        // Add driverId to declinedBy — ride stays pending for other drivers
        if (driverId) {
          if (!ride.declinedBy) ride.declinedBy = [];
          if (!ride.declinedBy.includes(driverId)) ride.declinedBy.push(driverId);
          IN_MEMORY_RIDES.set(rideId, ride);
        }
        return res.json({ success: true });
      }

      return res.json({ success: true });
    }

    // ── MongoDB path ──────────────────────────────────────────────────────────
    if (isObjectId(rideId)) {
      try {
        const db = await getDatabase();
        if (db) {
          if (action === 'accept') {
            const embeddedDriver =
              driverProfile || MOCK_DRIVERS.find(d => d.driver_id === driverId) || MOCK_DRIVERS[0];

            const result = await db.collection('rides').findOneAndUpdate(
              { _id: new ObjectId(rideId), status: 'pending' },
              { $set: { status: 'accepted', driverId, driver: embeddedDriver, acceptedAt: new Date() } },
              { returnDocument: 'after' }
            );
            if (!result)
              return res.status(400).json({ success: false, error: 'Ride already accepted or not found' });
            return res.json({ success: true, ride: result });
          }

          if (action === 'update_status') {
            const result = await db.collection('rides').findOneAndUpdate(
              { _id: new ObjectId(rideId) },
              { $set: { status, updatedAt: new Date() } },
              { returnDocument: 'after' }
            );
            if (!result)
              return res.status(404).json({ success: false, error: 'Ride not found' });
            return res.json({ success: true, ride: result });
          }

          if (action === 'decline') {
            // Push driverId into declinedBy array — ride stays pending for others
            if (driverId) {
              await db.collection('rides').updateOne(
                { _id: new ObjectId(rideId) },
                { $addToSet: { declinedBy: driverId } }
              );
            }
            return res.json({ success: true });
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
