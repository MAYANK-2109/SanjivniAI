export const autocomplete = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ error: 'Query is required' });

    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&addressdetails=1&limit=5&countrycodes=in`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'SanjeevaniAI-TriageSystem/1.0 (contact@sanjeevani.com)'
      }
    });

    if (!response.ok) {
      throw new Error(`Nominatim API returned ${response.status}`);
    }

    const data = await response.json();
    return res.json({ success: true, places: data });
  } catch (err) {
    console.error('[places/autocomplete] Error:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to fetch autocomplete suggestions' });
  }
};

export const reverseGeocode = async (req, res) => {
  try {
    const { lat, lon } = req.query;
    if (!lat || !lon) return res.status(400).json({ error: 'Lat and lon are required' });

    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'SanjeevaniAI-TriageSystem/1.0 (contact@sanjeevani.com)'
      }
    });

    if (!response.ok) {
      throw new Error(`Nominatim API returned ${response.status}`);
    }

    const data = await response.json();
    return res.json({ success: true, address: data.display_name });
  } catch (err) {
    console.error('[places/reverse] Error:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to reverse geocode' });
  }
};
