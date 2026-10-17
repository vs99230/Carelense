import { scanSample } from "../data/mockData.js";
import { localReply } from "./mockAI.js";

const BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";
const TIMEOUT_MS = 60000; // AI processing (Gemini) can take up to ~30s for multi-page PDFs
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function request(path, options = {}) {
  if (!BASE) throw new Error("No backend configured");
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${BASE}${path}`, { ...options, signal: ctrl.signal });
    if (!res.ok) {
      let message = `Request failed (${res.status})`;
      try {
        const body = await res.json();
        if (typeof body.detail === "string") message = body.detail;
      } catch {
        // The server may return a non-JSON error response.
      }
      throw new Error(message);
    }
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

/** POST /api/analyze — multipart `files`. */
export async function analyzeReports(files) {
  const form = new FormData();
  files.forEach((f) => form.append("files", f));
  const data = await request("/api/analyze", { method: "POST", body: form });
  if (!Array.isArray(data.lab_values)
      || typeof data.summary_en !== "string"
      || typeof data.summary_hi !== "string") {
    throw new TypeError("The backend returned an invalid report analysis.");
  }
  return { ...data, mock: false };
}

/** POST /api/scan — one image. Returns { items: [{ name, dose, food, slots, conf }] }. */
export async function scanPrescription(file) {
  if (!file) {
    await sleep(1400);
    return { items: scanSample.map((x) => ({ ...x })), mock: true };
  }
  const form = new FormData();
  form.append("file", file);
  const data = await request("/api/scan", { method: "POST", body: form });
  if (!Array.isArray(data.items)) throw new Error("The backend returned an invalid medicine scan.");
  return { items: data.items, mock: false };
}

/** POST /api/chat — { question, lang }. Falls back to local answers built from the demo data. */
export async function askAI(question, ctx) {
  try {
    const data = await request("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, lang: ctx.lang }),
    });
    if (typeof data.reply !== "string") throw new Error("The backend returned an invalid chat response.");
    return { reply: data.reply, mock: false };
  } catch {
    await sleep(650);
    return { reply: localReply(question, ctx), mock: true };
  }
}
