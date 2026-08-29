import os
import json
import math
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional

load_dotenv()  # Load environment variables from .env file

# --- Live API Integrations ---
from sarvamai import SarvamAI
from twilio.rest import Client

# Initialize Sarvam Client (Expects SARVAM_API_KEY environment variable)
SARVAM_API_KEY = os.getenv("SARVAM_API_KEY")
sarvam_client = SarvamAI(api_subscription_key=SARVAM_API_KEY)

# Initialize Twilio Config
TWILIO_SID = os.getenv("TWILIO_ACCOUNT_SID")
TWILIO_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
TWILIO_PHONE = os.getenv("TWILIO_PHONE_NUMBER")
ADMIN_PHONE = os.getenv("ADMIN_PHONE") # The number receiving the alert

app = FastAPI(title="BoardWise AI Transit API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Data Models ---
class TripRequest(BaseModel):
    origin: str
    destination: str
    preference: str = "fastest"

class WakeupCallRequest(BaseModel):
    phone_number: str
    station_name: str
    route_id: str
class Report(BaseModel):
    id: int
    crowding: str 
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

class AIReportInput(BaseModel):
    text: str

# --- Initial Scenarios ---
SCENARIOS = {
    "A": RouteState(eta=7, base_crowd_score=25, stop_reliability=58, punctuality=78, reports=[
        Report(id=1, crowding="FULL", age_minutes=2, trust_score=0.92, location_verified=True),
        Report(id=2, crowding="CROWDED", age_minutes=9, trust_score=0.65, location_verified=True)
    ])
}

current_state = SCENARIOS["A"].model_copy(deep=True)
report_counter = 10
CROWD_VALUES = {"EMPTY": 100, "MODERATE": 75, "CROWDED": 40, "FULL": 10}

def get_crowd_label(score):
    if score >= 85: return "EMPTY"
    if score >= 60: return "MODERATE"
    if score >= 35: return "CROWDED"
    return "FULL"

def calculate_bcs(state: RouteState):
    if not state.reports:
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

# --- Endpoints ---
@app.get("/api/state")
def get_state():
    scores = calculate_bcs(current_state)
    return {
        "route_info": current_state.dict(),
        "scores": scores,
        "explanation": generate_explanation(scores)
    }

@app.post("/api/ai_report")
def submit_ai_report(payload: AIReportInput):
    global current_state, report_counter
    
    # 1. Live NLP Extraction using Sarvam AI
    system_prompt = """
    You are an intelligent transit assistant parsing commuter reports. 
    Analyze the text and extract two things: 
    1. The crowding level (EMPTY, MODERATE, CROWDED, or FULL). 
    2. Whether the bus skipped the stop/didn't stop (boolean). 
    
    Return ONLY raw JSON with this exact structure, nothing else:
    {"crowding": "MODERATE", "ghost_stop_detected": false}
    """
    
    try:
        # Call Sarvam's conversational model optimized for real-time dialogue
        response = sarvam_client.chat.completions(
            model="sarvam-105b-conversations",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": payload.text}
            ],
            temperature=0.1 # Keep it deterministic for JSON parsing
        )
        
        # Safely parse the JSON response from the LLM
        raw_output = response.choices[0].message.content
        clean_json = raw_output.replace("```json", "").replace("```", "").strip()
        extracted_data = json.loads(clean_json)
        
        extracted_crowding = extracted_data.get("crowding", "MODERATE").upper()
        skipped_stop = extracted_data.get("ghost_stop_detected", False)
        
    except Exception as e:
        print(f"Live API Error: {e}")
        # Graceful fallback if the API is unreachable
        extracted_crowding = "MODERATE"
        skipped_stop = False

    # 2. Apply the extracted data
    new_rep = Report(
        id=report_counter,
        crowding=extracted_crowding,
        age_minutes=0,
        trust_score=0.99,
        location_verified=True
    )
    report_counter += 1
    current_state.reports.insert(0, new_rep)
    
    # 3. Real-Time Action: Fire an SMS alert via Twilio if a Ghost Stop is reported
    if skipped_stop:
        current_state.stop_reliability = max(10, current_state.stop_reliability - 20)
        
        if TWILIO_SID != "your_twilio_sid":
            try:
                tw_client = Client(TWILIO_SID, TWILIO_TOKEN)
                alert_msg = f"🚨 Transit Alert: A ghost stop was reported on route {current_state.route}! Reliability dropped to {current_state.stop_reliability}%."
                tw_client.messages.create(
                    body=alert_msg,
                    from_=TWILIO_PHONE,
                    to=ADMIN_PHONE
                )
                print("Twilio SMS Alert Sent Successfully.")
            except Exception as tw_err:
                print(f"Failed to send Twilio SMS: {tw_err}")
        
    return {
        "status": "success",
        "extracted_intent": {
            "crowding": extracted_crowding,
            "ghost_stop_detected": skipped_stop,
            "provider": "Sarvam AI + Twilio"
        }
    }

@app.post("/api/plan_trip")
def plan_trip(request: TripRequest):
    # Simulated AI multi-modal routing logic
    # In a real app, you could pass this to Sarvam AI to translate/generate human-friendly steps
    return {
        "plan": {
            "mode": "Metro + Bus",
            "duration_min": 32 if request.preference == "fastest" else 45,
            "fare_inr": 45 if request.preference == "cheapest" else 60,
            "steps": [
                f"Walk 5 mins to {request.origin} Metro Station",
                "Take Blue Line towards Raidurg (3 stops)",
                "Switch to AC Bus 218D at Jubilee Hills Checkpost",
                f"Arrive at {request.destination}"
            ]
        }
    }

@app.post("/api/trigger_wakeup_call")
def trigger_wakeup_call(request: WakeupCallRequest):
    # This initiates a LIVE phone call using Twilio Voice
    if TWILIO_SID == "your_twilio_sid":
        return {"status": "error", "message": "Twilio not configured locally."}
        
    try:
        tw_client = Client(TWILIO_SID, TWILIO_TOKEN)
        
        # TwiML (Twilio Markup Language) tells Twilio what to say when they pick up
        twiml_instructions = f"""
        <Response>
            <Say voice="alice">Next is your station, be ready!</Say>
        </Response>
        """
        
        call = tw_client.calls.create(
            twiml=twiml_instructions,
            to=request.phone_number,
            from_=TWILIO_PHONE
        )
        
        return {
            "status": "success", 
            "message": f"Alert set! We will call {request.phone_number} before {request.station_name}.",
            "call_sid": call.sid
        }
        
    except Exception as e:
        print(f"Voice Call Error: {e}")
        return {"status": "error", "message": str(e)}
    
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)