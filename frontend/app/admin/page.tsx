"use client";

import { useEffect, useState } from "react";
import { Activity, AlertTriangle, Database, FileText, LoaderCircle, ShieldCheck, Users } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { useAuth } from "@/components/auth-provider";
import { api } from "@/lib/api";
import type { CommandCenter } from "@/lib/types";

export default function AdminPage() {
  const { isReady, token, user } = useAuth();
  const [data, setData] = useState<CommandCenter | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isReady || !token || user?.role !== "admin") return;
    void api.commandCenter(token).then(setData).catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "Admin data is unavailable."));
  }, [isReady, token, user?.role]);

  const cards = data ? [
    { label: "Registered users", value: data.total_users, icon: Users },
    { label: "Commuter reports", value: data.total_reports, icon: FileText },
    { label: "Service status", value: data.system_status, icon: Activity },
  ] : [];

  return <main className="min-h-screen bg-slate-950 text-slate-50"><SiteHeader /><div className="mx-auto max-w-6xl px-5 py-12 sm:px-8"><p className="eyebrow"><ShieldCheck size={15} /> Restricted operations</p><h1 className="mt-4 text-4xl font-black tracking-tight">BoardWise admin console</h1><p className="mt-3 max-w-2xl leading-7 text-slate-400">Monitor the signal quality that powers commuter decisions. This view is protected by backend role authorization.</p>{user?.role !== "admin" && <div className="mt-8 flex items-start gap-3 rounded-2xl border border-amber-300/30 bg-amber-300/10 p-5 text-amber-100"><AlertTriangle className="shrink-0 text-amber-300" /><div><p className="font-bold">Admin access required</p><p className="mt-1 text-sm text-amber-100/70">This account is authenticated, but it does not have the admin role.</p></div></div>}{user?.role === "admin" && !data && !error && <div className="mt-10 flex items-center gap-3 text-slate-400"><LoaderCircle size={18} className="animate-spin" />Loading operational data...</div>}{error && <div className="mt-8 rounded-2xl border border-rose-400/30 bg-rose-400/10 p-5 text-rose-100">{error}</div>}{data && <><div className="mt-10 grid gap-4 md:grid-cols-3">{cards.map(({ label, value, icon: Icon }) => <div className="glass-card p-5" key={label}><Icon className="text-emerald-300" size={20} /><p className="mt-6 text-xs uppercase tracking-wider text-slate-500">{label}</p><p className="mt-2 text-3xl font-black">{value}</p></div>)}</div><section className="mt-10"><div className="flex items-center gap-3"><Database size={18} className="text-sky-300" /><h2 className="text-xl font-bold">Recent commuter signals</h2></div><div className="mt-4 overflow-hidden rounded-2xl border border-slate-800"><div className="grid grid-cols-[1fr_auto] border-b border-slate-800 bg-slate-900 px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500"><span>Signal</span><span>Crowding</span></div>{data.logs.length === 0 ? <p className="p-5 text-sm text-slate-400">No commuter reports yet.</p> : data.logs.map((log) => <div className="grid grid-cols-[1fr_auto] gap-4 border-b border-slate-800/70 px-4 py-4 last:border-0" key={log.id}><div><p className="text-sm text-slate-200">{log.text || "Unlabeled commuter report"}</p><p className="mt-1 text-xs text-slate-500">{new Date(log.timestamp).toLocaleString()}</p></div><span className="self-center text-sm font-black text-amber-300">{log.crowding}%</span></div>)}</div></section></>}</div></main>;
}
