'use client';
import { apiUrl } from '@/lib/apiClient';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, Stethoscope, AlertTriangle, Star } from 'lucide-react';
import Panel from './Panel';

export default function NearbyFacilities({ facilityType = 'hospital', trigger }) {
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState(null);
  const [isMock, setIsMock]         = useState(false);

  useEffect(() => {
    if (!trigger) return;
    setLoading(true);
    setError(null);
    setFacilities([]);

    if (!navigator.geolocation) {
      fetchFacilities(null, null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => fetchFacilities(pos.coords.latitude, pos.coords.longitude),
      ()    => fetchFacilities(null, null),
      { timeout: 8000 }
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger]);

  async function fetchFacilities(lat, lng) {
    try {
      const res = await fetch(apiUrl('/api/nearby-care'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat: lat ?? 28.6139, lng: lng ?? 77.2090, facility_type: facilityType }),
      });
      const data = await res.json();
      setFacilities(data.facilities ?? []);
      setIsMock(data._source === 'mock' || data._source === 'mock_error');
    } catch {
      setError('Could not load nearby facilities.');
    } finally {
      setLoading(false);
    }
  }

  if (!trigger) return null;

  return (
    <Panel
      eyebrow="Nearby Care"
      title={facilityType === 'hospital' ? <><Building2 size={16} /> Nearest Hospitals</> : <><Stethoscope size={16} /> Nearby Clinics & Doctors</>}
      statusDot={loading ? '#F59E0B' : '#34C98E'}
      accentColor="#34C98E"
    >
      {isMock && (
        <div className="mb-3 flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-950/30 px-4 py-2 text-[12px] text-amber-400/80 font-mono">
          <AlertTriangle size={14} />
          <span>Mock data — add GOOGLE_MAPS_API_KEY for live results near you.</span>
        </div>
      )}

      {loading && (
        <div className="space-y-3">
          {[0,1,2].map(i => (
            <div key={i} className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/3 p-4">
              <div className="h-10 w-10 rounded-xl skeleton shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-2/3 rounded skeleton" />
                <div className="h-3 w-1/2 rounded skeleton" />
              </div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <p className="text-[13px] text-red-400">{error}</p>
      )}

      <AnimatePresence>
        {!loading && facilities.length > 0 && (
          <div className="space-y-2.5">
            {facilities.map((f, i) => (
              <motion.a
                key={f.place_id ?? i}
                href={f.maps_url}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                className="facility-card flex items-center gap-3 rounded-xl border border-white/8 bg-white/3 p-4 hover:bg-white/6 no-underline block"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                  {facilityType === 'hospital' ? <Building2 size={18} /> : <Stethoscope size={18} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-display text-[14px] font-semibold text-slate-100 truncate">{f.name}</p>
                  <p className="text-[12px] text-slate-500 truncate">{f.vicinity}</p>
                </div>
                <div className="text-right shrink-0">
                  {f.rating && (
                    <p className="flex items-center gap-1 text-[12px] font-mono text-amber-400">
                      <Star size={12} fill="currentColor" /> {f.rating}
                    </p>
                  )}
                  <span className={`text-[11px] font-mono font-semibold ${f.open_now ? 'text-mint-400' : 'text-red-400'}`}>
                    {f.open_now === null ? '—' : f.open_now ? 'Open' : 'Closed'}
                  </span>
                </div>
                <svg className="h-4 w-4 shrink-0 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg>
              </motion.a>
            ))}
          </div>
        )}
      </AnimatePresence>
    </Panel>
  );
}
