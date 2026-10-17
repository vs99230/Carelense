"""
CareLens – FastAPI backend
Endpoints:
  POST /api/analyze   – upload lab-report PDFs / images, returns parsed lab values
  POST /api/scan      – upload a prescription image, returns medicines list
  POST /api/chat      – AI health assistant (question + optional lang)

All three use Google Gemini 1.5-Flash for AI processing.
State (medicines, reminders, etc.) is managed by the frontend via localStorage.
This backend layer only handles file processing and AI inference.
"""

from __future__ import annotations

import base64
import io
import json
import logging
import os
import re
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any, Literal

try:
    import pymupdf as fitz  # pymupdf >= 1.24 (preferred name)
except ImportError:
    import fitz  # legacy alias
import google.generativeai as genai
from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
from pydantic import BaseModel, Field

# ---------------------------------------------------------
#  Config
# ---------------------------------------------------------
load_dotenv(Path(__file__).resolve().with_name(".env"))

logging.basicConfig(level=logging.INFO, format="%(levelname)s | %(message)s")
log = logging.getLogger("carelens")

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()
IS_CONFIGURED = bool(GEMINI_API_KEY and GEMINI_API_KEY != "your_gemini_api_key_here")
if not IS_CONFIGURED:
    log.warning("GEMINI_API_KEY is not set or is still the placeholder - AI endpoints will return 503 until a valid key is provided in backend/.env.")

ALLOWED_ORIGINS = [
    "http://localhost:5173",   # Vite dev server
    "http://localhost:4173",   # Vite preview
    "http://localhost:3000",
]

MAX_IMAGE_PIXELS = 1_024 * 1_024 * 4   # 4 MP after resize - keeps token count low
MAX_UPLOAD_BYTES = 10 * 1024 * 1024
MAX_REPORT_PAGES = 10
ALLOWED_UPLOAD_TYPES = {"application/pdf", "image/png", "image/jpeg", "image/webp"}
GEMINI_MODEL = "gemini-1.5-flash"


# ---------------------------------------------------------
#  Gemini client
# ---------------------------------------------------------
_model: genai.GenerativeModel | None = None


@asynccontextmanager
async def lifespan(_app: FastAPI):
    global _model
    if IS_CONFIGURED:
        genai.configure(api_key=GEMINI_API_KEY)
        _model = genai.GenerativeModel(GEMINI_MODEL)
        log.info("Gemini %s ready.", GEMINI_MODEL)
    else:
        log.warning("Gemini not configured - set your GEMINI_API_KEY in backend/.env")
    yield


def get_model() -> genai.GenerativeModel:
    if _model is None:
        raise HTTPException(503, detail="AI model not configured. Add GEMINI_API_KEY to backend/.env")
    return _model


# ---------------------------------------------------------
#  FastAPI app
# ---------------------------------------------------------
app = FastAPI(title="CareLens API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------
#  Utility helpers
# ---------------------------------------------------------

def _image_to_b64(img: Image.Image, fmt: str = "JPEG") -> str:
    """Return a base64-encoded string of the PIL image."""
    buf = io.BytesIO()
    img.save(buf, format=fmt)
    return base64.b64encode(buf.getvalue()).decode()


def _resize_if_needed(img: Image.Image) -> Image.Image:
    """Downscale large images to stay within MAX_IMAGE_PIXELS."""
    w, h = img.size
    if w * h > MAX_IMAGE_PIXELS:
        scale = (MAX_IMAGE_PIXELS / (w * h)) ** 0.5
        img = img.resize((int(w * scale), int(h * scale)), Image.LANCZOS)
    return img


def _pdf_to_images(pdf_bytes: bytes, max_pages: int = MAX_REPORT_PAGES) -> list[Image.Image]:
    """Render at most max_pages pages of a PDF as PIL images."""
    images = []
    with fitz.open(stream=pdf_bytes, filetype="pdf") as doc:
        for page_number, page in enumerate(doc):
            if page_number >= max_pages:
                break
            pix = page.get_pixmap(dpi=150)
            images.append(Image.frombytes("RGB", (pix.width, pix.height), pix.samples))
    return images


def _file_to_images(
    data: bytes,
    content_type: str,
    max_pages: int = MAX_REPORT_PAGES,
) -> list[Image.Image]:
    """Convert an uploaded file (PDF or image) to a list of PIL Images."""
    if content_type == "application/pdf":
        return _pdf_to_images(data, max_pages)
    img = Image.open(io.BytesIO(data)).convert("RGB")
    return [img]


def _images_to_gemini_parts(images: list[Image.Image]) -> list[dict]:
    """Convert PIL images to Gemini inline_data parts."""
    parts = []
    for img in images:
        img = _resize_if_needed(img)
        parts.append({
            "inline_data": {
                "mime_type": "image/jpeg",
                "data": _image_to_b64(img),
            }
        })
    return parts


def _extract_json(text: str) -> Any:
    """Pull the first JSON object or array from a Gemini response string."""
    # Try to find a fenced code block first
    fence = re.search(r"```(?:json)?\s*([\s\S]+?)```", text)
    candidate = fence.group(1) if fence else text
    # Find the outermost { } or [ ]
    m = re.search(r"(\{[\s\S]*\}|\[[\s\S]*\])", candidate)
    if not m:
        raise ValueError(f"No JSON found in: {text[:200]}")
    return json.loads(m.group(1))


# ---------------------------------------------------------
#  Pydantic models
# ---------------------------------------------------------

class ChatRequest(BaseModel):
    question: str = Field(min_length=1, max_length=4000)
    lang: Literal["en", "hi"] = "en"


class LabValue(BaseModel):
    id: str
    name: str
    unit: str
    curr: float
    prev: float | None = None
    refLow: float | None = None
    refHigh: float | None = None
    min: float
    max: float
    en: str
    hi: str


class AnalyzeResponse(BaseModel):
    mock: bool = False
    lab_values: list[LabValue] = Field(default_factory=list)
    summary_en: str = ""
    summary_hi: str = ""


class MedicineItem(BaseModel):
    name: str
    dose: str
    food: str
    slots: list[Literal["morning", "afternoon", "night"]]
    conf: float = Field(ge=0, le=1)


class ScanResponse(BaseModel):
    mock: bool = False
    items: list[MedicineItem]


class ChatResponse(BaseModel):
    reply: str
    mock: bool = False


def _read_upload(upload: UploadFile) -> bytes:
    content_type = (upload.content_type or "").split(";", 1)[0].lower()
    if content_type not in ALLOWED_UPLOAD_TYPES:
        raise HTTPException(
            status_code=415,
            detail="Use a PDF, PNG, JPG, or WebP file.",
        )
    data = upload.file.read(MAX_UPLOAD_BYTES + 1)
    if len(data) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="Files must be 10 MB or smaller.")
    if not data:
        raise HTTPException(status_code=422, detail="The uploaded file is empty.")
    return data


def _add_chart_bounds(value: dict[str, Any]) -> dict[str, Any]:
    """Add a stable chart scale for the frontend's lab-value ruler."""
    points = [value["curr"]]
    points.extend(
        point
        for point in (value.get("prev"), value.get("refLow"), value.get("refHigh"))
        if point is not None
    )
    lower, upper = min(points), max(points)
    margin = (upper - lower) * 0.2
    if margin == 0:
        margin = max(abs(upper) * 0.1, 1.0)
    nonnegative = min(points) >= 0
    if value.get("refLow") is None and value.get("refHigh") is not None and nonnegative:
        chart_min = 0.0
        chart_max = upper + max(margin, abs(upper) * 0.1, 1.0)
    else:
        chart_min = lower - max(
            margin,
            abs(lower) * 0.1 if value.get("refLow") is not None else 0.0,
        )
        chart_max = upper + margin
        if nonnegative:
            chart_min = max(0.0, chart_min)
    if chart_max <= chart_min:
        chart_max = chart_min + 1.0
    return {**value, "min": chart_min, "max": chart_max}


# ---------------------------------------------------------
#  /api/health
# ---------------------------------------------------------

@app.get("/api/health")
async def health():
    return {"status": "ok", "model": GEMINI_MODEL, "ai_ready": _model is not None}


# ---------------------------------------------------------
#  POST /api/analyze  - Lab report analysis
# ---------------------------------------------------------

ANALYZE_PROMPT = """
You are a medical-report assistant. The user has uploaded one or more lab-report pages.

TASK
1. Extract every numeric lab value you can find.
2. For each value produce a short, jargon-free explanation in English (en) and Hindi using Latin script / Hinglish (hi).
3. Summarise the overall report in 1-2 sentences in both languages.

RULES
- Do NOT diagnose or prescribe. End every explanation with a brief note to confirm with a doctor.
- If a reference range is printed on the report, use it. Otherwise omit refLow / refHigh.
- Include prev only when a previous value is visible in the uploaded report.
- Do not invent reference ranges, previous results, or lab values.
- Do not include min or max; the backend adds chart bounds for the frontend.

OUTPUT - return ONLY this JSON, nothing else:
{
  "lab_values": [
    {
      "id": "slug_lowercase_no_spaces",
      "name": "Full test name",
      "unit": "unit string",
      "curr": 12.8,
      "prev": null,
      "refLow": 13,
      "refHigh": 17,
      "en": "Plain-English explanation (1-3 sentences). End with: Discuss with your doctor.",
      "hi": "Hinglish explanation. End with: Apne doctor se zaroor poochein."
    }
  ],
  "summary_en": "1-2 sentence overall summary in English.",
  "summary_hi": "1-2 sentence overall summary in Hinglish."
  }
  """


@app.post("/api/analyze", response_model=AnalyzeResponse)
async def analyze_reports(files: list[UploadFile] = File(...)):
    model = get_model()
    all_images: list[Image.Image] = []

    for f in files:
        pages_remaining = MAX_REPORT_PAGES - len(all_images)
        if pages_remaining <= 0:
            break
        data = _read_upload(f)
        ct = (f.content_type or "").split(";", 1)[0].lower()
        try:
            all_images.extend(_file_to_images(data, ct, pages_remaining))
        except Exception as exc:
            log.error("Could not read %s: %s", f.filename, exc)
            raise HTTPException(422, detail=f"Could not read {f.filename}: {exc}") from exc

    if not all_images:
        raise HTTPException(422, detail="No readable pages found in the uploaded files.")

    # Cap at 10 pages to stay inside Gemini context limits
    parts = [ANALYZE_PROMPT] + _images_to_gemini_parts(all_images)

    try:
        response = model.generate_content(parts)
        parsed = _extract_json(response.text)
        if not isinstance(parsed, dict) or not isinstance(parsed.get("lab_values", []), list):
            raise ValueError("The AI response did not contain a valid lab_values array.")
        lab_values = [
            LabValue(**_add_chart_bounds(lab_value))
            for lab_value in parsed.get("lab_values", [])
        ]
    except Exception as exc:
        log.error("Gemini analyze error: %s", exc)
        raise HTTPException(502, detail=f"AI processing failed: {exc}") from exc

    return AnalyzeResponse(
        mock=False,
        lab_values=lab_values,
        summary_en=parsed.get("summary_en", ""),
        summary_hi=parsed.get("summary_hi", ""),
    )


# ---------------------------------------------------------
#  POST /api/scan  - Prescription scanner
# ---------------------------------------------------------

SCAN_PROMPT = """
You are a prescription OCR assistant. The user has photographed a prescription or medicine strip.

TASK
Extract every medicine listed. For each medicine return:
- name: full medicine name as written
- dose: dosage (e.g. "500 mg", "40 mg")
- food: instructions like "After meals", "Before breakfast", "Once a week"
- slots: which of ["morning", "afternoon", "night"] to take it (infer from 1-0-1 style notation if present)
- conf: your confidence in this reading (0.0-1.0). Use < 0.8 if handwriting is unclear.

RULES
- Include medicines even if handwriting is unclear - set conf < 0.8 for unclear ones.
- Do NOT add any medicine not visible in the image.
- If you cannot read a field, use "?" as the value.

OUTPUT - return ONLY this JSON array, nothing else:
[
  {
    "name": "Medicine Name",
    "dose": "500 mg",
    "food": "After meals",
    "slots": ["morning", "night"],
    "conf": 0.95
  }
]
"""


@app.post("/api/scan", response_model=ScanResponse)
async def scan_prescription(file: UploadFile = File(...)):
    model = get_model()
    data = _read_upload(file)
    ct = (file.content_type or "").split(";", 1)[0].lower()

    try:
        images = _file_to_images(data, ct, max_pages=1)
    except Exception as exc:
        raise HTTPException(422, detail=f"Could not read image: {exc}") from exc

    # Use only the first page / image for prescription scan
    if not images:
        raise HTTPException(422, detail="No readable image found in the uploaded file.")

    img = images[0]
    img = _resize_if_needed(img)
    parts = [SCAN_PROMPT, {"inline_data": {"mime_type": "image/jpeg", "data": _image_to_b64(img)}}]

    try:
        response = model.generate_content(parts)
        parsed = _extract_json(response.text)
        if not isinstance(parsed, list):
            if not isinstance(parsed, dict):
                raise ValueError("The AI response did not contain a medicine list.")
            parsed = parsed.get("medicines", parsed.get("items", []))
        if not isinstance(parsed, list):
            raise ValueError("The AI response did not contain a medicine list.")
        items = [MedicineItem(**item) for item in parsed]
    except Exception as exc:
        log.error("Gemini scan error: %s", exc)
        raise HTTPException(502, detail=f"AI processing failed: {exc}") from exc

    return ScanResponse(mock=False, items=items)


# ---------------------------------------------------------
#  POST /api/chat  - AI health assistant
# ---------------------------------------------------------

CHAT_SYSTEM = """You are CareLens AI, a compassionate and knowledgeable health assistant.

PERSONALITY
- Warm, clear, never condescending.
- Always remind the user to confirm important decisions with their doctor.

LANGUAGE
- If lang == "hi" or the question contains Hinglish/Hindi words, reply in Hinglish (Hindi using Latin script).
- Otherwise reply in English.
- Keep replies concise (150 words max).

SAFETY
- For chest pain, breathlessness, fainting, or any emergency symptom: tell the user to call 112 immediately.
- Never prescribe, diagnose, or advise changing a prescribed medicine dose.
- For anything outside health/medicine, politely say you can only help with health queries.
"""


@app.post("/api/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    model = get_model()

    prompt = f"""{CHAT_SYSTEM}

User language preference: {req.lang}
User question: {req.question}

Reply:"""

    try:
        response = model.generate_content(prompt)
        return ChatResponse(reply=response.text.strip(), mock=False)
    except Exception as exc:
        log.error("Gemini chat error: %s", exc)
        raise HTTPException(502, detail=f"AI processing failed: {exc}") from exc
