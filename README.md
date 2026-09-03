# BoardWise

<div align="center">

<img src="./assets/commute_pics.png" alt="BoardWise - Transit Decision Intelligence" width="100%"/>

### **Don't just track the bus. Know if you can board it.**

AI-powered transit decision intelligence for Hyderabad commuters.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.141-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?logo=python)](https://www.python.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind](https://img.shields.io/badge/Tailwind-v4-06B6D4?logo=tailwindcss)](https://tailwindcss.com/)
[![Motion](https://img.shields.io/badge/Motion-enabled-7C3AED)](https://motion.dev/)

</div>

---

## The Problem

Most transit apps answer **"When will my bus arrive?"** BoardWise answers **"Can I actually board it?"**

A bus can be on time and still be unusable because it is overcrowded or skips a stop. BoardWise turns commuter reports into a transparent **Boarding Confidence Score (BCS)** and a practical action:

```text
Commuter report -> Freshness + trust -> Boarding Confidence -> BOARD / WAIT / SWITCH
```

BCS combines:

- Crowding: 40%
- Stop reliability: 30%
- Punctuality: 20%
- Report freshness: 10%

Fresh reports matter more than stale reports through exponential freshness decay.

## What Makes It Different

### Explainable decision receipt

Every trip recommendation exposes its evidence: duration, reliability, fare source, crowding, boarding confidence, provider, and uncertainty. Reviewers can see why the decision was made instead of trusting a black box.

### Grounded AI assistant

Users can ask **Ask BoardWise** questions such as:

- Why was this route recommended?
- Which fare is verified?
- What data is missing?

Gemini explains only the returned route evidence. It never invents routes, fares, or live availability. A deterministic fallback keeps the core demo usable without Gemini.

## Features

- Hyderabad-specific place search with common hubs, landmarks, airport, and metro areas
- Debounced as-you-type search with provider labels and browser geolocation
- Real road routing through OSRM/OpenStreetMap
- Google Places and Google Routes support when a usable key is available
- Transparent fare states: provider fare, unavailable, or no live partner connected
- Natural-language commuter reports through `/api/ai_report`
- Ghost-stop and skipped-stop detection
- Live BCS updates and deterministic judge scenarios A-D
- JWT authentication with commuter-only public signup
- Admin-only command-center API with role-based authorization
- Responsive Next.js interface with Motion interactions

## Routes

| Route | Purpose | Access |
| --- | --- | --- |
| `/` | Product landing page | Signed in |
| `/plan` | Hyderabad trip planner and route comparison | Signed in |
| `/simulate` | Live BCS, reports, and judge scenarios | Signed in |
| `/login` | Login with demo autofill | Public |
| `/signup` | Create commuter account | Public |
| `/docs` | FastAPI interactive API docs | Backend |

The frontend command-center page was intentionally removed to keep the product focused. The backend admin endpoint remains protected for API-level administration.

## Demo Accounts

```text
Admin:     admin@boardwise.hyderabad / admin123
Commuter:  tester@boardwise.hyderabad / tester123
```

Public signup always creates a `commuter`; it cannot create an admin account.

## Tech Stack

**Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS v4, Motion, Lucide

**Backend:** Python, FastAPI, SQLAlchemy, SQLite, Pydantic, Uvicorn, JWT, Passlib/bcrypt

**Data and providers:** Hyderabad directory, SQLite commuter reports, OSRM/OpenStreetMap, Photon, optional Google Places/Routes, optional Gemini

## Quick Start

### Backend

```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Create `backend/.env`:

```env
FRONTEND_URL=http://localhost:3000
GEMINI_API_KEY=your_gemini_key
GOOGLE_MAPS_API_KEY=your_google_key
```

Only add provider keys if available. Never commit `.env`.

Start FastAPI:

```powershell
uvicorn main:app --reload --port 8000
```

API docs: `http://localhost:8000/docs`

### Frontend

```powershell
cd frontend
npm install
```

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Start Next.js:

```powershell
npm run dev
```

Open `http://localhost:3000`.

## Judge Walkthrough

1. Sign in with the admin demo account.
2. Open `/simulate` and show the current BCS, freshness, crowding, and action.
3. Apply scenario `A` to create an overcrowded, skipped-stop report.
4. Show the decision move toward `SWITCH`.
5. Submit: `The bus is packed and skipped the stop`.
6. Open `/plan` and search `Ameerpet` to `HITEC City`.
7. Compare provider-backed route results and expand **Why this recommendation?**
8. Ask BoardWise: `Why was this route recommended?`

Demo story:

> Most apps show the fastest route. BoardWise shows whether that route is actually usable right now, and proves the decision with evidence.

## API

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/api/auth/register` | Create commuter account |
| `POST` | `/api/auth/login` | Return JWT session |
| `GET` | `/api/auth/me` | Validate session |
| `GET` | `/api/state` | Current BCS and report state |
| `GET` | `/api/places/search` | Search Hyderabad places |
| `POST` | `/api/trips/plan` | Compare provider-backed routes |
| `POST` | `/api/trips/explain` | Grounded AI trip Q&A |
| `POST` | `/api/ai_report` | Parse and save natural-language report |
| `POST` | `/api/scenario/{id}` | Apply demo scenario A-D |
| `GET` | `/api/admin/command_center` | Admin-only operational data |

## Architecture

```text
Next.js UI
   -> FastAPI API
      -> SQLite reports + BCS engine
      -> Hyderabad place directory
      -> Google / Photon / OSRM providers
      -> Gemini explanation using verified evidence
```

The current MVP uses an explainable weighted BCS engine, not a trained ML model. A future model can be trained from accumulated, labeled commuter reports once enough real observations exist; claiming training before that data exists would be misleading.

## Deployment

### Render backend

- Root directory: `backend`
- Build: `pip install -r requirements.txt`
- Start: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- Set `FRONTEND_URL` to the deployed frontend URL.

### Vercel frontend

- Root directory: `frontend`
- Set `NEXT_PUBLIC_API_URL` to the deployed Render backend URL.

Provider APIs require network access. Google transit routes and Google fare data require a usable Google Maps project; without it, place search and road routing continue through the Hyderabad directory and OpenStreetMap providers.

## Status

This is a focused hackathon MVP: real provider-backed routing where available, persistent commuter reports, explainable decisions, authentication, RBAC, and grounded AI. The next production step is verified GTFS/TGSRTC data, stronger report verification, historical evaluation, and a calibrated boarding-prediction model.
