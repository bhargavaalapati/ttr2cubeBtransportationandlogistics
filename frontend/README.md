# BoardWise — Urban Transit Intelligence

## Problem
Hyderabad commuters know exactly *when* a bus is arriving, but often don't know if they can actually board it. A bus arriving in 2 minutes is useless if it's completely full or notoriously skips the stop.

## Solution
BoardWise shifts the paradigm from ETA tracking to **Decision Intelligence**. We predict a Boarding Confidence Score (BCS) and recommend multi-modal alternatives if boarding is unlikely.

## Core Innovation
**Boarding Confidence Score (0-100)**
A deterministic formula weighting multi-source signals:
- **40% Crowding** (Decayed crowdsourced reports + base historical load)
- **30% Stop Reliability** (Historical rate of ghost-stops/skips at this junction)
- **20% Punctuality** (Historical adherence to schedule)
- **10% Freshness** (Exponential decay applied to report age)

## MVP Architecture
- **Frontend:** Next.js (App Router), Tailwind CSS, Lucide Icons.
- **Backend Intelligence:** FastAPI, Pydantic, Python.
- **Data Status:** Currently utilizing deterministic simulated data for rapid hackathon demonstration.

## Future Scale
The architecture is designed to integrate seamlessly with:
- TGSRTC GTFS-Realtime feeds
- Beckn/ONDC for multi-modal ticket booking (Metro/Auto)
- Sarvam AI for vernacular voice reporting ("218D lo full rush undi")
- Hardware-backed cryptographic Proof of Location for report trust verification

## How to Run the Demo
1. Terminal 1 (Backend): `cd backend && source venv/bin/activate && uvicorn main:app --reload`
2. Terminal 2 (Frontend): `cd frontend && npm run dev`
3. Open `http://localhost:3000`