export const getNearbyCare = async (req, res) => {
  try {
    const { lat, lng, facility_type = 'hospital' } = req.body;

    if (!lat || !lng) {
      return res.status(400).json({ error: 'lat and lng required' });
    }

    const radius = facility_type === 'clinic' ? 3000 : 10000;

    let queryTags = '';
    if (facility_type === 'clinic') {
      queryTags = `
        node["amenity"="clinic"](around:${radius},${lat},${lng});
        way["amenity"="clinic"](around:${radius},${lat},${lng});
        node["amenity"="doctors"](around:${radius},${lat},${lng});
        way["amenity"="doctors"](around:${radius},${lat},${lng});
      `;
    } else {
      queryTags = `
        node["amenity"="hospital"](around:${radius},${lat},${lng});
        way["amenity"="hospital"](around:${radius},${lat},${lng});
      `;
    }

    const query = `[out:json][timeout:25];(${queryTags});out center;`;

    const MIRRORS = [
      'https://overpass-api.de/api/interpreter',
      'https://overpass.kumi.systems/api/interpreter',
      'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
    ];

    let data = null;
    let lastError = null;

    for (const mirror of MIRRORS) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 20000);

        const fetchRes = await fetch(mirror, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'SanjeevaniHealthApp/1.0',
            Accept: 'application/json',
          },
          body: 'data=' + encodeURIComponent(query),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!fetchRes.ok) { lastError = `HTTP ${fetchRes.status} from ${mirror}`; continue; }

        const contentType = fetchRes.headers.get('content-type') || '';
        if (!contentType.includes('json')) { lastError = `Non-JSON from ${mirror}`; continue; }

        data = await fetchRes.json();
        break;
      } catch (e) {
        lastError = e.message;
        continue;
      }
    }

    if (!data) return res.json({ facilities: [], _source: 'error', error: lastError });
    if (!data.elements || data.elements.length === 0) {
      return res.json({ error: 'ZERO_RESULTS', facilities: [], _source: 'openstreetmap' });
    }

    const facilities = data.elements
      .filter((el) => el.tags && el.tags.name)
      .slice(0, 5)
      .map((el) => {
        const pLat = el.lat || el.center?.lat;
        const pLng = el.lon || el.center?.lon;
        const name = el.tags.name;
        let vicinity = [];
        if (el.tags['addr:street']) vicinity.push(el.tags['addr:street']);
        if (el.tags['addr:city']) vicinity.push(el.tags['addr:city']);
        return {
          place_id: el.id.toString(),
          name,
          vicinity: vicinity.length > 0 ? vicinity.join(', ') : 'Location on Map',
          rating: null,
          open_now: el.tags.opening_hours ? true : null,
          lat: pLat,
          lng: pLng,
          maps_url: `https://www.openstreetmap.org/?mlat=${pLat}&mlon=${pLng}#map=18/${pLat}/${pLng}`,
        };
      });

    return res.json({ facilities, _source: 'openstreetmap' });
  } catch (err) {
    console.error('[nearby-care]', err);
    return res.json({ facilities: [], _source: 'error', error: err.message });
  }
};
