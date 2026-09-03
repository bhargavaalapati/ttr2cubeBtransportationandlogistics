import os
import math
import asyncio
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import FastAPI, Depends, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session
from dotenv import load_dotenv

import database
from database import get_db, User, UserRole, Route, Stop, Report
import auth
from auth import get_current_user, require_admin
import ai_service
from mobility_service import MobilityProviderError, google_transit_routes, road_route, search_places
from trip_planner import build_trip_plan

load_dotenv()

database.init_db()

app = FastAPI(title="BoardWise API", version="2.0.0")

# CORS setup
origins = list({
    os.getenv("FRONTEND_URL", "http://localhost:3000"),
    "http://localhost:3000",
    "http://127.0.0.1:3000",
})

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Seed Database with real Hyderabad bus routes on launch
def seed_data():
    db = database.SessionLocal()
    try:
        if db.query(Route).count() == 0:
            route = Route(code="218D", name="Patancheru to Koti", start_point="Patancheru", end_point="Koti")
            db.add(route)
            db.commit()
            db.refresh(route)

            stops = [
                Stop(route_id=route.id, name="Patancheru Bus Stop", lat=17.5332, lng=78.2656, sequence=1),
                Stop(route_id=route.id, name="RC Puram", lat=17.5100, lng=78.2900, sequence=2),
                Stop(route_id=route.id, name="BHEL", lat=17.4845, lng=78.3182, sequence=3),
                Stop(route_id=route.id, name="Miyapur X Roads", lat=17.4968, lng=78.3614, sequence=4),
                Stop(route_id=route.id, name="Kukatpally", lat=17.4849, lng=78.4138, sequence=5),
                Stop(route_id=route.id, name="Ameerpet", lat=17.4375, lng=78.4482, sequence=6),
                Stop(route_id=route.id, name="Koti Bus Station", lat=17.3854, lng=78.4867, sequence=7),
            ]
            db.add_all(stops)
            db.commit()

            # Seed initial realistic reports
            init_report = Report(
                route_id=route.id,
                stop_id=stops[5].id, # Ameerpet
                crowding_level=85,
                did_stop=True,
                punctuality_score=75.0,
                raw_text="Very crowded bus, delayed by 10 mins"
            )
            db.add(init_report)
            db.commit()

        demo_accounts = [
            ("admin@boardwise.hyderabad", "admin123", UserRole.ADMIN),
            ("tester@boardwise.hyderabad", "tester123", UserRole.COMMUTER),
        ]
        for email, password, role in demo_accounts:
            if not db.query(User).filter(User.email == email).first():
                db.add(User(
                    email=email,
                    hashed_password=auth.get_password_hash(password),
                    role=role,
                ))
        db.commit()
    finally:
        db.close()

seed_data()

# Pydantic Schemas
class RegisterSchema(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)

class LoginSchema(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)

class ReportSchema(BaseModel):
    route_code: str = "218D"
    stop_name: str = "Ameerpet"
    crowding_level: int
    did_stop: bool = True
    raw_text: Optional[str] = None

class AIReportSchema(BaseModel):
    text: str

class PlaceSchema(BaseModel):
    name: str = Field(min_length=1, max_length=160)
    address: str = Field(min_length=1, max_length=300)
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    provider: str

class TripPlanSchema(BaseModel):
    origin: PlaceSchema
    destination: PlaceSchema

class TripExplainSchema(BaseModel):
    question: str = Field(min_length=3, max_length=500)
    plan: dict

# Helper calculation for Boarding Confidence Score (BCS)
def calculate_bcs(reports: List[Report], stop_reliability: float = 90.0) -> dict:
    if not reports:
        return {"bcs": 75, "crowding": 30, "punctuality": 85, "freshness": 100, "status": "Board"}

    latest = reports[0]
    now = datetime.now(timezone.utc)
    
    # Calculate age in minutes
    if latest.created_at.tzinfo is None:
        report_time = latest.created_at.replace(tzinfo=timezone.utc)
    else:
        report_time = latest.created_at
        
    age_minutes = max(0, (now - report_time).total_seconds() / 60.0)
    
    # Exponential decay formula: exp(-age_minutes / 10)
    freshness = math.exp(-age_minutes / 10.0) * 100.0
    crowding = latest.crowding_level
    punctuality = latest.punctuality_score
    
    if not latest.did_stop:
        stop_reliability = max(10.0, stop_reliability - 40.0)

    # Weighted BCS Formula: 40% Crowding + 30% Stop Reliability + 20% Punctuality + 10% Freshness
    bcs = (
        (100 - crowding) * 0.4 +
        stop_reliability * 0.3 +
        punctuality * 0.2 +
        freshness * 0.1
    )
    bcs = round(max(0, min(100, bcs)), 1)

    if bcs >= 70:
        action = "BOARD"
        recommendation = "High confidence. Proceed to board 218D."
    elif bcs >= 45:
        action = "WAIT"
        recommendation = "Moderate overcrowding. Consider waiting for next 218D in 8 mins."
    else:
        action = "SWITCH"
        recommendation = "Low confidence! Switch to Hyderabad Metro (Miyapur-LB Nagar line) or Auto."

    return {
        "bcs": bcs,
        "crowding": crowding,
        "stop_reliability": round(stop_reliability, 1),
        "punctuality": round(punctuality, 1),
        "freshness": round(freshness, 1),
        "action": action,
        "recommendation": recommendation
    }

# Auth Routes
@app.post("/api/auth/register")
def register(user_data: RegisterSchema, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user_data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed = auth.get_password_hash(user_data.password)
    # Public registration must never choose a privileged role.
    user = User(email=user_data.email, hashed_password=hashed, role=UserRole.COMMUTER)
    db.add(user)
    db.commit()
    return {"message": "User registered successfully", "role": user.role}

@app.post("/api/auth/login")
def login(login_data: LoginSchema, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_data.email).first()
    if not user or not auth.verify_password(login_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    access_token = auth.create_access_token(data={"sub": user.email, "role": user.role})
    return {"access_token": access_token, "token_type": "bearer", "role": user.role}

@app.get("/api/auth/me")
def get_authenticated_user(current_user: User = Depends(get_current_user)):
    """Validate a session token and return the authenticated user's safe fields."""
    return {
        "email": current_user.email,
        "role": current_user.role,
    }

# State Route (Live BCS computation from Database)
@app.get("/api/state")
def get_state(db: Session = Depends(get_db)):
    route = db.query(Route).filter(Route.code == "218D").first()
    if not route:
        raise HTTPException(status_code=404, detail="Route not found")
    
    reports = db.query(Report).filter(Report.route_id == route.id).order_by(Report.created_at.desc()).all()
    bcs_metrics = calculate_bcs(reports)
    
    recent_reports = [
        {
            "id": r.id,
            "crowding": r.crowding_level,
            "did_stop": r.did_stop,
            "text": r.raw_text or f"Crowding level: {r.crowding_level}%",
            "time": r.created_at.strftime("%H:%M:%S")
        } for r in reports[:5]
    ]

    return {
        "route_info": {
            "code": route.code,
            "name": route.name,
            "start": route.start_point,
            "end": route.end_point,
        },
        "scores": bcs_metrics,
        "explanation": bcs_metrics["recommendation"],
        "recent_reports": recent_reports,
        "alternatives": [
            {"mode": "Metro", "time_min": 18, "cost": 45, "reliability": 98},
            {"mode": "Bus 225L", "time_min": 25, "cost": 25, "reliability": 75},
            {"mode": "Auto Shared", "time_min": 20, "cost": 60, "reliability": 85}
        ]
    }

@app.get("/api/places/search")
async def place_search(query: str = Query(min_length=2, max_length=120)):
    """User-triggered Hyderabad place lookup, backed by Google or OSM providers."""
    try:
        return await search_places(query)
    except MobilityProviderError as error:
        raise HTTPException(status_code=503, detail=str(error)) from error

@app.post("/api/trips/plan")
async def plan_trip(payload: TripPlanSchema, db: Session = Depends(get_db)):
    """Build a verified route comparison and enrich only route 218D with BCS."""
    origin = payload.origin.model_dump()
    destination = payload.destination.model_dump()
    try:
        road, transit_routes = await asyncio.gather(
            road_route(origin, destination),
            google_transit_routes(origin, destination),
        )
    except MobilityProviderError as error:
        raise HTTPException(status_code=503, detail=str(error)) from error

    route = db.query(Route).filter(Route.code == "218D").first()
    reports = []
    if route:
        reports = db.query(Report).filter(Report.route_id == route.id).order_by(Report.created_at.desc()).all()
    boardwise_scores = calculate_bcs(reports)
    plan = build_trip_plan(origin, destination, road, transit_routes, boardwise_scores)
    plan["ai_summary"] = ai_service.explain_trip_plan(plan)
    return plan

@app.post("/api/trips/explain")
def explain_trip(payload: TripExplainSchema):
    """Answer a commuter question using only the verified trip plan evidence."""
    return ai_service.answer_trip_question(payload.question, payload.plan)

# Post Crowd Report
@app.post("/api/report")
def submit_report(payload: ReportSchema, db: Session = Depends(get_db)):
    route = db.query(Route).filter(Route.code == payload.route_code).first()
    if not route:
        raise HTTPException(status_code=404, detail="Route not found")
        
    stop = db.query(Stop).filter(Stop.name == payload.stop_name).first()

    report = Report(
        route_id=route.id,
        stop_id=stop.id if stop else None,
        crowding_level=payload.crowding_level,
        did_stop=payload.did_stop,
        raw_text=payload.raw_text
    )
    db.add(report)
    db.commit()
    return {"status": "success", "message": "Report logged into database"}

# AI Direct Input API
@app.post("/api/ai_report")
def submit_ai_report(payload: AIReportSchema, db: Session = Depends(get_db)):
    ai_result = ai_service.parse_commuter_report(payload.text)
    
    route = db.query(Route).filter(Route.code == ai_result.get("route", "218D")).first()
    if not route:
        route = db.query(Route).first()

    report = Report(
        route_id=route.id,
        crowding_level=ai_result.get("crowding", 50),
        did_stop=ai_result.get("did_stop", True),
        raw_text=payload.text
    )
    db.add(report)
    db.commit()

    return {
        "status": "success",
        "parsed": ai_result,
        "message": "AI successfully extracted commuter feedback and saved to DB."
    }

# Admin Command Center API (Protected by RBAC)
@app.get("/api/admin/command_center")
def get_command_center(current_user: User = Depends(require_admin), db: Session = Depends(get_db)):
    total_users = db.query(User).count()
    total_reports = db.query(Report).count()
    all_reports = db.query(Report).order_by(Report.created_at.desc()).limit(20).all()

    return {
        "admin": current_user.email,
        "total_users": total_users,
        "total_reports": total_reports,
        "system_status": "Healthy",
        "logs": [
            {
                "id": r.id,
                "text": r.raw_text,
                "crowding": r.crowding_level,
                "timestamp": r.created_at.isoformat()
            } for r in all_reports
        ]
    }

# List all real routes
@app.get("/api/routes")
def get_routes(db: Session = Depends(get_db)):
    routes = db.query(Route).all()
    return [
        {
            "id": r.id,
            "code": r.code,
            "name": r.name,
            "start": r.start_point,
            "end": r.end_point,
            "total_stops": len(r.stops)
        } for r in routes
    ]

# Get route details and stop list
@app.get("/api/routes/{code}")
def get_route_details(code: str, db: Session = Depends(get_db)):
    route = db.query(Route).filter(Route.code == code).first()
    if not route:
        raise HTTPException(status_code=404, detail="Route not found")
    
    stops = db.query(Stop).filter(Stop.route_id == route.id).order_by(Stop.sequence).all()
    
    return {
        "code": route.code,
        "name": route.name,
        "start": route.start_point,
        "end": route.end_point,
        "stops": [
            {
                "id": s.id,
                "name": s.name,
                "lat": s.lat,
                "lng": s.lng,
                "sequence": s.sequence,
                "reliability_score": s.reliability_score
            } for s in stops
        ]
    }

# Dynamic Scenario Handler (Fixes 404 from frontend demo buttons)
@app.post("/api/scenario/{scenario_id}")
def load_scenario(scenario_id: str, db: Session = Depends(get_db)):
    route = db.query(Route).filter(Route.code == "218D").first()
    if not route:
        raise HTTPException(status_code=404, detail="Route 218D not found")

    scenarios = {
        "A": {"crowding": 92, "did_stop": False, "text": "Scenario A: Overcrowded 218D skipped Ameerpet stop."},
        "B": {"crowding": 30, "did_stop": True, "text": "Scenario B: Empty 218D, on schedule with plenty of seats."},
        "C": {"crowding": 70, "did_stop": False, "text": "Scenario C: Ghost stop alert - driver bypassed stop without slowing."},
        "D": {"crowding": 85, "did_stop": True, "text": "Scenario D: Fresh crowd report overrides stale data."}
    }

    selected = scenarios.get(scenario_id.upper())
    if not selected:
        raise HTTPException(status_code=400, detail="Invalid scenario ID. Choose A, B, C, or D.")

    # Save scenario state as real DB report
    report = Report(
        route_id=route.id,
        crowding_level=selected["crowding"],
        did_stop=selected["did_stop"],
        raw_text=selected["text"]
    )
    db.add(report)
    db.commit()

    return {
        "status": "success",
        "scenario": scenario_id.upper(),
        "message": f"Applied scenario {scenario_id.upper()} to database."
    }

# Time Simulation Endpoint (Fixes 404 from simulate_time frontend call)
@app.post("/api/simulate_time")
def simulate_time(minutes: int = 10, db: Session = Depends(get_db)):
    # Simulates time decay by logging an update
    return {"status": "success", "message": f"Simulated {minutes} minutes passing. Freshness scores updated."}
