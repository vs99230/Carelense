import { addDays, dateKey, uid } from "./helpers.js";

export const patient = { name: "vaibhav singh", first: "Vaibhav", initials: "VS" };

export const SLOTS = [
  { id: "morning", label: "Morning", hint: "Wake-up to breakfast" },
  { id: "afternoon", label: "Afternoon", hint: "Around lunch" },
  { id: "night", label: "Night", hint: "Dinner to bedtime" },
];

export const reportMeta = {
  prev: { date: "2026-04-12", lab: "PathLab, Noida" },
  curr: { date: "2026-10-02", lab: "PathLab, Noida" },
};

/* Lab values shown in "Report analysis" and "What changed". */
export const labValues = [
  {
    id: "hb", name: "Hemoglobin", unit: "g/dL", prev: 11.2, curr: 12.8, refLow: 13, refHigh: 17, min: 8, max: 18,
    en: "Hemoglobin carries oxygen in your blood. 12.8 is just under the usual 13–17 range, which can leave you tired. It is up from 11.2 last time.",
    hi: "Hemoglobin khoon mein oxygen le jaata hai. 12.8 normal range (13–17) se thoda kam hai, isse thakaan ho sakti hai. Pichhli baar 11.2 tha, yaani sudhaar hua hai.",
  },
  {
    id: "vitd", name: "Vitamin D (25-OH)", unit: "ng/mL", prev: 14, curr: 24, refLow: 30, refHigh: 100, min: 0, max: 100,
    en: "Vitamin D keeps bones and muscles strong. 24 is below the 30–100 range but well up from 14, which suggests the supplement is helping.",
    hi: "Vitamin D haddiyon aur muscles ke liye zaroori hai. 24, 30–100 range se kam hai, lekin 14 se kaafi badha hai — matlab supplement kaam kar raha hai.",
  },
  {
    id: "glu", name: "Fasting glucose", unit: "mg/dL", prev: 118, curr: 104, refLow: 70, refHigh: 99, min: 50, max: 180,
    en: "This is your blood sugar after an overnight fast. 104 is a little above 99 but has come down from 118.",
    hi: "Yeh raat bhar ke fast ke baad ka blood sugar hai. 104, 99 se thoda upar hai, lekin 118 se neeche aaya hai.",
  },
  {
    id: "a1c", name: "HbA1c", unit: "%", prev: 6.4, curr: 6.0, refLow: null, refHigh: 5.6, min: 4, max: 9,
    en: "HbA1c is your average blood sugar over about 3 months. 6.0% is above the 5.6% mark but lower than the 6.4% before.",
    hi: "HbA1c pichhle 3 mahine ka average sugar batata hai. 6.0%, 5.6% se upar hai, lekin pehle ke 6.4% se kam hai.",
  },
  {
    id: "chol", name: "Total cholesterol", unit: "mg/dL", prev: 218, curr: 196, refLow: null, refHigh: 199, min: 100, max: 300,
    en: "Cholesterol is a fat in your blood. 196 is under the 199 limit, so this is now in the desirable range.",
    hi: "Cholesterol khoon mein ek tarah ki fat hai. 196, 199 ki limit se neeche hai, yaani ab theek range mein hai.",
  },
  {
    id: "tsh", name: "TSH", unit: "µIU/mL", prev: 3.1, curr: 3.4, refLow: 0.4, refHigh: 4.0, min: 0, max: 8,
    en: "TSH shows how your thyroid is working. 3.4 sits inside the 0.4–4.0 range and is close to last time.",
    hi: "TSH thyroid ka kaam dikhata hai. 3.4, 0.4–4.0 range ke andar hai aur pichhli baar ke kareeb hai.",
  },
  {
    id: "crea", name: "Creatinine", unit: "mg/dL", prev: 0.9, curr: 0.9, refLow: 0.7, refHigh: 1.3, min: 0, max: 2.5,
    en: "Creatinine reflects how well your kidneys filter. 0.9 is inside the 0.7–1.3 range and unchanged.",
    hi: "Creatinine batata hai ki kidney kitni achhi tarah filter kar rahi hai. 0.9, 0.7–1.3 range ke andar hai aur pehle jaisa hi hai.",
  },
];

export const staticEvents = [
  { id: "e1", type: "report", at: "2026-10-02T09:00:00", title: "Blood report — PathLab", detail: "7 values read. 4 are outside range, all 4 moved in a better direction." },
  { id: "e2", type: "medicine", at: "2026-06-18T10:00:00", title: "Atorvastatin 10 mg added", detail: "Added by Dr. Mehta for cholesterol." },
  { id: "e3", type: "visit", at: "2026-04-14T11:30:00", title: "Visit — Dr. Anita Mehta", detail: "Reviewed baseline report. Started Metformin and Vitamin D3." },
  { id: "e4", type: "medicine", at: "2026-04-14T12:00:00", title: "Metformin 500 mg and Vitamin D3 started", detail: "Metformin twice a day, Vitamin D3 once a week." },
  { id: "e5", type: "report", at: "2026-04-12T08:30:00", title: "Baseline blood report — PathLab", detail: "First report on CareLens." },
];

export const suggestedQuestions = [
  "What do my results mean for my daily routine?",
  "Do I need any new tests before the next visit?",
  "Are my current medicines still the right ones?",
  "Which symptoms should make me call you sooner?",
];

export const scanSample = [
  { name: "Metformin", dose: "500 mg", food: "1-0-1, after food", slots: ["morning", "night"], conf: 0.97 },
  { name: "Pantoprazole", dose: "40 mg", food: "1-0-0, empty stomach", slots: ["morning"], conf: 0.94 },
  { name: "Atorvastatin", dose: "10 mg", food: "0-0-1, after dinner", slots: ["night"], conf: 0.91 },
  { name: "Vit D3 (handwriting unclear)", dose: "60,000 IU?", food: "once a week?", slots: ["morning"], conf: 0.58 },
  { name: "Calcium + D3", dose: "500 mg", food: "0-1-0, after lunch", slots: ["afternoon"], conf: 0.72 },
];

export const symptomTypes = ["Pain", "Swelling", "Headache", "Dizziness", "Numbness", "Burning", "Stiffness", "Fatigue", "Nausea", "Itching"];

/* Body zones for the symptom map. viewBox 0 0 240 520. cx,cy = marker position. */
export const zones = [
  { id: "head", label: "Head", cx: 120, cy: 46, shapes: [["ellipse", { cx: 120, cy: 46, rx: 27, ry: 31 }]] },
  { id: "neck", label: "Neck", cx: 120, cy: 87, shapes: [["rect", { x: 108, y: 78, width: 24, height: 18, rx: 8 }]] },
  { id: "chest", label: "Chest", cx: 120, cy: 131, shapes: [["rect", { x: 78, y: 98, width: 84, height: 66, rx: 20 }]] },
  { id: "abdomen", label: "Abdomen", cx: 120, cy: 198, shapes: [["rect", { x: 84, y: 168, width: 72, height: 60, rx: 18 }]] },
  { id: "hips", label: "Hips", cx: 120, cy: 249, shapes: [["rect", { x: 82, y: 232, width: 76, height: 34, rx: 16 }]] },
  { id: "r_arm", label: "Right arm", cx: 56, cy: 185, shapes: [["rect", { x: 46, y: 100, width: 26, height: 80, rx: 13 }], ["rect", { x: 40, y: 184, width: 24, height: 84, rx: 12 }]] },
  { id: "l_arm", label: "Left arm", cx: 184, cy: 185, shapes: [["rect", { x: 168, y: 100, width: 26, height: 80, rx: 13 }], ["rect", { x: 176, y: 184, width: 24, height: 84, rx: 12 }]] },
  { id: "r_leg", label: "Right thigh", cx: 101, cy: 323, shapes: [["rect", { x: 84, y: 270, width: 34, height: 106, rx: 16 }]] },
  { id: "l_leg", label: "Left thigh", cx: 139, cy: 323, shapes: [["rect", { x: 122, y: 270, width: 34, height: 106, rx: 16 }]] },
  { id: "r_knee", label: "Right knee", cx: 101, cy: 386, shapes: [["ellipse", { cx: 101, cy: 386, rx: 15, ry: 12 }]] },
  { id: "l_knee", label: "Left knee", cx: 139, cy: 386, shapes: [["ellipse", { cx: 139, cy: 386, rx: 15, ry: 12 }]] },
  { id: "r_shin", label: "Right lower leg", cx: 101, cy: 442, shapes: [["rect", { x: 86, y: 402, width: 30, height: 82, rx: 14 }]] },
  { id: "l_shin", label: "Left lower leg", cx: 139, cy: 442, shapes: [["rect", { x: 124, y: 402, width: 30, height: 82, rx: 14 }]] },
  { id: "r_foot", label: "Right foot", cx: 100, cy: 498, shapes: [["rect", { x: 80, y: 488, width: 40, height: 18, rx: 9 }]] },
  { id: "l_foot", label: "Left foot", cx: 140, cy: 498, shapes: [["rect", { x: 120, y: 488, width: 40, height: 18, rx: 9 }]] },
];

export const zoneLabel = (id) => zones.find((z) => z.id === id)?.label ?? id;

/* Fresh state; dates that matter are relative to "now" so the demo never looks stale. */
export function seed() {
  const now = new Date();
  const appt = new Date(now);
  appt.setDate(appt.getDate() + 7);
  appt.setHours(10, 30, 0, 0);
  const apptDay = dateKey(appt);

  return {
    lang: "en",
    appointment: { doctor: "Dr. Anita Mehta", specialty: "General physician", place: "City Care Clinic, Noida", at: appt.toISOString() },
    meds: [
      { id: "m1", name: "Metformin", dose: "500 mg", slots: ["morning", "night"], food: "After meals" },
      { id: "m2", name: "Pantoprazole", dose: "40 mg", slots: ["morning"], food: "Before breakfast" },
      { id: "m3", name: "Calcium + D3", dose: "500 mg", slots: ["afternoon"], food: "After lunch" },
      { id: "m4", name: "Atorvastatin", dose: "10 mg", slots: ["night"], food: "After dinner" },
      { id: "m5", name: "Vitamin D3", dose: "60,000 IU", slots: ["morning"], food: "Once a week (Sunday), after breakfast", weekday: 0 },
    ],
    slotTimes: { morning: "08:00", afternoon: "14:00", night: "21:00" },
    slotReminders: { morning: true, afternoon: true, night: true },
    taken: {},
    symptoms: [
      { id: uid(), part: "head", partLabel: "Head", type: "Headache", intensity: 5, duration: "Few days", note: "After long hours on the laptop", at: addDays(now, -2).toISOString() },
      { id: uid(), part: "r_knee", partLabel: "Right knee", type: "Pain", intensity: 4, duration: "Today", note: "While climbing stairs", at: addDays(now, -5).toISOString() },
    ],
    questions: [
      "My hemoglobin is still slightly low (12.8). Do I need iron tests or a diet change?",
      "Vitamin D went from 14 to 24. How long should I continue the weekly dose?",
      "My HbA1c is 6.0%. What target should I aim for?",
    ],
    uploads: [],
    prep: { meds: false, share: false },
    reminders: [
      { id: uid(), title: "Morning medicines", type: "medicine", time: "08:00", repeat: "Daily", date: null, on: true },
      { id: uid(), title: "Afternoon medicines", type: "medicine", time: "14:00", repeat: "Daily", date: null, on: true },
      { id: uid(), title: "Night medicines", type: "medicine", time: "21:00", repeat: "Daily", date: null, on: true },
      { id: uid(), title: "Log symptoms and finish your questions", type: "appointment", time: "18:00", repeat: null, date: dateKey(addDays(appt, -2)), on: true },
      { id: uid(), title: "Visit Dr. Mehta at City Care Clinic", type: "visit", time: "09:30", repeat: null, date: apptDay, on: true },
      { id: uid(), title: "HbA1c re-test", type: "test", time: "08:00", repeat: null, date: dateKey(addDays(now, 38)), on: true },
    ],
    members: [
      { id: "me", name: "Vaibhav Singh", relation: "You", share: { summary: true, reminders: true }, missedAlert: false },
      { id: uid(), name: "Sunita Singh", relation: "Mother", share: { summary: true, reminders: true }, missedAlert: true },
      { id: uid(), name: "Neha Singh", relation: "Sister", share: { summary: false, reminders: false }, missedAlert: false },
    ],
  };
}
