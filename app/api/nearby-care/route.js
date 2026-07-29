/**
 * app/api/nearby-care/route.js
 * Proxies OpenStreetMap Overpass API to find nearby hospitals or clinics.
 */

import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { lat, lng, facility_type = 'hospital' } = await request.json();

    if (!lat || !lng) {
      return NextResponse.json({ error: 'lat and lng required' }, { status: 400 });
    }

    // Determine radius based on facility type
    const radius = facility_type === 'clinic' ? 3000 : 10000;
    
    // Construct Overpass QL query
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

    // Try multiple Overpass API mirrors
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

        const res = await fetch(mirror, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'SanjeevaniHealthApp/1.0',
            'Accept': 'application/json',
          },
          body: 'data=' + encodeURIComponent(query),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!res.ok) { lastError = `HTTP ${res.status} from ${mirror}`; continue; }

        const contentType = res.headers.get('content-type') || '';
        if (!contentType.includes('json')) { lastError = `Non-JSON from ${mirror}`; continue; }

        data = await res.json();
        break;
      } catch (e) {
        lastError = e.message;
        continue;
      }
    }

    if (!data) {
      return NextResponse.json({ facilities: [], _source: 'error', error: lastError });
    }

    if (!data.elements || data.elements.length === 0) {
      return NextResponse.json({ error: 'ZERO_RESULTS', facilities: [], _source: 'openstreetmap' });
    }

    // Map the Overpass response to our app's schema
    const facilities = data.elements
      .filter(el => el.tags && el.tags.name) // Require a name
      .slice(0, 5) // Return top 5
      .map(el => {
        const pLat = el.lat || el.center?.lat;
        const pLng = el.lon || el.center?.lon;
        const name = el.tags.name;
        
        // Construct a vicinity string if address tags exist
        let vicinity = [];
        if (el.tags['addr:street']) vicinity.push(el.tags['addr:street']);
        if (el.tags['addr:city']) vicinity.push(el.tags['addr:city']);
        
        return {
          place_id: el.id.toString(),
          name: name,
          vicinity: vicinity.length > 0 ? vicinity.join(', ') : 'Location on Map',
          rating: null, // OSM doesn't typically provide ratings natively
          open_now: el.tags.opening_hours ? true : null, // Very basic heuristic
          lat: pLat,
          lng: pLng,
          maps_url: `https://www.openstreetmap.org/?mlat=${pLat}&mlon=${pLng}#map=18/${pLat}/${pLng}`,
        };
      });

    return NextResponse.json({ facilities, _source: 'openstreetmap' });
  } catch (err) {
    console.error('[nearby-care]', err);
    return NextResponse.json({ facilities: [], _source: 'error', error: err.message });
  }
}
