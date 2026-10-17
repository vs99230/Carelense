# CareLens AI — Frontend

Gemini-powered multimodal healthcare companion (Team DevSphare, Hackbase Hackathon).
React 18 + Vite + React Router. Runs fully on demo data; talks to the FastAPI backend when `VITE_API_URL` points to one.

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build in dist/
```

## Features → where they live

| # | Feature | Page / component |
|---|---|---|
| 1 | Medical report analysis | `/app/reports` → `pages/Reports.jsx`, `components/ReportUpload.jsx` |
| 2 | What changed since last time | Reports → second tab, `components/ReportCompare.jsx` |
| 3 | Medicine routine builder | `/app/medicines` → `pages/Medicines.jsx`, `components/MedicineSchedule.jsx` |
| 4 | AI chat with voice (English / Hinglish) | `components/ChatDock.jsx`, `AIChat.jsx`, `VoiceInput.jsx` (floating button on every page) |
| 5 | Body simulation / symptom map | `/app/symptoms` → `pages/BodySimulation.jsx`, `components/BodyMap.jsx` |
| 6 | Health timeline | `/app/timeline` → `pages/Timeline.jsx` |
| 7 | Doctor visit summary | `/app/summary` → `components/DoctorSummary.jsx` (print / save as PDF / share) |
| 8 | Appointment prep countdown | `components/PrepCountdown.jsx` (dashboard + summary) |
| 9 | Prescription / medicine scanner | `/app/scanner` → `pages/Scanner.jsx` (unclear text is highlighted for verification) |
| 10 | Smart reminders | `/app/reminders` → `pages/Reminders.jsx` (fires while the app is open) |
| 11 | Family / caregiver mode | `/app/family` → `pages/Family.jsx` (native share sheet or WhatsApp) |
| 12 | Safe health companion | Sidebar note, footer line, chat replies, red-flag warnings in the symptom log |

All user data (symptoms, taken doses, questions, reminders, family) is kept in `localStorage` through `src/context/AppContext.jsx`.

## Backend contract (optional)

Set `VITE_API_URL` in `.env`. If it is empty or unreachable, the app falls back to demo data.

- `POST /api/analyze` — multipart `files`
- `POST /api/scan` — multipart `file` → `{ items: [{ name, dose, food, slots, conf }] }`
- `POST /api/chat` — `{ question, lang: "en" | "hi" }` → `{ reply }`

## Notes

- `src/assets/` is reserved for a 3D body model (`human-body.glb`). The symptom map is an SVG for now.
- Voice input uses the browser Speech Recognition API (Chrome / Edge). Hinglish mode listens in `hi-IN`.
- Browser alerts need permission (Reminders page). Phone push needs the backend.

*Not an AI Doctor — an AI Companion for Understanding & Preparing.*
