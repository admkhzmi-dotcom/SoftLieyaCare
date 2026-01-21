// quranMotivation.js
import { fetchGentleAyah } from "./quranApi.js";

const FALLBACK_AYAT = [
  { ref: "94:5–6", ar: "فَإِنَّ مَعَ ٱلْعُسْرِ يُسْرًا • إِنَّ مَعَ ٱلْعُسْرِ يُسْرًا", meaning: "With hardship comes ease — and ease will come again. Keep going gently." },
  { ref: "2:286", ar: "لَا يُكَلِّفُ ٱللَّهُ نَفْسًا إِلَّا وُسْعَهَا", meaning: "Allah does not burden a soul beyond what it can bear." },
  { ref: "39:53", ar: "لَا تَقْنَطُوا۟ مِن رَّحْمَةِ ٱللَّهِ", meaning: "Do not lose hope in Allah’s mercy." },
  { ref: "13:28", ar: "أَلَا بِذِكْرِ ٱللَّهِ تَطْمَئِنُّ ٱلْقُلُوبُ", meaning: "In the remembrance of Allah, hearts find peace." },
  { ref: "65:3", ar: "وَمَن يَتَوَكَّلْ عَلَى ٱللَّهِ فَهُوَ حَسْبُهُ", meaning: "Whoever trusts Allah — He is enough." }
];

const LS_DAILY_KEY = "slc_daily_ayah_key_v1";
const LS_DAILY_VAL = "slc_daily_ayah_val_v1";

export function getTodayKey(d = new Date()){
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function fallbackDaily(d = new Date()){
  const key = getTodayKey(d);
  let hash = 0;
  for (let i = 0; i < key.length; i++){
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  return FALLBACK_AYAT[hash % FALLBACK_AYAT.length];
}

export function getRandomAyah(){
  return FALLBACK_AYAT[Math.floor(Math.random() * FALLBACK_AYAT.length)];
}

/**
 * ✅ Daily verse that does NOT change on refresh.
 * - Stores the chosen verse for the day in localStorage.
 * - Uses API once per day if possible.
 */
export async function getDailyAyah(d = new Date()){
  const keyToday = getTodayKey(d);

  // If already stored for today, return it
  const storedKey = localStorage.getItem(LS_DAILY_KEY);
  const storedVal = localStorage.getItem(LS_DAILY_VAL);

  if (storedKey === keyToday && storedVal){
    try{
      const parsed = JSON.parse(storedVal);
      if (parsed?.ref && parsed?.ar && parsed?.meaning) return parsed;
    }catch{ /* ignore */ }
  }

  // Otherwise fetch a fresh daily verse (API first), then store it
  let ayah = null;
  try{
    ayah = await fetchGentleAyah(); // { ref, ar, meaning }
  }catch{
    ayah = fallbackDaily(d);
  }

  localStorage.setItem(LS_DAILY_KEY, keyToday);
  localStorage.setItem(LS_DAILY_VAL, JSON.stringify(ayah));

  return ayah;
}

export function formatAyahForCopy(a){
  const ref = a?.ref || "";
  const ar = a?.ar || "";
  const meaning = a?.meaning || "";
  return `SoftLieya Care — Today’s verse\nSurah ${ref}\n\n${ar}\n\nMeaning: ${meaning}`;
}
