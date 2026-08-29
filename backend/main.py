# backend/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import math

app = FastAPI(title="BoardWise AI Transit API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For hackathon demo purposes
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Data Models ---
class Report(BaseModel):
    id: int
    crowding: str # 'EMPTY', 'MODERATE', 'CROWDED', 'FULL'
    age_minutes: int
    trust_score: float
    location_verified: bool

class RouteState(BaseModel):
    route: str = "218D"
    origin: str = "Gachibowli Junction"
    destination: str = "HITEC City"
    eta: int = 7
    base_crowd_score: int = 25
    stop_reliability: int = 58
    punctuality: int = 78
    reports: List[Report] = []

# --- Initial Scenarios ---
SCENARIOS = {
    "A": RouteState(eta=7, base_crowd_score=25, stop_reliability=58, punctuality=78, reports=[
        Report(id=1, crowding="FULL", age_minutes=2, trust_score=0.92, location_verified=True),
        Report(id=2, crowding="CROWDED", age_minutes=9, trust_score=0.65, location_verified=True)
    ]),
    "B": RouteState(eta=4, base_crowd_score=78, stop_reliability=91, punctuality=94, reports=[
        Report(id=3, crowding="MODERATE", age_minutes=1, trust_score=0.88, location_verified=True)
    ]),
    "C": RouteState(eta=5, base_crowd_score=60, stop_reliability=32, punctuality=88, reports=[
        Report(id=4, crowding="MODERATE", age_minutes=2, trust_score=0.75, location_verified=True)
    ]),
    "D": RouteState(eta=6, base_crowd_score=50, stop_reliability=85, punctuality=90, reports=[
        Report(id=5, crowding="FULL", age_minutes=2, trust_score=0.95, location_verified=True),
        Report(id=6, crowding="EMPTY", age_minutes=15, trust_score=0.80, location_verified=True)
    ])
}

current_state = SCENARIOS["A"].model_copy(deep=True)
report_counter = 10

# --- Core Intelligence Logic ---
CROWD_VALUES = {"EMPTY": 100, "MODERATE": 75, "CROWDED": 40, "FULL": 10}

def calculate_bcs(state: RouteState):
    if not state.reports:
        # FIXED: Calculate fallback score directly
        bcs = (0.40 * state.base_crowd_score) + (0.30 * state.stop_reliability) + (0.20 * state.punctuality) + (0.10 * 50)
        return {
            "bcs": int(bcs),
            "crowding_score": state.base_crowd_score,
            "stop_reliability": state.stop_reliability,
            "punctuality": state.punctuality,
            "freshness": 50,
            "dominant_crowd_label": get_crowd_label(state.base_crowd_score)
        }

    total_weight = 0
    weighted_crowd = 0
    max_freshness = 0

    for rep in state.reports:
        # Exponential decay: exp(-age / 10)
        freshness = math.exp(-rep.age_minutes / 10.0)
        loc_mult = 1.2 if rep.location_verified else 0.5
        weight = rep.trust_score * freshness * loc_mult
        
        weighted_crowd += CROWD_VALUES[rep.crowding] * weight
        total_weight += weight
        
        freshness_score = int(freshness * 100)
        if freshness_score > max_freshness:
            max_freshness = freshness_score

    dynamic_crowd = int(weighted_crowd / total_weight) if total_weight > 0 else state.base_crowd_score
    bcs = (0.40 * dynamic_crowd) + (0.30 * state.stop_reliability) + (0.20 * state.punctuality) + (0.10 * max_freshness)
    
    return {
        "bcs": int(bcs),
        "crowding_score": dynamic_crowd,
        "stop_reliability": state.stop_reliability,
        "punctuality": state.punctuality,
        "freshness": max_freshness,
        "dominant_crowd_label": get_crowd_label(dynamic_crowd)
    }


def get_crowd_label(score):
    if score >= 85: return "EMPTY"
    if score >= 60: return "MODERATE"
    if score >= 35: return "CROWDED"
    return "FULL"

def generate_explanation(scores):
    bcs = scores["bcs"]
    rel = scores["stop_reliability"]
    crowd = scores["crowding_score"]
    
    if crowd < 40 and rel < 60:
        return "Avoid this bus. Severe crowding combined with unreliable stopping behavior makes successful boarding unlikely."
    elif crowd < 40:
        return "The bus is approaching, but recent commuter reports indicate heavy crowding."
    elif rel < 50:
        return "This bus frequently skips this stop. Consider walking to the next reliable boarding point."
    elif bcs >= 80:
        return "Boarding looks favorable. Recent reports indicate available space and the stop has high reliability."
    else:
        return "Moderate conditions. Boarding is possible but expect a crowded ride."

def get_alternatives():
    return [
        {"mode": "Metro", "time": 18, "cost": 18, "reliability": 94, "walking": 6, "icon": "train"},
        {"mode": "Next Bus (216)", "time": 25, "cost": 10, "reliability": 72, "walking": 2, "icon": "bus"},
        {"mode": "Auto", "time": 14, "cost": 120, "reliability": 97, "walking": 1, "icon": "car"}
    ]

# --- Endpoints ---
@app.get("/api/state")
def get_state():
    scores = calculate_bcs(current_state)
    explanation = generate_explanation(scores)
    return {
        "route_info": current_state.dict(),
        "scores": scores,
        "explanation": explanation,
        "alternatives": get_alternatives()
    }

@app.post("/api/scenario/{scenario_id}")
def set_scenario(scenario_id: str):
    global current_state
    if scenario_id in SCENARIOS:
        current_state = SCENARIOS[scenario_id].model_copy(deep=True)
    return {"status": "success"}

@app.post("/api/report")
def add_report(report: dict):
    global current_state, report_counter
    new_rep = Report(
        id=report_counter,
        crowding=report["crowding"],
        age_minutes=0,
        trust_score=0.99, # Demo user has high trust
        location_verified=True
    )
    report_counter += 1
    # Prepend report
    current_state.reports.insert(0, new_rep)
    return {"status": "success"}
    
@app.post("/api/simulate_time")
def simulate_time():
    global current_state
    current_state.eta = max(0, current_state.eta - 2)
    for rep in current_state.reports:
        rep.age_minutes += 2
    return {"status": "success"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)