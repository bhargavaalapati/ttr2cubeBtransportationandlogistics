import { ChevronDown, Database, ShieldCheck } from "lucide-react";
import type { TripRecommendation } from "@/lib/types";

export function EvidencePanel({ recommendation }: { recommendation: TripRecommendation }) {
  return <details className="mt-5 rounded-2xl border border-emerald-400/20 bg-slate-950/40 p-4">
    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-bold text-emerald-200">
      <span className="flex items-center gap-2"><ShieldCheck size={17} /> Why this recommendation?</span><ChevronDown size={17} />
    </summary>
    <div className="mt-4 grid gap-3 sm:grid-cols-2">{recommendation.evidence.map((item) => <div key={`${item.label}-${item.value}`} className="rounded-xl border border-slate-800 bg-slate-900/70 p-3"><p className="text-xs text-slate-500">{item.label}</p><p className="mt-1 font-bold text-slate-100">{item.value}</p><p className="mt-1 flex items-center gap-1 text-[11px] text-slate-500"><Database size={12} />{item.source}</p></div>)}</div>
    {recommendation.uncertainties.length > 0 && <div className="mt-4 border-t border-slate-800 pt-4"><p className="text-xs font-bold uppercase tracking-wider text-amber-300">What is uncertain</p><ul className="mt-2 space-y-1 text-xs leading-5 text-slate-400">{recommendation.uncertainties.map((item) => <li key={item}>- {item}</li>)}</ul></div>}
  </details>;
}
