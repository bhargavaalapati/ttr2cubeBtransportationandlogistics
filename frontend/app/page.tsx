"use client";

import { motion } from "framer-motion";
import Link from "next/link";
// Swapped to react-icons
import {
  FiArrowRight,
  FiActivity,
  FiMapPin,
  FiZap,
  FiShield,
} from "react-icons/fi";
import { FaBus } from "react-icons/fa";

export default function EnterpriseLanding() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-emerald-500/30 overflow-x-hidden">
      {/* ENTERPRISE NAVIGATION */}
      <nav className="fixed top-0 w-full z-50 bg-slate-950/80 backdrop-blur-lg border-b border-slate-800/60">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FiActivity className="text-emerald-400 h-8 w-8" />
            <span className="font-bold text-2xl tracking-tight">
              BoardWise<span className="text-emerald-500">.ai</span>
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
            <a href="#about" className="hover:text-white transition-colors">
              The Problem
            </a>
            <a href="#platform" className="hover:text-white transition-colors">
              Platform
            </a>
            <Link
              href="/command"
              className="text-emerald-400 hover:text-emerald-300 transition-colors font-semibold"
            >
              Command Center
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/simulate">
              <button className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-6 py-2.5 rounded-full font-bold text-sm transition-all shadow-[0_0_20px_-5px_rgba(16,185,129,0.4)] flex items-center gap-2">
                Launch Live Demo <FiArrowRight className="h-4 w-4" />
              </button>
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="pt-40 pb-20 px-6 relative">
        {/* Abstract Background Glow - FIXED TAILWIND CANONICAL CLASSES */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-200 h-125 bg-emerald-500/20 blur-[120px] rounded-full pointer-events-none"></div>

        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="z-10"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/50 border border-slate-700 text-emerald-400 text-sm font-semibold mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              v1.0 Live for Hyderabad MVP
            </div>
            {/* FIXED bg-linear-to-r */}
            <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[1.1] mb-6">
              The ETA is{" "}
              <span className="text-transparent bg-clip-text bg-linear-to-r from-emerald-400 to-cyan-500">
                Not Enough.
              </span>
            </h1>
            {/* FIXED ESCAPED ENTITY */}
            <p className="text-xl text-slate-400 leading-relaxed mb-8 max-w-lg">
              Knowing when a bus arrives doesn&apos;t mean you can board it.
              BoardWise uses live crowdsourcing and AI to predict urban transit
              viability before you wait.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/simulate">
                <button className="bg-white text-slate-950 px-8 py-4 rounded-lg font-bold text-lg hover:bg-slate-200 transition-colors flex items-center justify-center gap-2 w-full sm:w-auto">
                  Experience the MVP <FiArrowRight className="h-5 w-5" />
                </button>
              </Link>
              <button className="bg-slate-900 border border-slate-800 text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-slate-800 transition-colors flex items-center justify-center w-full sm:w-auto">
                Read the Whitepaper
              </button>
            </div>
          </motion.div>

          {/* Hero 3D-esque Dashboard Mockup */}
          <motion.div
            initial={{ opacity: 0, x: 50, rotateY: 15 }}
            animate={{ opacity: 1, x: 0, rotateY: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="relative z-10 perspective-1000"
          >
            <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden transform rotate-2 hover:rotate-0 transition-transform duration-500 hover:shadow-[0_0_50px_-10px_rgba(16,185,129,0.3)]">
              <div className="border-b border-slate-800 p-4 flex gap-2">
                <div className="h-3 w-3 rounded-full bg-rose-500"></div>
                <div className="h-3 w-3 rounded-full bg-amber-500"></div>
                <div className="h-3 w-3 rounded-full bg-emerald-500"></div>
              </div>
              <div className="p-8">
                <div className="flex justify-between items-center mb-6">
                  <div className="text-emerald-400 font-bold text-xl flex items-center gap-2">
                    <FaBus /> 218D{" "}
                  </div>
                  <div className="text-4xl font-black">32/100</div>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full mb-8">
                  <div className="w-[32%] bg-rose-500 h-full rounded-full"></div>
                </div>
                <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-lg">
                  <p className="text-rose-400 font-semibold mb-1">
                    Recommendation
                  </p>
                  <p className="text-slate-300 text-sm">
                    Severe crowding detected. We recommend switching to the
                    Metro (18 mins).
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* THE PROBLEM / ABOUT SECTION */}
      <section
        id="about"
        className="py-24 bg-slate-950 border-t border-slate-900"
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Why we built BoardWise.
            </h2>
            {/* FIXED ESCAPED ENTITY */}
            <p className="text-lg text-slate-400">
              Legacy transit systems treat commuters like dots on a map. They
              optimize for vehicle tracking, not human outcomes. We are changing
              the paradigm from &quot;Where is the bus?&quot; to &quot;Can I
              actually use this bus?&quot;
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: FiMapPin,
                title: "Ghost Stops",
                desc: "Buses arrive near the GPS pin, but skip the stop entirely due to traffic or driver behavior.",
              },
              {
                icon: FiActivity,
                title: "Blind Overcrowding",
                desc: "Waiting 15 minutes only to watch a fully-packed bus drive straight past you.",
              },
              {
                icon: FiZap,
                title: "Static Routing",
                desc: "Current apps suggest a route without knowing if the transit medium is currently viable.",
              },
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                className="bg-slate-900 border border-slate-800 p-8 rounded-2xl"
              >
                <feature.icon className="h-10 w-10 text-emerald-400 mb-6" />
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-slate-400">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* PRODUCT EXPLORATION / ENGINE */}
      <section id="platform" className="py-24 relative overflow-hidden">
        {/* FIXED TAILWIND CANONICAL CLASSES */}
        <div className="absolute top-0 right-0 w-125 h-125 bg-indigo-500/10 blur-[100px] rounded-full"></div>
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-5xl font-bold mb-6">
                The Intelligence Engine
              </h2>
              {/* FIXED ESCAPED ENTITY */}
              <p className="text-lg text-slate-400 mb-8">
                BoardWise doesn&apos;t just display data; it calculates a
                deterministic Boarding Confidence Score (BCS) in real-time.
              </p>

              <div className="space-y-6">
                {[
                  {
                    title: "Time-Decayed Reports",
                    desc: "User reports decay exponentially. A report from 2 minutes ago overrides a report from 20 minutes ago.",
                  },
                  {
                    title: "Location-Verified Trust",
                    desc: "Reports authenticated via hardware GPS proximity get a 1.5x weight multiplier.",
                  },
                  {
                    title: "Multi-Modal Failover",
                    desc: "If a bus BCS drops below 40%, the engine instantly routes you to the Metro or an Auto.",
                  },
                ].map((item, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="mt-1">
                      <CheckIcon />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-lg">
                        {item.title}
                      </h4>
                      <p className="text-slate-400 text-sm mt-1">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="bg-slate-900 border border-slate-700 p-8 rounded-3xl"
            >
              <h4 className="text-center text-slate-400 font-bold tracking-widest uppercase mb-8">
                BCS Formula Breakdown
              </h4>
              <div className="space-y-4">
                <StatBar
                  label="Crowding Dynamics"
                  percent="40%"
                  color="bg-indigo-500"
                />
                <StatBar
                  label="Stop Reliability History"
                  percent="30%"
                  color="bg-emerald-500"
                />
                <StatBar
                  label="Historical Punctuality"
                  percent="20%"
                  color="bg-cyan-500"
                />
                <StatBar
                  label="Data Freshness Multiplier"
                  percent="10%"
                  color="bg-amber-500"
                />
              </div>
              <div className="mt-8 pt-6 border-t border-slate-800 text-center text-sm text-slate-500">
                Calculated at the edge via FastAPI + Pydantic Engine
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-950 border-t border-slate-900 py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <FiActivity className="text-emerald-400 h-6 w-6" />
            <span className="font-bold text-xl tracking-tight text-slate-400">
              BoardWise<span className="text-emerald-700">.ai</span>
            </span>
          </div>
          <div className="text-slate-500 text-sm">
            Built for Hyderabad. Scalable to the world.
          </div>
        </div>
      </footer>
    </div>
  );
}

function CheckIcon() {
  return (
    <div className="bg-emerald-500/20 p-1 rounded-full flex items-center justify-center">
      <FiShield className="h-4 w-4 text-emerald-400" />
    </div>
  );
}

function StatBar({
  label,
  percent,
  color,
}: {
  label: string;
  percent: string;
  color: string;
}) {
  return (
    <div>
      <div className="flex justify-between text-sm font-semibold mb-2">
        <span>{label}</span>
        <span className="text-slate-400">{percent}</span>
      </div>
      <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          whileInView={{ width: percent }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.2 }}
          className={`h-full ${color}`}
        ></motion.div>
      </div>
    </div>
  );
}
