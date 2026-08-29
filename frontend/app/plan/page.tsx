"use client";

import { useState, useEffect } from "react";
import { FiPhoneCall, FiCheckCircle, FiMapPin, FiActivity } from "react-icons/fi";
import { FaTrain, FaBus, FaTaxi } from "react-icons/fa";
import Link from "next/link";

const API_URL = "http://localhost:8000";

// Example Destination Coordinates (HITEC City, Hyderabad)
const DEST_LAT = 17.4474;
const DEST_LON = 78.3762;
const ALERT_RADIUS_KM = 2.0; // Trigger call at 2km

// Haversine formula to calculate distance between two lat/lon points
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function TripPlannerPage() {
  const [origin, setOrigin] = useState("Gachibowli");
  const [destination, setDestination] = useState("HITEC City");
  const [preference, setPreference] = useState("fastest");
  const [tripResult, setTripResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Wake up call state
  const [phone, setPhone] = useState("");
  const [callStatus, setCallStatus] = useState("");
  
  // Live Tracking State
  const [isTracking, setIsTracking] = useState(false);
  const [liveLocation, setLiveLocation] = useState<{lat: number, lng: number} | null>(null);
  const [distanceToDest, setDistanceToDest] = useState<number | null>(null);
  const [autoCallTriggered, setAutoCallTriggered] = useState(false);
  
  // Simulated Live Prices
  const [cabPrice, setCabPrice] = useState(245);
  const [bikePrice, setBikePrice] = useState(85);

  const handlePlanTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/plan_trip`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ origin, destination, preference })
      });
      const data = await res.json();
      setTripResult(data.plan);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const triggerWakeupCall = async (phoneNumber: string) => {
    try {
      setCallStatus("Calling you now! 📞...");
      const res = await fetch(`${API_URL}/api/trigger_wakeup_call`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone_number: phoneNumber, station_name: destination, route_id: "218D" })
      });
      const data = await res.json();
      setCallStatus(data.message);
    } catch (err) {
      setCallStatus("Failed to schedule call. Try again.");
    }
  };

  const handleManualCall = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) return;
    triggerWakeupCall(phone);
  };

  // GPS Tracking Effect
  useEffect(() => {
    if (!isTracking) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const currentLat = pos.coords.latitude;
        const currentLon = pos.coords.longitude;
        setLiveLocation({ lat: currentLat, lng: currentLon });
        
        const dist = calculateDistance(currentLat, currentLon, DEST_LAT, DEST_LON);
        setDistanceToDest(dist);

        // Auto-Trigger Logic: If within 2km, hasn't triggered yet, and phone exists
        if (dist <= ALERT_RADIUS_KM && !autoCallTriggered && phone) {
          setAutoCallTriggered(true);
          triggerWakeupCall(phone);
        }

        // Simulate live price fluctuations based on movement
        setCabPrice(prev => prev + (Math.random() > 0.5 ? 5 : -5));
        setBikePrice(prev => prev + (Math.random() > 0.5 ? 2 : -2));
      },
      (err) => console.error("GPS Error:", err),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [isTracking, autoCallTriggered, phone]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans pb-20">
      
      {/* Top Nav */}
      <nav className="border-b border-slate-800/60 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FiActivity className="text-emerald-400 h-6 w-6" />
            <span className="font-bold text-xl tracking-tight">BoardWise</span>
          </div>
          <button 
            onClick={() => setIsTracking(!isTracking)}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold border transition-colors ${
              isTracking ? "bg-red-500/10 border-red-500/50 text-red-400 animate-pulse" : "bg-emerald-500/10 border-emerald-500/50 text-emerald-400"
            }`}
          >
            <FiActivity /> {isTracking ? "Live Tracking ON" : "Start Live Tracking"}
          </button>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 pt-10 space-y-10">
        
        {/* Live Dashboard (Appears when tracking) */}
        {isTracking && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fadeIn">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col justify-center items-center text-center">
              <FiMapPin className="text-emerald-400 text-2xl mb-2" />
              <div className="text-xs text-slate-400 uppercase font-bold">Distance to {destination}</div>
              <div className="text-2xl font-black">{distanceToDest ? `${distanceToDest.toFixed(2)} km` : "Locating..."}</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col justify-center items-center text-center">
              <FaTaxi className="text-indigo-400 text-2xl mb-2" />
              <div className="text-xs text-slate-400 uppercase font-bold">Live Uber/Ola Fare</div>
              <div className="text-2xl font-black">₹{cabPrice}</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col justify-center items-center text-center">
              <FaBus className="text-orange-400 text-2xl mb-2" />
              <div className="text-xs text-slate-400 uppercase font-bold">Next Bus ETA</div>
              <div className="text-2xl font-black">4 mins</div>
            </div>
          </div>
        )}

        {/* KILLER FEATURE: WAKE-UP CALL ALERTS */}
        <div className="bg-gradient-to-r from-indigo-950/40 via-slate-900 to-slate-900 border border-indigo-500/30 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
          <div className="max-w-xl">
            <div className="inline-block bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full text-xs font-bold mb-3 uppercase">
              Auto-Trigger Enabled
            </div>
            <h2 className="text-2xl font-black mb-2 flex items-center gap-2">
              <FiPhoneCall className="text-indigo-400" /> Location-Based Wake-up Call
            </h2>
            <p className="text-slate-300 text-sm mb-6 leading-relaxed">
              Enter your number and turn on Live Tracking. As soon as your GPS shows you are exactly {ALERT_RADIUS_KM}km from {destination}, your phone will ring automatically.
            </p>

            <form onSubmit={handleManualCall} className="space-y-4">
              <div className="flex gap-2">
                <input 
                  type="tel" 
                  placeholder="Enter mobile number (+91...)"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500"
                  required
                />
                <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6 py-3 rounded-xl transition-colors shrink-0">
                  Test Call Now 📞
                </button>
              </div>

              {callStatus && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm p-3 rounded-xl flex items-center gap-2">
                  <FiCheckCircle className="shrink-0 text-lg" />
                  <span>{callStatus}</span>
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Standard Plan a Trip (Kept for your manual searches) */}
        {/* ... Paste your original Route Generator Form here ... */}
        
      </main>
    </div>
  );
}