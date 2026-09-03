"use client";

import { FormEvent, useState } from "react";
import { Bot, LoaderCircle, Send } from "lucide-react";
import { api } from "@/lib/api";
import type { TripPlan } from "@/lib/types";

const prompts = ["Why was this route recommended?", "Which fare is actually verified?", "What data is missing?"];

export function AiTripExplainer({ plan }: { plan: TripPlan }) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<{ answer: string; provider: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function ask(event?: FormEvent) {
    event?.preventDefault();
    if (!question.trim()) return;
    setLoading(true); setError("");
    try { const result = await api.explainTrip(question.trim(), plan); setAnswer({ answer: result.answer, provider: result.provider }); } catch (cause: unknown) { setError(cause instanceof Error ? cause.message : "The assistant is unavailable."); } finally { setLoading(false); }
  }

  return <div className="mt-5 rounded-3xl border border-sky-400/20 bg-sky-400/4 p-5 sm:p-6"><div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-sky-400/10 text-sky-300"><Bot size={20} /></span><div><p className="text-xs font-black uppercase tracking-[.18em] text-sky-300">Ask BoardWise</p><p className="mt-1 text-sm text-slate-400">Answers are grounded in this trip&apos;s verified evidence.</p></div></div><div className="mt-4 flex flex-wrap gap-2">{prompts.map((prompt) => <button type="button" key={prompt} onClick={() => { setQuestion(prompt); }} className="rounded-full border border-slate-700 px-3 py-2 text-xs text-slate-300 hover:border-sky-300 hover:text-white">{prompt}</button>)}</div><form onSubmit={ask} className="mt-4 flex gap-2"><input value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Ask about this recommendation" className="min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm outline-none placeholder:text-slate-600 focus:border-sky-300" /><button type="submit" disabled={loading} aria-label="Ask BoardWise" className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-sky-300 text-slate-950 hover:bg-sky-200 disabled:opacity-60">{loading ? <LoaderCircle size={17} className="animate-spin" /> : <Send size={17} />}</button></form>{error && <p className="mt-3 text-xs text-rose-200">{error}</p>}{answer && <div className="mt-4 border-t border-slate-800 pt-4"><p className="text-sm leading-6 text-slate-200">{answer.answer}</p><p className="mt-3 text-[11px] text-slate-500">Source: {answer.provider}</p></div>}</div>;
}
