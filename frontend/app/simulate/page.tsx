"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AiReportIntent, parseTransitReport } from "./ai-report";
import {
  FiMapPin,
  FiClock,
  FiShield,
  FiAlertTriangle,
  FiCheckCircle,
  FiActivity,
  FiMic,
} from "react-icons/fi";
import { FaBus, FaTrain, FaCar } from "react-icons/fa";

interface Report {
  id: number;
  crowding: string;
  age_minutes: number;
  trust_score?: number;
  location_verified: boolean;
}

interface Alternative {
  mode: string;
  time: number;
  cost: number;
  reliability: number;
  icon: string;
}

interface DashboardData {
  simulation_mode?: boolean;
  route_info: {
    route: string;
    origin: string;
    destination: string;
    eta: number;
    reports: Report[];
  };
  scores: {
    bcs: number;
    crowding_score: number;
    stop_reliability: number;
    punctuality: number;
    freshness: number;
    dominant_crowd_label: string;
  };
  explanation: string;
  alternatives: Alternative[];
}

interface SpeechRecognitionLike {
  lang: string;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  onresult:
    | ((event: {
        results: ArrayLike<ArrayLike<{ transcript: string }>>;
      }) => void)
    | null;
  start: () => void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

// Dynamically reference the environment variable with fallback for local development
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function BoardWiseDashboard() {
  const [isRecording, setIsRecording] = useState(false);
  const [data, setData] = useState<DashboardData | null>(null);
  const [sortPref, setSortPref] = useState("Reliability");
  const [isOffline, setIsOffline] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [reportText, setReportText] = useState("");
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [aiResponse, setAiResponse] = useState<AiReportIntent | null>(null);
  const [showAiResponse, setShowAiResponse] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const responseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchState = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/state`);
      if (!res.ok) throw new Error("Network response was not ok");
      const json = await res.json();
      setData(json);
      setIsOffline(false);
    } catch (error) {
      setIsOffline(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchState();

    let timeoutId: NodeJS.Timeout;

    const poll = async () => {
      await fetchState();

      const nextInterval = 4000 + Math.floor(Math.random() * 4000);

      timeoutId = setTimeout(poll, nextInterval);
    };

    timeoutId = setTimeout(poll, 6000);

    return () => clearTimeout(timeoutId);
  }, [fetchState]);

  useEffect(
    () => () => {
      if (responseTimer.current) clearTimeout(responseTimer.current);
    },
    [],
  );

  const triggerScenario = async (id: string) => {
    try {
      await fetch(`${API_URL}/api/scenario/${id}`, { method: "POST" });
      fetchState();
    } catch (e) {}
  };

  const simulateTime = async () => {
    try {
      await fetch(`${API_URL}/api/simulate_time`, { method: "POST" });
      fetchState();
    } catch (e) {}
  };

  const submitAiReport = async (
    event?: FormEvent<HTMLFormElement>,
    voiceText?: string,
  ) => {
    event?.preventDefault();
    const text = (voiceText ?? reportText).trim();
    if (!text || isSubmittingReport) return;

    setIsSubmittingReport(true);
    setReportError(null);
    const localIntent = parseTransitReport(text);
    let intent = localIntent;

    try {
      const aiResult = await fetch(`${API_URL}/api/ai_report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (aiResult.ok) {
        const payload = await aiResult.json();
        const extracted = payload.extracted_intent;
        if (extracted?.crowding) {
          intent = {
            crowding: extracted.crowding,
            confidence: extracted.confidence ?? localIntent.confidence,
            ghostStopDetected: extracted.ghost_stop_detected ?? false,
            explanation: extracted.explanation ?? localIntent.explanation,
          };
        }
      }

      const reportResult = await fetch(`${API_URL}/api/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ crowding: intent.crowding }),
      });
      if (!reportResult.ok) throw new Error("Unable to save report");

      setAiResponse(intent);
      setShowAiResponse(true);
      setReportText("");
      if (responseTimer.current) clearTimeout(responseTimer.current);
      responseTimer.current = setTimeout(() => setShowAiResponse(false), 5000);
      await fetchState();
    } catch {
      setReportError(
        "Your report could not be sent. Please try again when the transit engine reconnects.",
      );
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const startVoiceReport = () => {
    const speechWindow = window as Window & {
      SpeechRecognition?: SpeechRecognitionConstructor;
      webkitSpeechRecognition?: SpeechRecognitionConstructor;
    };
    const Recognition =
      speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
    if (!Recognition) {
      setReportError(
        "Voice input is not available in this browser. Type a report instead.",
      );
      return;
    }
    const recognition = new Recognition();
    recognition.lang = "en-IN";
    recognition.onstart = () => setIsRecording(true);
    recognition.onend = () => setIsRecording(false);
    recognition.onerror = () =>
      setReportError(
        "We could not hear that. Please try again or type your report.",
      );
    recognition.onresult = (voiceEvent) => {
      const transcript = voiceEvent.results[0]?.[0]?.transcript ?? "";
      setReportText(transcript);
      void submitAiReport(undefined, transcript);
    };
    recognition.start();
  };

  // BEAUTIFUL OFFLINE STATE
  if (isLoading && !data) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-300 grid place-items-center">
        Connecting to BoardWise intelligence...
      </div>
    );
  }

  if (isOffline || !data) {
    return (
      <div className="h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-slate-900 border border-slate-800 p-10 rounded-3xl max-w-md shadow-2xl">
          <div className="bg-rose-500/20 p-4 rounded-full inline-block mb-6">
            <FiActivity className="h-10 w-10 text-rose-500 animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Engine Offline</h2>
          <p className="text-slate-400 mb-6">
            The frontend is running, but the AI intelligence engine is
            unreachable.
          </p>
          <div className="bg-slate-950 p-4 rounded-lg text-left border border-slate-800 mb-6">
            <code className="text-xs text-emerald-400">
              cd backend
              <br />
              source venv/Scripts/activate
              <br />
              uvicorn main:app --reload
            </code>
          </div>
          <p className="text-xs text-slate-500">
            BoardWise will automatically reconnect when the server starts.
          </p>
        </div>
      </div>
    );
  }

  const { route_info, scores, explanation, alternatives } = data;
  const bcs = scores.bcs;

  const getStatusColor = (val: number) => {
    if (val >= 80) return "text-emerald-400";
    if (val >= 50) return "text-amber-400";
    return "text-rose-500";
  };

  const getStatusBg = (val: number) => {
    if (val >= 80) return "bg-emerald-500";
    if (val >= 50) return "bg-amber-500";
    return "bg-rose-500";
  };

  const isRecommended = bcs >= 80;

  const sortedAlts = [...alternatives].sort((a, b) => {
    if (sortPref === "Fastest") return a.time - b.time;
    if (sortPref === "Cheapest") return a.cost - b.cost;
    return b.reliability - a.reliability;
  });

  const scoreSignals = [
    {
      label: "Crowding",
      value: scores.crowding_score,
      weight: 40,
      color: "bg-indigo-400",
    },
    {
      label: "Stop reliability",
      value: scores.stop_reliability,
      weight: 30,
      color: "bg-emerald-400",
    },
    {
      label: "Punctuality",
      value: scores.punctuality,
      weight: 20,
      color: "bg-cyan-400",
    },
    {
      label: "Report freshness",
      value: scores.freshness,
      weight: 10,
      color: "bg-amber-400",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-emerald-500/30 pb-20">
      {/* CLEANED UP NAVBAR */}
      <nav className="border-b border-slate-800/60 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <FiActivity className="text-emerald-400 h-6 w-6" />
            <span className="font-bold text-xl tracking-tight">BoardWise</span>
            <span className="hidden sm:inline text-slate-400 text-sm ml-4">
              Urban Transit Intelligence
            </span>
          </Link>
          <div className="flex items-center gap-4 text-sm font-medium">
            <Link
              href="/command"
              className="hidden sm:flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
            >
              Open Command Center
            </Link>
            <span className="text-slate-300 ml-2 border-l border-slate-700 pl-4">
              Hyderabad
            </span>
            <div className="flex items-center gap-1.5 bg-rose-500/10 text-rose-400 px-2.5 py-1 rounded-full border border-rose-500/20">
              <div className="h-2 w-2 rounded-full bg-rose-500 animate-pulse"></div>
              Simulation Mode
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 pt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT COLUMN */}
        <div className="lg:col-span-7 space-y-6">
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2">
              Can you actually board your bus?
            </h1>
            <p className="text-slate-400">
              AI-powered boarding intelligence predicting crowd viability before
              you wait.
            </p>

            <div className="mt-6 flex items-center gap-4 bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="flex flex-col items-center gap-1">
                <div className="h-3 w-3 rounded-full border-2 border-emerald-400"></div>
                <div className="w-0.5 h-6 bg-slate-700"></div>
                <FiMapPin className="h-4 w-4 text-rose-400" />
              </div>
              <div className="flex-1 space-y-3">
                <div className="text-lg font-medium">{route_info.origin}</div>
                <div className="h-px bg-slate-800 w-full"></div>
                <div className="text-lg font-medium text-slate-300">
                  {route_info.destination}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden relative shadow-2xl">
            <div
              className={`absolute top-0 left-0 w-full h-1 ${getStatusBg(bcs)}`}
            ></div>
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <FaBus className="text-slate-400" />
                    <span className="text-2xl font-bold">
                      {route_info.route}
                    </span>
                  </div>
                  <div className="text-slate-400 text-sm">
                    Arriving in {route_info.eta} min
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-1 flex items-center justify-end gap-2">
                    Confidence
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/30">
                      AI
                    </span>
                  </div>
                  <div
                    className={`text-5xl font-black tracking-tighter ${getStatusColor(bcs)}`}
                  >
                    {bcs}
                    <span className="text-xl text-slate-500 font-normal">
                      /100
                    </span>
                  </div>
                </div>
              </div>

              <div className="w-full bg-slate-800 rounded-full h-3 mb-6 overflow-hidden flex">
                <div
                  className={`h-full ${getStatusBg(bcs)} transition-all duration-700`}
                  style={{ width: `${bcs}%` }}
                ></div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm mb-6">
                <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800/50">
                  <div className="text-slate-400 mb-1 flex items-center justify-between">
                    Crowding{" "}
                    <span className={getStatusColor(scores.crowding_score)}>
                      {scores.dominant_crowd_label}
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full">
                    <div
                      className={`h-full bg-slate-400`}
                      style={{ width: `${scores.crowding_score}%` }}
                    ></div>
                  </div>
                </div>
                <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800/50">
                  <div className="text-slate-400 mb-1 flex items-center justify-between">
                    Stop Reliability{" "}
                    <span className={getStatusColor(scores.stop_reliability)}>
                      {scores.stop_reliability}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full">
                    <div
                      className={`h-full bg-slate-400`}
                      style={{ width: `${scores.stop_reliability}%` }}
                    ></div>
                  </div>
                </div>
                <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800/50">
                  <div className="text-slate-400 mb-1 flex items-center justify-between">
                    Punctuality{" "}
                    <span className={getStatusColor(scores.punctuality)}>
                      {scores.punctuality}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full">
                    <div
                      className={`h-full bg-slate-400`}
                      style={{ width: `${scores.punctuality}%` }}
                    ></div>
                  </div>
                </div>
                <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800/50">
                  <div className="text-slate-400 mb-1 flex items-center justify-between">
                    Data Freshness{" "}
                    <span className={getStatusColor(scores.freshness)}>
                      {scores.freshness}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full">
                    <div
                      className={`h-full bg-slate-400`}
                      style={{ width: `${scores.freshness}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4 flex gap-3 items-start">
                <div className="bg-indigo-500/20 p-1.5 rounded-md shrink-0">
                  <FiActivity className="h-5 w-5 text-indigo-400" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-indigo-300 mb-1 flex items-center justify-between">
                    BoardWise AI Analysis
                    <span className="text-[10px] bg-indigo-500/30 text-indigo-300 px-1.5 py-0.5 rounded">
                      Powered by GenAI
                    </span>
                  </div>
                  <p className="text-indigo-200/80 text-sm leading-relaxed">
                    {explanation}
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/40 p-4">
                <div className="mb-3 flex items-center justify-between text-xs">
                  <span className="font-semibold uppercase tracking-wider text-slate-400">
                    Explainable AI signals
                  </span>
                  <span className="text-slate-500">
                    40 / 30 / 20 / 10 model
                  </span>
                </div>
                <div className="space-y-2.5">
                  {scoreSignals.map((signal) => (
                    <div key={signal.label}>
                      <div className="mb-1 flex justify-between text-xs text-slate-400">
                        <span>
                          {signal.label}{" "}
                          <span className="text-slate-600">
                            ({signal.weight}%)
                          </span>
                        </span>
                        <span className="font-medium text-slate-200">
                          {signal.value}%
                        </span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
                        <div
                          className={`h-full rounded-full ${signal.color}`}
                          style={{ width: `${signal.value}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div
            className={`p-6 rounded-2xl border flex items-center justify-between ${isRecommended ? "bg-emerald-500/10 border-emerald-500/20" : "bg-rose-500/10 border-rose-500/20"}`}
          >
            <div className="flex items-start gap-4">
              {isRecommended ? (
                <FiCheckCircle className="h-8 w-8 text-emerald-400 shrink-0 mt-1" />
              ) : (
                <FiAlertTriangle className="h-8 w-8 text-rose-400 shrink-0 mt-1" />
              )}
              <div>
                <h3
                  className={`font-bold text-lg ${isRecommended ? "text-emerald-400" : "text-rose-400"}`}
                >
                  {isRecommended
                    ? `Board ${route_info.route}`
                    : `Don't wait for ${route_info.route}`}
                </h3>
                <p className="text-slate-300 text-sm mt-1">
                  {isRecommended
                    ? "High confidence you can board this bus successfully."
                    : "We found a more reliable way to reach HITEC City."}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold">Smart Alternatives</h3>
              <select
                className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-300 outline-none"
                value={sortPref}
                onChange={(e) => setSortPref(e.target.value)}
              >
                <option>Fastest</option>
                <option>Cheapest</option>
                <option>Reliability</option>
              </select>
            </div>

            <div className="space-y-3">
              {sortedAlts.map((alt, i) => (
                <div
                  key={i}
                  className={`flex items-center justify-between p-3 rounded-xl border ${!isRecommended && i === 0 ? "bg-indigo-500/10 border-indigo-500/30" : "bg-slate-950 border-slate-800"} transition-all`}
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-slate-800 p-2 rounded-lg">
                      {alt.icon === "train" && (
                        <FaTrain className="h-5 w-5 text-slate-300" />
                      )}
                      {alt.icon === "bus" && (
                        <FaBus className="h-5 w-5 text-slate-300" />
                      )}
                      {alt.icon === "car" && (
                        <FaCar className="h-5 w-5 text-slate-300" />
                      )}
                    </div>
                    <div>
                      <div className="font-semibold flex items-center gap-2">
                        {alt.mode}
                        {!isRecommended && i === 0 && (
                          <span className="text-[10px] bg-indigo-500 text-white px-1.5 py-0.5 rounded uppercase">
                            Recommended
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 flex gap-2">
                        <span>{alt.time} min</span> • <span>₹{alt.cost}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-400 mb-0.5">
                      Reliability
                    </div>
                    <div
                      className={`text-sm font-bold ${getStatusColor(alt.reliability)}`}
                    >
                      {alt.reliability}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold">Commuter Evidence</h3>
              <span className="text-xs text-slate-400 bg-slate-800 px-2 py-1 rounded">
                {route_info.reports.length} live reports
              </span>
            </div>

            <div className="space-y-4 mb-5 border-l-2 border-slate-800 ml-2 pl-4 max-h-48 overflow-y-auto">
              {route_info.reports.map((rep: Report) => (
                <div key={rep.id} className="relative">
                  <div className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-slate-400 ring-4 ring-slate-900"></div>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-medium text-sm text-slate-200">
                        Bus is {rep.crowding}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                        <span className="flex items-center gap-1">
                          <FiClock className="h-3 w-3" /> {rep.age_minutes}m ago
                        </span>
                        {rep.location_verified && (
                          <span className="flex items-center gap-1 text-emerald-500/70">
                            <FiShield className="h-3 w-3" /> Verified Location
                          </span>
                        )}
                        {typeof rep.trust_score === "number" && (
                          <span>
                            Trust {Math.round(rep.trust_score * 100)}%
                          </span>
                        )}
                        <span>
                          Fresh{" "}
                          {Math.round(Math.exp(-rep.age_minutes / 10) * 100)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* INTEGRATED AI SMART REPORT (VOICE + TEXT) */}
            <div className="pt-4 border-t border-slate-800">
              <div className="text-xs font-semibold text-emerald-400 mb-2 uppercase flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <FiActivity /> AI Smart Report
                </span>
                {isRecording && (
                  <span className="text-rose-400 animate-pulse text-[10px]">
                    Listening...
                  </span>
                )}
              </div>
              <form onSubmit={submitAiReport} className="flex gap-2">
                <div className="relative w-full">
                  <input
                    type="text"
                    id="reportText"
                    name="reportText"
                    placeholder="Type or speak: 'Bus is packed!'"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-3 pr-10 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                    autoComplete="off"
                    value={reportText}
                    onChange={(event) => setReportText(event.target.value)}
                  />
                  <button
                    type="button"
                    onClick={startVoiceReport}
                    aria-label="Report by voice"
                    className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md transition-colors ${isRecording ? "bg-rose-500/20 text-rose-400" : "text-slate-400 hover:text-emerald-400"}`}
                  >
                    <FiMic className="h-4 w-4" />
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={!reportText.trim() || isSubmittingReport}
                  className="bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-700 disabled:text-slate-300 text-slate-950 px-4 py-2 rounded-lg font-bold text-sm transition-colors"
                >
                  {isSubmittingReport ? "Analyzing" : "Send"}
                </button>
              </form>
              {reportError && (
                <p className="mt-2 text-xs text-rose-400">{reportError}</p>
              )}
              {showAiResponse && aiResponse && (
                <div className="mt-3 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg animate-in fade-in">
                  <div className="text-xs text-emerald-400 font-semibold mb-1">
                    ✓ AI Understood
                  </div>
                  <div className="text-sm text-emerald-300">
                    Crowding:{" "}
                    <span className="font-bold">{aiResponse.crowding}</span>
                    {aiResponse.ghostStopDetected && (
                      <span className="ml-2 px-2 py-0.5 bg-rose-500/20 text-rose-400 rounded text-xs">
                        ⚠️ Ghost Stop Detected
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-emerald-200/60 mt-1">
                    Confidence: {Math.round(aiResponse.confidence * 100)}% ·{" "}
                    {aiResponse.explanation}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* FIXED DEMO SIMULATOR PANEL */}
      <div className="fixed bottom-6 right-6 w-80 bg-slate-800 border-2 border-indigo-500 rounded-xl shadow-2xl overflow-hidden z-50">
        <div className="bg-indigo-600 px-4 py-2 flex items-center justify-between">
          <span className="text-sm font-bold text-white tracking-wide uppercase">
            Hackathon Demo Controls
          </span>
          <FiActivity className="h-4 w-4 text-indigo-200" />
        </div>
        <div className="p-4 space-y-3">
          <div className="text-xs text-slate-300 font-semibold mb-1">
            Inject Scenarios:
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => triggerScenario("A")}
              className="bg-slate-900 hover:bg-slate-700 text-xs py-1.5 rounded border border-slate-700 text-left px-2"
            >
              A: Crowded 218D
            </button>
            <button
              onClick={() => triggerScenario("B")}
              className="bg-slate-900 hover:bg-slate-700 text-xs py-1.5 rounded border border-slate-700 text-left px-2"
            >
              B: Good 218D
            </button>
            <button
              onClick={() => triggerScenario("C")}
              className="bg-slate-900 hover:bg-slate-700 text-xs py-1.5 rounded border border-slate-700 text-left px-2"
            >
              C: Ghost Stop
            </button>
            <button
              onClick={() => triggerScenario("D")}
              className="bg-slate-900 hover:bg-slate-700 text-xs py-1.5 rounded border border-slate-700 text-left px-2"
            >
              D: Age Conflict
            </button>
          </div>
          <div className="h-px bg-slate-700 my-2"></div>
          <button
            onClick={simulateTime}
            className="w-full bg-slate-900 hover:bg-slate-700 text-xs py-2 rounded border border-slate-700 flex items-center justify-center gap-2"
          >
            <FiClock className="h-3 w-3" /> Simulate +2 Minutes Passing
          </button>
        </div>
      </div>
    </div>
  );
}
