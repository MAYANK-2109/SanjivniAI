import re

with open('components/DriverRideManager.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update ActiveRidePanel signature to accept onStatusUpdate and onCancel
content = content.replace(
    "function ActiveRidePanel({ ride, onComplete }) {",
    "function ActiveRidePanel({ ride, onComplete, onStatusUpdate, onCancel }) {"
)

# 2. Update advanceStatus to use onStatusUpdate
advance_status_old = """  function advanceStatus() {
    const next = statusOrder[currentIdx + 1];
    if (next) setRideStatus(next);
    if (next === 'completed') setTimeout(() => onComplete(), 1500);
  }"""
  
advance_status_new = """  async function advanceStatus() {
    const next = statusOrder[currentIdx + 1];
    if (next) {
      setRideStatus(next);
      if (onStatusUpdate) await onStatusUpdate(next);
    }
    if (next === 'completed') setTimeout(() => onComplete(), 1500);
  }"""
content = content.replace(advance_status_old, advance_status_new)

# 3. Add map & cancel buttons below Action button
action_button_old = """        {current.action && (
          <button
            onClick={advanceStatus}
            className="w-full flex items-center justify-center gap-2 rounded-xl py-3 font-display text-[14px] font-bold text-white transition-all active:scale-95 shadow-lg"
            style={{ background: current.color, boxShadow: `0 4px 20px ${current.color}40` }}
          >
            {current.action}
          </button>
        )}"""

action_button_new = """        {current.action && (
          <button
            onClick={advanceStatus}
            className="w-full flex items-center justify-center gap-2 rounded-xl py-3 font-display text-[14px] font-bold text-white transition-all active:scale-95 shadow-lg"
            style={{ background: current.color, boxShadow: `0 4px 20px ${current.color}40` }}
          >
            {current.action}
          </button>
        )}
        
        <div className="flex gap-2 mt-2">
          {ride.patient.lat && ride.patient.lng && (
            <a 
              href={`https://www.google.com/maps/search/?api=1&query=${ride.patient.lat},${ride.patient.lng}`}
              target="_blank"
              rel="noreferrer"
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 py-2.5 font-display text-[12px] font-semibold text-slate-300 hover:text-white hover:bg-white/10 transition-all active:scale-95"
            >
              <MapPin size={14} /> View on Map
            </a>
          )}
          {rideStatus !== 'completed' && (
            <button
              onClick={() => onCancel && onCancel()}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 py-2.5 font-display text-[12px] font-semibold text-red-400 hover:bg-red-500/10 hover:border-red-500/30 transition-all active:scale-95"
            >
              <XCircle size={14} /> Cancel Ride
            </button>
          )}
        </div>"""
content = content.replace(action_button_old, action_button_new)

# 4. Update DriverRideManager to provide onStatusUpdate and onCancel
driver_manager_functions_old = """  function handleComplete() {
    setLastCompletedId(activeRide?._id);
    setActiveRide(null);
  }"""
  
driver_manager_functions_new = """  function handleComplete() {
    setLastCompletedId(activeRide?._id);
    setActiveRide(null);
  }
  
  async function handleStatusUpdate(status) {
    if (!activeRide) return;
    try {
      await fetch(apiUrl('/api/rides/driver'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rideId: activeRide._id, driverId: 'amb-1', action: 'update_status', status })
      });
    } catch (err) {
      console.error(err);
    }
  }

  async function handleCancelActiveRide() {
    if (!activeRide) return;
    try {
      await fetch(apiUrl('/api/rides/driver'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rideId: activeRide._id, driverId: 'amb-1', action: 'update_status', status: 'cancelled' })
      });
      setActiveRide(null);
    } catch (err) {
      console.error(err);
    }
  }"""
content = content.replace(driver_manager_functions_old, driver_manager_functions_new)

# 5. Pass them to ActiveRidePanel
panel_old = "<ActiveRidePanel ride={activeRide} onComplete={handleComplete} />"
panel_new = "<ActiveRidePanel ride={activeRide} onComplete={handleComplete} onStatusUpdate={handleStatusUpdate} onCancel={handleCancelActiveRide} />"
content = content.replace(panel_old, panel_new)

with open('components/DriverRideManager.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Patched DriverRideManager.jsx")
