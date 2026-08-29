# 🚌 BoardWise

<div align="center">

<img src="./assets/commute_pics.png" alt="BoardWise - Transit Decision Intelligence" width="100%"/>

### **Don't just track the bus. Know if you can board it.**

AI-powered urban transit decision intelligence for Hyderabad commuters.

</div>

### **Don't just track the bus. Know if you can board it.**

AI-powered urban transit decision intelligence for Hyderabad commuters.

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?logo=python)](https://www.python.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind](https://img.shields.io/badge/Tailwind-v4-06B6D4?logo=tailwindcss)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

</div>

---

## 🚦 What is BoardWise?

Most transit apps answer:

> **"When will my bus arrive?"**

BoardWise answers:

> **"Can I actually board it?"**

It calculates a **Boarding Confidence Score (BCS) from 0–100** using:

* 🧍 **Crowding** — 40%
* 📍 **Stop reliability** — 30%
* ⏱️ **Punctuality** — 20%
* 🕐 **Data freshness** — 10%

When boarding confidence is low, BoardWise recommends the best alternative — **Metro, another bus, walking, or auto** — based on time, cost, and reliability.

```text
Commuter Reports + Transit Signals
                ↓
      Freshness + Trust Layer
                ↓
       Boarding Confidence
                ↓
        Decision Engine
                ↓
     ┌──────────┼──────────┐
   BOARD       WAIT      SWITCH
                         ↓
                 Metro / Bus / Auto
```

> **Sense → Score → Explain → Recommend**

---

## ✨ MVP Features

* 📊 Explainable **Boarding Confidence Score**
* 🧍 Crowding intelligence from commuter reports
* 🕐 Exponential freshness decay
* 🛡️ Simulated trust & location verification
* 🤖 Natural-language `/api/ai_report`
* 👻 Ghost-stop / stop reliability detection
* 🚇 Multi-modal recommendations
* 🎭 Deterministic demo scenarios
* 🏙️ Commuter dashboard + transit command center
* ⚡ Real-time UI updates from FastAPI state

---

## 🖥️ Product

| Route       | Purpose                    |
| ----------- | -------------------------- |
| `/`         | Product landing & pitch    |
| `/simulate` | 🚀 Live hackathon MVP      |
| `/command`  | 🏙️ Transit command center |
| `/docs`     | FastAPI API documentation  |

### Demo Scenarios

| Scenario                 | Result                                  |
| ------------------------ | --------------------------------------- |
| `A` — Crowded 218D       | 🔴 Low BCS → Switch mode                |
| `B` — Good 218D          | 🟢 High BCS → Board                     |
| `C` — Ghost Stop         | ⚠️ Low stop reliability                 |
| `D` — Freshness Conflict | 🕐 Fresh reports outweigh stale reports |

---

# 🏗️ Tech Stack

**Frontend**

`Next.js` · `React` · `TypeScript` · `Tailwind CSS v4` · `Framer Motion`

**Backend**

`Python` · `FastAPI` · `Pydantic` · `Uvicorn`

**MVP Data**

Deterministic in-memory transit state — intentionally database-free for a fast, reproducible hackathon demo.

---

# 🚀 Quick Start

### 1. Clone

```bash
git clone https://github.com/YOUR_USERNAME/boardwise.git
cd boardwise
```

---

## 2. Backend

```bash
cd backend

python -m venv .venv
```

### Activate virtual environment

**macOS / Linux**

```bash
source .venv/bin/activate
```

**Windows**

```powershell
.venv\Scripts\Activate.ps1
```

### Install dependencies

```bash
pip install -r requirements.txt
```

### Create backend environment

Create:

```text
backend/.env
```

Example:

```env
FRONTEND_URL=http://localhost:3000
PORT=8000
```

If your backend uses additional secrets, add them here:

```env
OPENAI_API_KEY=your_key_here
```

> Never commit `.env` to Git. Add `.env` to `.gitignore`.

### Start FastAPI

```bash
uvicorn main:app --reload --port 8000
```

Backend:

**http://localhost:8000**

API docs:

**http://localhost:8000/docs**

---

## 3. Frontend

Open a new terminal:

```bash
cd frontend

npm install
```

Create:

```text
frontend/.env.local
```

Add:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Start Next.js:

```bash
npm run dev
```

Frontend:

**http://localhost:3000**

---

# 🎬 Run the Demo

Open:

### 🚀 Commuter MVP

```text
http://localhost:3000/simulate
```

### 🏙️ Command Center

```text
http://localhost:3000/command
```

### 🏠 Landing Page

```text
http://localhost:3000
```

---

# 🔌 API

| Method | Endpoint             | Purpose                   |
| ------ | -------------------- | ------------------------- |
| `GET`  | `/api/state`         | Current BCS & route state |
| `POST` | `/api/scenario/{id}` | Load demo scenario        |
| `POST` | `/api/report`        | Submit crowd report       |
| `POST` | `/api/simulate_time` | Advance simulated time    |
| `POST` | `/api/ai_report`     | Parse commuter report     |

Example:

```bash
curl -X POST http://localhost:8000/api/ai_report \
  -H "Content-Type: application/json" \
  -d '{"text":"The bus is packed and did not stop"}'
```

---

# 🧠 Boarding Confidence

```text
BCS =
  40% × Crowding
+ 30% × Stop Reliability
+ 20% × Punctuality
+ 10% × Freshness
```

Freshness:

```text
freshness = exp(-age_minutes / 10)
```

Fresh, verified reports have greater influence than old or unverified reports.

---

# 📁 Structure

```text
BoardWise/
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   └── .env
│
├── frontend/
│   ├── app/
│   │   ├── page.tsx
│   │   ├── simulate/
│   │   └── command/
│   ├── package.json
│   └── .env.local
│
└── README.md
```

---

# 🌐 Deployment

### Backend — Render

```text
Root Directory: backend
Build: pip install -r requirements.txt
Start: uvicorn main:app --host 0.0.0.0 --port 10000
```

Set:

```env
FRONTEND_URL=https://your-vercel-app.vercel.app
```

### Frontend — Vercel

Set:

```env
NEXT_PUBLIC_API_URL=https://your-render-backend.onrender.com
```

---

# ⚠️ Hackathon MVP

BoardWise currently uses **simulated transit data and deterministic NLP**.

No live TGSRTC/GTFS feed is required for the demo.

The architecture is designed so simulated signals can later be replaced with:

* GTFS-Realtime
* TGSRTC data
* Verified commuter reports
* Multilingual voice AI
* Mobility APIs
* Persistent historical data
* ML-based boarding prediction

---

<div align="center">

### 🚌 BoardWise

**From "Where is my bus?" → "What's the smartest way to get there?"**

Built for the hackathon 🚀

</div>
