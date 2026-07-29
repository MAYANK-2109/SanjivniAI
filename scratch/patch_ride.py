import re

with open('components/RideBookingModal.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update states
content = content.replace(
    "const [selectedTier, setSelectedTier] = useState(null);",
    "const [selectedTier, setSelectedTier] = useState(AMBULANCE_TIERS[0]);\n  const [pickupCoords, setPickupCoords] = useState(null);\n  const [destinationCoords, setDestinationCoords] = useState(null);"
)

# 2. Update handleCurrentLocation
content = content.replace(
    "const res = await fetch(apiUrl(`/api/places/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`));",
    "setPickupCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });\n        const res = await fetch(apiUrl(`/api/places/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`));"
)

# 3. Update Autocomplete suggestion click
content = content.replace(
    "setDestination(place.display_name);",
    "setDestination(place.display_name);\n                                  setDestinationCoords({ lat: place.lat, lon: place.lon });"
)

# 4. Remove auto-advance SEARCHING -> SELECT_TIER
content = re.sub(
    r"// Auto-advance from SEARCHING → SELECT_TIER[\s\S]*?}, \[step\]\);",
    "",
    content
)

# 5. Replace handleSelectTier with handleBookRide
handle_select_tier_old = """  async function handleSelectTier(tier) {
    setSelectedTier(tier);
    setStep('FINDING_DRIVER');
    
    // Create the real ride request in MongoDB
    try {
      const res = await fetch(apiUrl('/api/rides/request'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier: tier,
          patient: {
            name: 'Patient',
            location: pickup || patientLocation || 'Current Location',
            destination: destination || 'Nearest Hospital',
            condition: 'Emergency — Medical Triage',
          },
          fare: tier.price
        })
      });
      const data = await res.json();
      if (data.success) {
        setActiveRideId(data.rideId);
      }
    } catch (err) {
      console.error(err);
      setDriverDeclineReason('Network error. Failed to request ride.');
      setTimeout(() => setStep('SEARCHING'), 3000);
    }
  }"""

handle_book_ride_new = """  async function handleBookRide() {
    if (!selectedTier || !pickup || !destination) return;
    setStep('FINDING_DRIVER');
    
    try {
      const res = await fetch(apiUrl('/api/rides/request'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier: selectedTier,
          patient: {
            name: 'Patient',
            location: pickup || patientLocation || 'Current Location',
            lat: pickupCoords?.lat,
            lng: pickupCoords?.lon,
            destination: destination || 'Nearest Hospital',
            condition: 'Emergency — Medical Triage',
          },
          fare: selectedTier.price
        })
      });
      const data = await res.json();
      if (data.success) {
        setActiveRideId(data.rideId);
      }
    } catch (err) {
      console.error(err);
      setDriverDeclineReason('Network error. Failed to request ride.');
      setTimeout(() => setStep('ENTER_LOCATION'), 3000);
    }
  }"""

content = content.replace(handle_select_tier_old, handle_book_ride_new)

# 6. Replace 'SEARCHING' step logic and button in ENTER_LOCATION
button_old = """                  <button
                    onClick={() => setStep('SEARCHING')}
                    disabled={!pickup || !destination}
                    className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-red-600 py-3.5 font-display text-[14px] font-bold text-white shadow-lg shadow-red-900/40 hover:bg-red-500 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                  >
                    Find Ambulances
                  </button>"""

tier_selection_new = """                  <div className="mt-2 space-y-2">
                    <p className="font-display text-[13px] font-bold text-white mb-2">Select Ambulance Type</p>
                    {AMBULANCE_TIERS.map(t => (
                      <button
                        key={t.id}
                        onClick={() => setSelectedTier(t)}
                        className={`w-full text-left rounded-xl border p-3 transition-all flex items-center gap-3 ${selectedTier?.id === t.id ? 'bg-white/10 scale-[1.02]' : 'bg-white/5 hover:bg-white/10'}`}
                        style={{ borderColor: selectedTier?.id === t.id ? t.color : 'rgba(255,255,255,0.1)' }}
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-black/40"><t.icon size={20} color={t.color} /></div>
                        <div className="flex-1 min-w-0">
                           <div className="flex justify-between items-center">
                             <p className="font-display text-[14px] font-bold text-white">{t.label}</p>
                             <p className="font-display text-[14px] font-black" style={{ color: t.color }}>₹{t.price}</p>
                           </div>
                           <p className="text-[11px] text-slate-400 truncate">{t.eta} • {t.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={handleBookRide}
                    disabled={!pickup || !destination || !selectedTier}
                    className="w-full mt-4 flex items-center justify-center gap-2 rounded-xl bg-red-600 py-3.5 font-display text-[14px] font-bold text-white shadow-lg shadow-red-900/40 hover:bg-red-500 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                  >
                    Book {selectedTier?.short} Ambulance
                  </button>"""

content = content.replace(button_old, tier_selection_new)

# 7. Remove SEARCHING and SELECT_TIER steps entirely
step_searching = re.search(r"\{\/\* ── Step: SEARCHING ─────────────────────────────────── \*\/\}.*?\{\/\* ── Step: FINDING_DRIVER ───────────────────────────── \*\/\}", content, flags=re.DOTALL)
if step_searching:
    content = content.replace(step_searching.group(0), "{/* ── Step: FINDING_DRIVER ───────────────────────────── */}")

# 8. Update EN_ROUTE state UI
en_route_old = """              {/* ── Step: EN_ROUTE ─────────────────────────────────── */}
              {step === 'EN_ROUTE' && driver && (
                <motion.div
                  key="enroute"
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="p-5 flex flex-col gap-4"
                >
                  {/* Big ETA timer */}
                  <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/8 p-5 text-center">
                    <p className="font-mono text-[11px] text-emerald-400 uppercase tracking-wider mb-2">
                      Ambulance En Route
                    </p>
                    <div className="font-display text-[42px] font-black leading-none text-emerald-400 tracking-tight">
                      {Math.floor(etaSeconds / 60)}:{(etaSeconds % 60).toString().padStart(2, '0')}
                    </div>
                    <p className="text-[12px] text-emerald-500/70 mt-1 font-mono">{driver.vehicle} • {driver.model}</p>
                  </div>"""

en_route_new = """              {/* ── Step: EN_ROUTE ─────────────────────────────────── */}
              {step === 'EN_ROUTE' && driver && (
                <motion.div
                  key="enroute"
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="p-5 flex flex-col gap-4"
                >
                  {rideStatus === 'cancelled' ? (
                     <div className="rounded-2xl border border-red-500/20 bg-red-500/8 p-5 text-center">
                       <p className="font-mono text-[14px] font-bold text-red-400 mb-2">Ride Cancelled</p>
                       <p className="text-[12px] text-red-500/70">The driver has cancelled the request.</p>
                     </div>
                  ) : rideStatus === 'completed' ? (
                     <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/8 p-5 text-center">
                       <p className="font-mono text-[14px] font-bold text-emerald-400 mb-2">Trip Completed</p>
                       <p className="text-[12px] text-emerald-500/70">You have arrived safely.</p>
                     </div>
                  ) : (
                    <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/8 p-5 text-center">
                      <p className="font-mono text-[11px] text-emerald-400 uppercase tracking-wider mb-2">
                        {rideStatus === 'trip_started' ? 'In Transit to Hospital' : rideStatus === 'arrived' ? 'Ambulance Arrived' : 'Ambulance En Route'}
                      </p>
                      <div className="font-display text-[42px] font-black leading-none text-emerald-400 tracking-tight">
                        {Math.floor(etaSeconds / 60)}:{(etaSeconds % 60).toString().padStart(2, '0')}
                      </div>
                      <p className="text-[12px] text-emerald-500/70 mt-1 font-mono">{driver.vehicle} • {driver.model}</p>
                    </div>
                  )}"""

content = content.replace(en_route_old, en_route_new)

with open('components/RideBookingModal.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Patched RideBookingModal.jsx")
