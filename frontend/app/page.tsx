"use client";

import Link from "next/link";
import { motion } from "motion/react";
import {
  ArrowRight,
  BadgeCheck,
  BrainCircuit,
  BusFront,
  ChartNoAxesCombined,
  Check,
  ChevronRight,
  CircleAlert,
  Clock3,
  MapPin,
  Radar,
  Route,
  ShieldCheck,
  Sparkles,
  TrainFront,
  UsersRound,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";

const features = [
  { icon: UsersRound, title: "Crowd signals", copy: "Fresh commuter reports capture the thing an ETA cannot: whether there is room to board.", accent: "text-amber-300", background: "bg-amber-300/10" },
  { icon: ShieldCheck, title: "Stop confidence", copy: "Detect skipped stops and factor real reliability into the decision before you wait.", accent: "text-cyan-300", background: "bg-cyan-300/10" },
  { icon: BrainCircuit, title: "A clear next move", copy: "Board, wait, or switch—each recommendation is grounded in the signals behind it.", accent: "text-emerald-300", background: "bg-emerald-300/10" },
];

const signals = [
  { label: "Crowding", value: "92%", width: "92%", color: "bg-rose-400" },
  { label: "Stop reliability", value: "60%", width: "60%", color: "bg-amber-300" },
  { label: "Punctuality", value: "75%", width: "75%", color: "bg-cyan-300" },
  { label: "Freshness", value: "96%", width: "96%", color: "bg-emerald-300" },
];

const fadeUp = { initial: { opacity: 0, y: 24 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, amount: 0.2 }, transition: { duration: 0.55, ease: "easeOut" } } as const;

export default function HomePage() {
  return (
    <main className="overflow-hidden bg-[#050816] text-slate-50 selection:bg-emerald-300 selection:text-slate-950">
      <SiteHeader />

      <section className="relative isolate px-5 pb-20 pt-18 sm:px-8 lg:pb-28 lg:pt-24">
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[680px] overflow-hidden">
          <motion.div animate={{ x: [0, 40, -15, 0], y: [0, 25, 5, 0] }} transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }} className="absolute -left-36 -top-48 h-[540px] w-[540px] rounded-full bg-emerald-500/20 blur-[120px]" />
          <motion.div animate={{ x: [0, -45, 0], y: [0, 55, 0] }} transition={{ duration: 17, repeat: Infinity, ease: "easeInOut" }} className="absolute -right-24 top-10 h-96 w-96 rounded-full bg-cyan-500/15 blur-[100px]" />
          <div className="absolute inset-0 opacity-[0.2] [background-image:linear-gradient(rgba(148,163,184,.16)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,.16)_1px,transparent_1px)] [background-size:52px_52px] [mask-image:linear-gradient(to_bottom,black,transparent)]" />
        </div>
        <div className="mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-[1.04fr_.96fr]">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65, ease: "easeOut" }}>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 text-xs font-bold text-emerald-200"><span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-70" /><span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-300" /></span>LIVE FOR HYDERABAD COMMUTERS</div>
            <h1 className="mt-7 max-w-3xl text-5xl font-black leading-[.96] tracking-[-0.065em] sm:text-6xl lg:text-7xl">Your bus is coming. <span className="bg-gradient-to-r from-emerald-200 via-emerald-400 to-cyan-300 bg-clip-text text-transparent">Can you actually board it?</span></h1>
            <p className="mt-7 max-w-xl text-lg leading-8 text-slate-300">BoardWise turns crowd reports, stop reliability, and freshness into the one transit decision that matters before you spend more time waiting.</p>
            <div className="mt-9 flex flex-wrap gap-3"><Link href="/simulate" className="group inline-flex items-center gap-2 rounded-xl bg-emerald-300 px-5 py-3 font-bold text-slate-950 shadow-lg shadow-emerald-950/30 transition hover:bg-emerald-200">Try the live demo <ArrowRight size={17} className="transition group-hover:translate-x-1" /></Link><Link href="/login" className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/70 px-5 py-3 font-bold text-slate-100 transition hover:border-slate-500 hover:bg-slate-800">Judge access <ChevronRight size={17} /></Link></div>
            <div className="mt-10 flex flex-wrap gap-x-7 gap-y-3 text-sm text-slate-400">{["Live commuter signals", "Explainable score", "Smart alternatives"].map((item) => <span key={item} className="flex items-center gap-2"><Check size={15} className="text-emerald-300" />{item}</span>)}</div>
          </motion.div>
          <HeroConsole />
        </div>
      </section>

      <section className="border-y border-slate-800/80 bg-slate-900/30 px-5 py-5 sm:px-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 text-xs font-bold uppercase tracking-[.14em] text-slate-500"><span>Designed for the minutes that decide a commute</span><div className="flex items-center gap-5 text-slate-400"><span className="flex items-center gap-2"><Radar size={15} className="text-emerald-300" />Signal-led</span><span className="flex items-center gap-2"><BadgeCheck size={15} className="text-cyan-300" />Explainable</span><span className="flex items-center gap-2"><Route size={15} className="text-amber-300" />Multi-modal</span></div></div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-24 sm:px-8 lg:py-32">
        <motion.div {...fadeUp} className="max-w-2xl"><p className="eyebrow"><Sparkles size={15} /> Beyond the ETA</p><h2 className="mt-4 text-3xl font-bold tracking-[-.04em] sm:text-5xl">Transit apps tell you when the bus arrives. We tell you if waiting makes sense.</h2></motion.div>
        <div className="mt-12 grid gap-4 lg:grid-cols-3">{features.map((feature, index) => { const Icon = feature.icon; return <article key={`feature-${feature.title}`} className="group relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/50 p-7"><div className={`absolute -right-8 -top-8 h-32 w-32 rounded-full blur-3xl ${feature.background}`} /><div className={`relative grid h-12 w-12 place-items-center rounded-2xl ${feature.background} ${feature.accent}`}><Icon size={23} /></div><h3 className="relative mt-14 text-2xl font-bold">{feature.title}</h3><p className="relative mt-3 leading-7 text-slate-400">{feature.copy}</p><div className="relative mt-7 h-px w-full bg-slate-800"><motion.span initial={{ width: 0 }} whileInView={{ width: "40%" }} viewport={{ once: true }} transition={{ duration: 0.7, delay: index * 0.1 }} className={`block h-full ${feature.accent.replace("text", "bg")}`} /></div></article>; })}</div>
      </section>

      <section className="relative border-y border-slate-800 bg-[#081322] px-5 py-24 sm:px-8 lg:py-32"><div className="pointer-events-none absolute inset-0 opacity-40 [background-image:radial-gradient(rgba(52,211,153,.24)_1px,transparent_1px)] [background-size:22px_22px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" /><div className="relative mx-auto grid max-w-6xl gap-14 lg:grid-cols-2 lg:items-center"><motion.div {...fadeUp}><p className="eyebrow"><ChartNoAxesCombined size={15} /> The confidence engine</p><h2 className="mt-4 text-3xl font-bold tracking-[-.04em] sm:text-5xl">A score you can trust because you can see inside it.</h2><p className="mt-6 max-w-xl leading-8 text-slate-300">Every signal is weighed with a simple, transparent model. Fresh commuter reports matter more than yesterday&apos;s data—and a skipped stop never gets ignored.</p><div className="mt-9 space-y-5">{["40% crowding intelligence", "30% stop reliability", "20% punctuality", "10% data freshness"].map((item, index) => <div key={item} className="flex items-center gap-4"><span className="grid h-7 w-7 place-items-center rounded-full border border-emerald-300/30 bg-emerald-300/10 text-xs font-bold text-emerald-200">0{index + 1}</span><span className="font-medium text-slate-200">{item}</span></div>)}</div></motion.div><ConfidenceCard /></div></section>

      <section className="mx-auto max-w-6xl px-5 py-24 sm:px-8 lg:py-32"><motion.div {...fadeUp} className="rounded-[2rem] border border-emerald-300/20 bg-[radial-gradient(circle_at_top_right,rgba(45,212,191,.16),transparent_35%),linear-gradient(135deg,#102636,#0b1324)] p-8 sm:p-12"><div className="max-w-3xl"><p className="eyebrow"><BusFront size={15} /> The smarter question</p><h2 className="mt-4 text-4xl font-black tracking-[-.055em] sm:text-6xl">From “Where is my bus?” to “What&apos;s the smartest way to get there?”</h2><p className="mt-6 max-w-2xl leading-8 text-slate-300">Open the live MVP, run a demo scenario, and watch the decision change with every commuter signal.</p><Link href="/simulate" className="group mt-9 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 font-bold text-slate-950 transition hover:bg-emerald-100">Launch BoardWise <ArrowRight size={17} className="transition group-hover:translate-x-1" /></Link></div></motion.div></section>

      <footer className="border-t border-slate-800 px-5 py-8 sm:px-8"><div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 text-sm text-slate-500"><span>BoardWise · Transit decision intelligence</span><div className="flex gap-5"><Link href="/simulate" className="hover:text-emerald-300">Live demo</Link><Link href="/command" className="hover:text-emerald-300">Command center</Link></div></div></footer>
    </main>
  );
}

function HeroConsole() {
  return <motion.div initial={{ opacity: 0, scale: 0.94, y: 24 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.15, ease: "easeOut" }} className="relative mx-auto w-full max-w-xl"><motion.div animate={{ rotate: [0, 1.5, 0, -1.5, 0], y: [0, -8, 0, 6, 0] }} transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }} className="relative overflow-hidden rounded-[2rem] border border-slate-700/80 bg-slate-900/80 p-5 shadow-2xl shadow-cyan-950/50 backdrop-blur-xl sm:p-6"><div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_0%,rgba(45,212,191,.14),transparent_30%)]" /><div className="relative flex items-center justify-between border-b border-slate-800 pb-4"><div className="flex items-center gap-2"><span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-300 text-slate-950"><BusFront size={19} /></span><div><p className="text-sm font-bold">Route 218D</p><p className="text-xs text-slate-500">Patancheru → Koti</p></div></div><span className="rounded-full border border-rose-300/30 bg-rose-300/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-rose-200">Switch</span></div><div className="relative mt-6 grid gap-5 sm:grid-cols-[.85fr_1.15fr]"><div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4"><p className="text-xs font-bold uppercase tracking-wider text-slate-500">Boarding confidence</p><div className="mt-4 flex items-baseline gap-1"><span className="text-5xl font-black tracking-[-.08em]">32</span><span className="text-sm text-slate-500">/100</span></div><div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-800"><motion.span initial={{ width: 0 }} animate={{ width: "32%" }} transition={{ duration: 1.2, delay: 0.6 }} className="block h-full rounded-full bg-rose-400" /></div><p className="mt-4 flex items-center gap-1.5 text-xs text-rose-200"><CircleAlert size={14} /> Crowding detected</p></div><div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4"><p className="text-xs font-bold uppercase tracking-wider text-slate-500">Recommended move</p><div className="mt-3 flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-300/10 text-cyan-300"><TrainFront size={20} /></span><div><p className="font-bold">Take the Metro</p><p className="text-xs text-slate-400">18 min · ₹45 · 98% reliable</p></div></div><div className="mt-4 flex items-center gap-2 text-xs font-semibold text-emerald-200"><span className="h-1.5 w-1.5 rounded-full bg-emerald-300" /> Best available alternative</div></div></div><div className="relative mt-5 rounded-2xl border border-slate-800 bg-slate-950/70 p-4"><div className="flex items-center justify-between"><p className="text-sm font-bold">What changed?</p><span className="flex items-center gap-1 text-xs text-emerald-300"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300" /> Live</span></div><div className="mt-3 flex items-start gap-3"><span className="mt-1 grid h-7 w-7 place-items-center rounded-full bg-amber-300/10 text-amber-300"><UsersRound size={14} /></span><p className="text-sm leading-6 text-slate-300">“Bus is packed and skipped the stop.” <span className="text-slate-500">Just now</span></p></div></div></motion.div><div className="absolute -right-5 top-22 hidden rounded-2xl border border-emerald-300/20 bg-[#102537]/90 px-4 py-3 shadow-xl backdrop-blur md:block"><p className="flex items-center gap-2 text-xs font-bold text-emerald-200"><MapPin size={14} /> Ameerpet signal</p><p className="mt-1 text-xs text-slate-400">Verified report received</p></div></motion.div>;
}

function ConfidenceCard() {
  return <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.08 }} className="relative rounded-[2rem] border border-slate-700 bg-slate-950/75 p-6 shadow-2xl shadow-slate-950/30"><div className="flex items-center justify-between"><div><p className="text-sm font-bold">Boarding Confidence</p><p className="mt-1 text-xs text-slate-500">Live model output · 08:42</p></div><Clock3 size={19} className="text-slate-500" /></div><div className="relative mx-auto mt-8 grid h-44 w-44 place-items-center rounded-full border-[14px] border-rose-400/20"><div className="absolute inset-[-14px] rounded-full border-[14px] border-transparent border-t-rose-400 border-r-rose-400/80 -rotate-35" /><div className="text-center"><p className="text-5xl font-black tracking-[-.08em]">32</p><p className="mt-1 text-xs font-bold uppercase tracking-wider text-rose-200">Switch</p></div></div><div className="mt-9 space-y-4">{signals.map((signal) => <div key={signal.label}><div className="mb-2 flex justify-between text-xs"><span className="text-slate-400">{signal.label}</span><span className="font-bold text-slate-200">{signal.value}</span></div><div className="h-1.5 overflow-hidden rounded-full bg-slate-800"><motion.span initial={{ width: 0 }} whileInView={{ width: signal.width }} viewport={{ once: true }} transition={{ duration: .7 }} className={`block h-full rounded-full ${signal.color}`} /></div></div>)}</div></motion.div>;
}
