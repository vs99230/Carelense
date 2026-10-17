# CareLens – Backend

FastAPI + Google Gemini backend for the CareLens health app.

## Endpoints

| Method | Path | What it does |
|--------|------|--------------|
| GET | `/api/health` | Returns `{ status: "ok", ai_ready: true/false }` |
| POST | `/api/analyze` | Upload lab-report PDFs or images → returns parsed lab values + plain-language explanations |
| POST | `/api/scan` | Upload a prescription photo → returns medicines list (name, dose, slots, confidence) |
| POST | `/api/chat` | Send `{ question, lang }` → returns AI health assistant reply |

## Setup

### 1. Get a Gemini API key
Go to https://aistudio.google.com/apikey, create a key, and copy it.

### 2. Add the key to `.env`
```
GEMINI_API_KEY=your_key_here
```

### 3. Create & activate virtual environment
```powershell
# Windows PowerShell
python -m venv venv
.\venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt
```

### 4. Run the backend
```powershell
uvicorn main:app --reload --port 8000
```

The API is now live at http://localhost:8000

### 5. Connect the frontend
The frontend already points to `http://localhost:8000` via `frontend/.env`:
```
VITE_API_URL=http://localhost:8000
```
Start the frontend (`npm run dev` in `frontend/`) and the backend together.

## API Details

### POST /api/analyze
- **Content-Type**: `multipart/form-data`
- **Field**: `files` (one or more files, PDF/PNG/JPG/WebP, max 10 MB each)
- **Response**:
```json
{
  "mock": false,
  "lab_values": [
    {
      "id": "hb",
      "name": "Hemoglobin",
      "unit": "g/dL",
      "curr": 12.8,
      "prev": 11.2,
      "refLow": 13,
      "refHigh": 17,
      "min": 10.04,
      "max": 18.16,
      "en": "Hemoglobin carries oxygen... Discuss with your doctor.",
      "hi": "Hemoglobin khoon mein... Apne doctor se zaroor poochein."
    }
  ],
  "summary_en": "...",
  "summary_hi": "..."
}
```
`min` and `max` are chart-axis bounds used by the frontend's lab ruler. The backend derives them from the current and previous values and any printed reference limits; they are not medical reference limits. `refLow` and `refHigh` are nullable when the report does not show a range.

### POST /api/scan
- **Content-Type**: `multipart/form-data`
- **Field**: `file` (one image, PNG/JPG/WebP, max 10 MB)
- **Response**:
```json
{
  "mock": false,
  "items": [
    { "name": "Metformin", "dose": "500 mg", "food": "After meals", "slots": ["morning", "night"], "conf": 0.97 }
  ]
}
```

### POST /api/chat
- **Content-Type**: `application/json`
- **Body**: `{ "question": "What does my HbA1c mean?", "lang": "en" }`
- **Response**:
```json
{ "reply": "HbA1c is...", "mock": false }
```
- `lang` is `en` or `hi`; `hi` requests a Hinglish reply.

Uploads must use PDF, PNG, JPG, or WebP and be 10 MB or smaller. Invalid file types return `415`, oversized files return `413`, unreadable files return `422`, and unavailable AI configuration returns `503`.

## Interactive API docs
Visit http://localhost:8000/docs (Swagger UI) when the server is running.
