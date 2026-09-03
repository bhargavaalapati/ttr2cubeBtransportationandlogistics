export type DecisionAction = "BOARD" | "WAIT" | "SWITCH";
export interface TransitState { route_info: { code: string; name: string; start: string; end: string }; scores: { bcs: number; crowding: number; stop_reliability: number; punctuality: number; freshness: number; action: DecisionAction; recommendation: string }; explanation: string; recent_reports: Array<{ id: number; crowding: number; did_stop: boolean; text: string; time: string }>; alternatives: Array<{ mode: string; time_min: number; cost: number; reliability: number }>; }
export interface AiReportResult { status: string; parsed: { crowding: number; did_stop: boolean; route: string; summary: string }; message: string; }
export interface CommandCenter { admin: string; total_users: number; total_reports: number; system_status: string; logs: Array<{ id: number; text: string | null; crowding: number; timestamp: string }>; }
export type UserRole = "commuter" | "admin";
export interface AuthUser { email: string; role: UserRole; }
export interface LoginResponse { access_token: string; token_type: "bearer"; role: UserRole; }
export interface Place { name: string; address: string; latitude: number; longitude: number; provider: string; }
export interface TripOption { id: string; mode: string; duration_min: number; distance_km: number; fare: string | number | null; currency: string | null; fare_type: string; reliability: number; steps: string[]; provider: string; boardwise: { bcs: number; crowding: number; action: DecisionAction; recommendation: string } | null; }
export interface TripEvidence { label: string; value: string; source: string; }
export interface TripRecommendation { option_id: string; reason: string; evidence: TripEvidence[]; uncertainties: string[]; }
export interface TripPlan { origin: Place; destination: Place; options: TripOption[]; recommendation_id: string; recommendation: TripRecommendation; provider_notice: string; ai_summary: string; }
export interface TripExplanation { answer: string; evidence: TripEvidence[]; uncertainties: string[]; provider: string; }
