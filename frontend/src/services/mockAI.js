import { labValues } from "../data/mockData.js";
import { dosesToday, toTimeLabel } from "../data/helpers.js";

const HINGLISH = /\b(kya|hai|hain|mera|meri|mere|kaise|kaisa|dawai|dawa|dard|kitna|kitni|batao|bataiye|samjhao|nahi|kab|kyun|khana|raat|subah|dopahar|sugar|chakkar|thakaan|thakan|sar|seene|saans)\b/i;

const find = (id) => labValues.find((l) => l.id === id);

const SAFE = {
  en: "This helps you understand your results. It is not a diagnosis, so please confirm with your doctor.",
  hi: "Yeh sirf samajhne ke liye hai, diagnosis nahi hai. Apne doctor se zaroor confirm karein.",
};

/** Offline fallback so chat works without the backend. Answers use the same demo data as the app. */
export function localReply(question, { lang = "en", meds = [] } = {}) {
  const q = question.toLowerCase();
  const hi = lang === "hi" || HINGLISH.test(question);
  const L = hi ? "hi" : "en";
  const out = (text, safe = true) => (safe ? `${text}\n\n${SAFE[L]}` : text);

  if (/(chest|seene|saans|breath|behosh|faint)/.test(q) && /(pain|dard|tight|dikkat|trouble|hard|breath)/.test(q)) {
    return hi
      ? "Seene mein tez dard ya saans lene mein dikkat ko halke mein na lein. Abhi emergency number 112 par call karein ya nazdeeki hospital jaayein."
      : "Chest pain or trouble breathing should not wait. Please call 112 or go to the nearest emergency room now.";
  }
  if (/(hemoglobin|haemoglobin|\bhb\b|khoon)/.test(q)) return out(find("hb")[L]);
  if (/(vitamin|vit d|\bd3\b)/.test(q)) return out(find("vitd")[L]);
  if (/(a1c|hba1c)/.test(q)) return out(find("a1c")[L]);
  if (/(sugar|glucose|diabet)/.test(q)) return out(`${find("glu")[L]}\n\n${find("a1c")[L]}`);
  if (/(cholesterol|lipid)/.test(q)) return out(find("chol")[L]);
  if (/(thyroid|tsh)/.test(q)) return out(find("tsh")[L]);
  if (/(kidney|creatinine)/.test(q)) return out(find("crea")[L]);

  if (/(medicine|dawai|dawa|tablet|goli|metformin|schedule|kab lena|when.*take)/.test(q)) {
    const today = dosesToday(meds);
    if (!today.length) return hi ? "Aaj ke liye koi dawai schedule nahi hai." : "No medicines are scheduled for today.";
    const lines = ["morning", "afternoon", "night"].map((s) => {
      const names = today.filter((d) => d.slot === s).map((d) => `${d.med.name} ${d.med.dose}`);
      return names.length ? `${s[0].toUpperCase() + s.slice(1)}: ${names.join(", ")}` : null;
    }).filter(Boolean);
    return out(`${hi ? "Aaj ka schedule:" : "Today's schedule:"}\n${lines.join("\n")}`, false) + `\n\n${hi ? "Dose badalne se pehle doctor se poochein." : "Please ask your doctor before changing any dose."}`;
  }

  if (/(dard|pain|headache|sar dard|chakkar|dizz|swelling|sujan|symptom|takleef)/.test(q)) {
    return hi
      ? "Symptoms ko 'Symptoms' page par body map se log karein — jagah aur intensity likh dein. Yeh doctor summary mein apne aap judd jaata hai. Agar dard tez ho ya achanak badhe, to jaldi doctor ko dikhayein."
      : "Log it on the Symptoms page: tap the body part and set the intensity. It goes into your doctor summary automatically. If the pain is severe or comes on suddenly, see a doctor soon.";
  }

  if (/(summary|appointment|doctor|visit|questions|sawal)/.test(q)) {
    return hi
      ? "Doctor Summary page par ek page ka summary taiyar hai — report ke zaroori points, dawaiyan, symptoms aur doctor se poochne ke sawal. Wahin se print ya share kar sakte hain."
      : "Your one-page summary is ready on the Doctor Summary page: key report points, medicines, symptoms and questions to ask. You can print or share it from there.";
  }

  if (/(reminder|yaad)/.test(q)) {
    return hi
      ? `Reminders page par dawai, appointment aur test ke reminders hain. Abhi subah ${toTimeLabel("08:00")} aur raat ${toTimeLabel("21:00")} ke reminders on hain.`
      : "The Reminders page has your medicine, appointment and test alerts.";
  }

  return hi
    ? "Main aapki reports, dawaiyon aur symptoms samajhne mein madad kar sakta hoon. Aap puch sakte hain: \"Mera hemoglobin kaisa hai?\" ya \"Aaj kaun si dawai leni hai?\""
    : "I can help you understand your reports, medicines and symptoms. Try: \"What does my hemoglobin mean?\" or \"What medicines do I take today?\"";
}
