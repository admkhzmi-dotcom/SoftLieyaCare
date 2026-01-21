import { fetchGentleAyah } from "./quranApi.js";

const FALLBACK_AYAT = [
  { ref: "94:5–6", ar: "فَإِنَّ مَعَ ٱلْعُسْرِ يُسْرًا • إِنَّ مَعَ ٱلْعُسْرِ يُسْرًا", meaning: "With hardship comes ease — and ease will come again. Keep going gently." },
  { ref: "2:286", ar: "لَا يُكَلِّفُ ٱللَّهُ نَفْسًا إِلَّا وُسْعَهَا", meaning: "Allah does not burden a soul beyond what it can bear." },
  { ref: "39:53", ar: "لَا تَقْنَطُوا۟ مِن رَّحْمَةِ ٱللَّهِ", meaning: "Do not lose hope in Allah’s mercy." },
  { ref: "13:28", ar: "أَلَا بِذِكْرِ ٱللَّهِ تَطْمَئِنُّ ٱلْقُلُوبُ", meaning: "In the remembrance of Allah, hearts find peace." },
  { ref: "65:3", ar: "وَمَن يَتَوَكَّلْ عَلَى ٱللَّهِ فَهُوَ حَسْبُهُ", meaning: "Whoever trusts Allah — He is enough." }
];

export function getTodayKey(d=new Date()){
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,"0");
  const day = String(d.getDate()).padStart(2,"0");
  return `${y}-${m}-${day}`;
}

function fallbackDaily(d=new Date()){
  const key = getTodayKey(d);
  let hash = 0;
  for (let i=0;i<key.length;i++) hash = (hash*31 + key.charCodeAt(i)) >>> 0;
  return FALLBACK_AYAT[hash % FALLBACK_AYAT.length];
}

export async function getDailyAyah(d=new Date()){
  // Try API first (non-repeating)
  try{
    return await fetchGentleAyah();
  }catch{
    // Offline / blocked → deterministic fallback
    return fallbackDaily(d);
  }
}

export function formatAyahForCopy(a){
  return `SoftLieya Care — Daily verse\nSurah ${a.ref}\n\n${a.ar}\n\nMeaning: ${a.meaning}`;
}
