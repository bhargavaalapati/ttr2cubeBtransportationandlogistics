// frontend/app/command/page.tsx
"use client";

import { useState, useEffect } from "react";
import { FiActivity, FiAlertCircle, FiMap, FiUsers, FiTrendingDown, FiShield } from "react-icons/fi";
import { FaBus } from "react-icons/fa";
import Link from "next/link";

export default function CommandCenter() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-emerald-500/30 p-6">
      {/* Header */}
      <header className="flex justify-between items-center mb-8 border-b border-slate-800 pb-6">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-500/20 p-2 rounded-lg">
            <FiActivity className="text-emerald-400 h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">TGSRTC Command Center</h1>
            <p className="text-slate-400 text-sm">City-wide transit intelligence & bottleneck detection</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-full">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            System Nominal
          </div>
          <Link href="/">
            <button className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Exit</button>
          </Link>
        </div>
      </header>

      {/* Top Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <MetricCard title="Active Fleet" value="1,402" icon={<FaBus />} trend="+12" status="normal" />
        <MetricCard title="Critical Bottlenecks" value="4" icon={<FiAlertCircle />} trend="+2" status="danger" />
        <MetricCard title="Ghost Stops (Last 1hr)" value="28" icon={<FiMap />} trend="-5" status="warning" />
        <MetricCard title="Community Reports" value="8,492" icon={<FiUsers />} trend="+1.2k" status="good" />
      </div>

      {/* Main Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* Left: Active Alerts */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <FiTrendingDown className="text-rose-400" /> Active Corridor Alerts
          </h2>
          <div className="space-y-4">
            <AlertRow route="218D" location="Gachibowli Junction" issue="Severe Crowding (BCS: 24)" time="2m ago" />
            <AlertRow route="47L" location="Madhapur Metro" issue="Ghost Stop Detected (Skipped)" time="5m ago" />
            <AlertRow route="216" location="Kondapur" issue="Schedule Deviation (+18m)" time="12m ago" />
          </div>
        </div>

        {/* Right: Trust Network */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <FiShield className="text-emerald-400" /> Sensor & Trust Network
          </h2>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-400">Hardware GPS Verification</span>
                <span className="text-emerald-400 font-mono">92%</span>
              </div>
              <div className="w-full bg-slate-950 h-2 rounded-full"><div className="bg-emerald-400 h-full w-[92%] rounded-full"></div></div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-400">Crowdsource Confidence</span>
                <span className="text-emerald-400 font-mono">88%</span>
              </div>
              <div className="w-full bg-slate-950 h-2 rounded-full"><div className="bg-emerald-400 h-full w-[88%] rounded-full"></div></div>
            </div>
            <div className="pt-4 border-t border-slate-800">
              <p className="text-xs text-slate-500 leading-relaxed">
                Trust engine is currently weighting authenticated commuter reports at 1.5x against historical load data.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon, trend, status }: any) {
  const color = status === "danger" ? "text-rose-400" : status === "warning" ? "text-amber-400" : status === "good" ? "text-emerald-400" : "text-slate-300";
  return (
    <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-2 rounded-lg bg-slate-950 border border-slate-800 ${color}`}>{icon}</div>
        <div className={`text-xs font-medium px-2 py-1 rounded bg-slate-950 border border-slate-800 ${color}`}>{trend}</div>
      </div>
      <div className="text-slate-400 text-sm font-medium mb-1">{title}</div>
      <div className="text-3xl font-bold tracking-tight">{value}</div>
    </div>
  );
}

function AlertRow({ route, location, issue, time }: any) {
  return (
    <div className="flex items-center justify-between p-4 bg-slate-950 border border-slate-800 rounded-xl hover:border-slate-700 transition-colors cursor-pointer">
      <div className="flex items-center gap-4">
        <div className="bg-slate-800 text-white font-bold px-3 py-1.5 rounded uppercase text-sm">{route}</div>
        <div>
          <div className="font-semibold text-sm">{location}</div>
          <div className="text-rose-400 text-xs">{issue}</div>
        </div>
      </div>
      <div className="text-slate-500 text-xs">{time}</div>
    </div>
  );
}