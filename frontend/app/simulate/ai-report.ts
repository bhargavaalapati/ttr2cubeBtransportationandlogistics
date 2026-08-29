export type CrowdingState = "EMPTY" | "MODERATE" | "CROWDED" | "FULL";

export interface AiReportIntent {
  crowding: CrowdingState;
  confidence: number;
  ghostStopDetected: boolean;
  explanation: string;
}

const crowdPhrases: Array<{ terms: string[]; crowding: CrowdingState; confidence: number }> = [
  { terms: ["empty", "lots of space", "plenty of space", "seats available", "clear"], crowding: "EMPTY", confidence: 0.96 },
  { terms: ["moderate", "manageable", "some space", "not too crowded"], crowding: "MODERATE", confidence: 0.84 },
  { terms: ["crowded", "rush", "busy", "packed", "jammed"], crowding: "CROWDED", confidence: 0.9 },
  { terms: ["full", "totally full", "cannot board", "can't board", "no room", "overcrowded"], crowding: "FULL", confidence: 0.97 },
];

/** A deterministic, explainable fallback for the MVP when the AI API is unavailable. */
export function parseTransitReport(text: string): AiReportIntent {
  const normalized = text.toLowerCase().trim();
  const ghostStopDetected = /ghost stop|skipp(ed|ing)?|didn't stop|did not stop|passed us/.test(normalized);
  const match = crowdPhrases.find(({ terms }) => terms.some((term) => normalized.includes(term)));
  const crowding = match?.crowding ?? "MODERATE";
  const confidence = Math.max(0.6, (match?.confidence ?? 0.68) - (ghostStopDetected ? 0.02 : 0));
  const explanation = ghostStopDetected
    ? "Detected a possible ghost-stop signal. The report is flagged for stop-reliability review."
    : `Detected ${crowding.toLowerCase()} crowd conditions from your report.`;

  return { crowding, confidence, ghostStopDetected, explanation };
}
