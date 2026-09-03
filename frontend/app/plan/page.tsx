"use client";

import { FormEvent, useEffect, useState } from "react";
import { ArrowRight, BusFront, CarFront, Check, ChevronDown, LocateFixed, MapPin, RefreshCw, Route, Search, ShieldCheck, Sparkles, WalletCards } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { AiTripExplainer } from "@/components/ai-trip-explainer";
import { EvidencePanel } from "@/components/evidence-panel";
import { api } from "@/lib/api";
import type { Place, TripOption, TripPlan } from "@/lib/types";

const emptyPlace: Place = { name: "", address: "", latitude: 0, longitude: 0, provider: "" };

function PlacePicker({ label, value, onChange }: { label: string; value: Place; onChange: (place: Place) => void }) {
  const [query, setQuery] = useState(value.name);
  const [results, setResults] = useState<Place[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const trimmedQuery = query.trim();
    if (trimmedQuery.length < 2 || trimmedQuery === value.name.trim()) return;
    const timer = window.setTimeout(() => {
      setSearching(true);
      void api.searchPlaces(trimmedQuery).then(setResults).catch(() => setResults([])).finally(() => setSearching(false));
    }, 350);
    return () => window.clearTimeout(timer);
  }, [query, value.name]);

  return <div className="relative">
    <label className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">{label}</label>
    <div className="mt-2 flex items-center gap-3 rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 focus-within:border-emerald-400">
      <MapPin size={18} className="shrink-0 text-emerald-300" />
      <input value={query} onChange={(event) => { setQuery(event.target.value); setResults([]); }} onKeyDown={(event) => { if (event.key === "Enter") event.preventDefault(); }} placeholder="Search a Hyderabad place" className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-600" />
      <span aria-hidden="true" className="text-slate-400">{searching ? <RefreshCw size={17} className="animate-spin" /> : <Search size={17} />}</span>
    </div>
    {(results.length > 0 || (query.trim().length >= 2 && !searching && query.trim() !== value.name.trim())) && <div className="absolute z-10 mt-2 w-full overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl">{results.length > 0 ? results.map((place) => <button type="button" key={`${place.latitude}-${place.longitude}`} onClick={() => { onChange(place); setResults([]); }} className="block w-full border-b border-slate-800 px-4 py-3 text-left last:border-0 hover:bg-slate-800"><span className="block text-sm font-semibold">{place.name}</span><span className="mt-1 block truncate text-xs text-slate-500">{place.address}</span><span className="mt-1 block text-[10px] uppercase tracking-wider text-emerald-300/70">{place.provider}</span></button>) : <p className="px-4 py-4 text-sm text-slate-400">No matching Hyderabad place found.</p>}</div>}
  </div>;
}

function OptionCard({ option, recommended }: { option: TripOption; recommended: boolean }) {
  const isRoad = option.id === "road-route";
  return <article className={`rounded-2xl border p-5 ${recommended ? "border-emerald-400/60 bg-emerald-400/[.07]" : "border-slate-800 bg-slate-900/60"}`}>
    <div className="flex items-start justify-between gap-4"><div className="flex items-center gap-3"><span className={`grid h-10 w-10 place-items-center rounded-xl ${isRoad ? "bg-amber-400/10 text-amber-300" : "bg-sky-400/10 text-sky-300"}`}>{isRoad ? <CarFront size={20} /> : <BusFront size={20} />}</span><div><h2 className="font-bold">{option.mode}</h2><p className="text-xs text-slate-500">{option.provider}</p></div></div>{recommended && <span className="rounded-full bg-emerald-400 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-slate-950">Recommended</span>}</div>
    <div className="mt-6 grid grid-cols-3 gap-3"><div><p className="text-xl font-black">{option.duration_min}<span className="text-xs font-medium text-slate-500"> min</span></p><p className="text-xs text-slate-500">Travel time</p></div><div><p className="text-xl font-black">{option.fare == null ? "--" : `${option.currency === "INR" ? "₹" : ""}${option.fare}`}</p><p className="text-xs text-slate-500">{option.fare_type}</p></div><div><p className="text-xl font-black">{option.reliability}%</p><p className="text-xs text-slate-500">Reliability</p></div></div>
    {option.steps.length > 0 && <p className="mt-5 border-t border-slate-800 pt-4 text-sm text-slate-300">{option.steps.join("  ->  ")}</p>}
    {option.boardwise && <div className="mt-4 flex gap-3 rounded-xl border border-amber-300/20 bg-amber-300/6 p-3"><ShieldCheck size={18} className="shrink-0 text-amber-300" /><p className="text-xs leading-5 text-slate-300">BoardWise boarding confidence: <strong className="text-white">{option.boardwise.bcs}/100</strong>. {option.boardwise.recommendation}</p></div>}
  </article>;
}

export default function PlanPage() {
  const [origin, setOrigin] = useState<Place>(emptyPlace);
  const [destination, setDestination] = useState<Place>(emptyPlace);
  const [plan, setPlan] = useState<TripPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState("");

  async function handleUseLocation() {
    if (!navigator.geolocation) { setError("Location is not supported by this browser."); return; }
    setLocating(true); setError("");
    navigator.geolocation.getCurrentPosition(async ({ coords }) => { try { const places = await api.searchPlaces(`${coords.latitude}, ${coords.longitude}`); setOrigin(places[0] ?? { name: "Your current location", address: "GPS coordinates", latitude: coords.latitude, longitude: coords.longitude, provider: "Browser GPS" }); } catch { setOrigin({ name: "Your current location", address: "GPS coordinates", latitude: coords.latitude, longitude: coords.longitude, provider: "Browser GPS" }); } finally { setLocating(false); } }, () => { setError("We could not access your location. Search for a place instead."); setLocating(false); });
  }

  async function submit(event: FormEvent) { event.preventDefault(); if (!origin.name || !destination.name) { setError("Choose both an origin and a destination from search results."); return; } setLoading(true); setError(""); try { setPlan(await api.planTrip(origin, destination)); } catch (cause: unknown) { setError(cause instanceof Error ? cause.message : "Trip planning is unavailable right now."); } finally { setLoading(false); } }

  const recommended = plan?.options.find((option) => option.id === plan.recommendation_id);
  return <main className="min-h-screen bg-slate-950 text-slate-50"><SiteHeader /><div className="mx-auto max-w-6xl px-5 py-12 sm:px-8"><div className="max-w-3xl"><p className="eyebrow"><Route size={15} /> Real journey planning</p><h1 className="mt-4 text-4xl font-black tracking-tight sm:text-6xl">Go further with a plan you can trust.</h1><p className="mt-5 text-lg leading-8 text-slate-400">Search real places, compare provider routes, and let BoardWise add the question maps cannot answer: can you actually board?</p></div>
    <form onSubmit={submit} className="mt-10 rounded-3xl border border-slate-800 bg-slate-900/70 p-5 shadow-2xl sm:p-7"><div className="grid gap-4 lg:grid-cols-[1fr_auto_1fr] lg:items-end"><PlacePicker key={`from-${origin.name}`} label="From" value={origin} onChange={setOrigin} /><button type="button" onClick={() => { const current = origin; setOrigin(destination); setDestination(current); }} aria-label="Swap origin and destination" className="mx-auto grid h-11 w-11 place-items-center rounded-full border border-slate-700 text-slate-400 hover:border-emerald-400 hover:text-emerald-300"><ArrowRight size={18} className="rotate-90 lg:rotate-0" /></button><PlacePicker key={`to-${destination.name}`} label="To" value={destination} onChange={setDestination} /></div><div className="mt-6 flex flex-wrap items-center justify-between gap-4"><button type="button" onClick={() => void handleUseLocation()} className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-300 hover:text-emerald-200"><LocateFixed size={17} />{locating ? "Finding you..." : "Use my current location"}</button><button type="submit" disabled={loading} className="inline-flex items-center gap-2 rounded-xl bg-emerald-400 px-5 py-3 text-sm font-black text-slate-950 hover:bg-emerald-300 disabled:cursor-wait disabled:opacity-60">{loading ? <RefreshCw size={17} className="animate-spin" /> : <Route size={17} />} Plan my trip</button></div></form>
    {error && <div className="mt-5 rounded-2xl border border-rose-400/30 bg-rose-400/10 p-4 text-sm text-rose-100">{error}</div>}
    {!plan && !loading && <div className="mt-12 grid gap-4 md:grid-cols-3"><div className="glass-card p-5"><Search className="text-emerald-300" /><h2 className="mt-6 font-bold">Search the city</h2><p className="mt-2 text-sm leading-6 text-slate-400">Powered by live place data, with no hardcoded route map.</p></div><div className="glass-card p-5"><WalletCards className="text-amber-300" /><h2 className="mt-6 font-bold">See honest fares</h2><p className="mt-2 text-sm leading-6 text-slate-400">Provider fares stay separate from unavailable or estimated prices.</p></div><div className="glass-card p-5"><Sparkles className="text-sky-300" /><h2 className="mt-6 font-bold">Ask the data</h2><p className="mt-2 text-sm leading-6 text-slate-400">AI explains the recommendation using only returned route signals.</p></div></div>}
    {plan && <section className="mt-12"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="eyebrow"><Check size={15} /> Verified journey options</p><h2 className="mt-3 text-3xl font-black">{plan.origin.name} <span className="text-emerald-300">-&gt;</span> {plan.destination.name}</h2></div><p className="text-sm text-slate-500">{plan.options.length} options from connected providers</p></div>{recommended && <div className="mt-7 rounded-3xl border border-emerald-400/30 bg-emerald-400/8 p-6"><div className="flex items-start gap-4"><Sparkles className="mt-1 shrink-0 text-emerald-300" /><div><p className="text-xs font-black uppercase tracking-[.18em] text-emerald-300">BoardWise recommendation</p><h3 className="mt-2 text-2xl font-black">{recommended.mode} · {recommended.duration_min} min</h3><p className="mt-3 max-w-2xl leading-7 text-slate-300">{plan.ai_summary}</p>{plan.recommendation && <EvidencePanel recommendation={plan.recommendation} />}</div></div></div>}<div className="mt-5 grid gap-4 lg:grid-cols-2">{plan.options.map((option) => <OptionCard key={option.id} option={option} recommended={option.id === plan.recommendation_id} />)}</div><AiTripExplainer plan={plan} /><p className="mt-6 flex gap-2 text-xs leading-5 text-slate-500"><ChevronDown size={15} className="shrink-0" />{plan.provider_notice}</p></section>}
  </div></main>;
}
