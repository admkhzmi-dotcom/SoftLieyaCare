// quranApi.js
// Fetch Arabic + English from a public Quran API.
// Uses a curated list of gentle/comforting ayat references (non-repeating).

const TOPIC_REFS = [
  "94:5", "94:6",
  "2:286",
  "39:53",
  "13:28",
  "65:3",
  "3:139",
  "2:153",
  "8:46",
  "29:69",
  "12:87",
  "16:97",
  "3:159",
  "20:46",
  "2:152",
  "14:7",
  "5:13"
];

// Basic non-repeat memory (localStorage)
const LS_USED = "slc_used_refs_v1";
function loadUsed(){
  try { return new Set(JSON.parse(localStorage.getItem(LS_USED) || "[]")); }
  catch { return new Set(); }
}
function saveUsed(set){
  localStorage.setItem(LS_USED, JSON.stringify(Array.from(set)));
}

function pickNonRepeating(){
  const used = loadUsed();
  const available = TOPIC_REFS.filter(r => !used.has(r));

  // If all used, reset
  const pickFrom = available.length ? available : TOPIC_REFS;

  const ref = pickFrom[Math.floor(Math.random() * pickFrom.length)];

  // store used
  used.add(ref);
  // keep storage small
  if (used.size > 200) {
    // reset if too large
    saveUsed(new Set([ref]));
  } else {
    saveUsed(used);
  }

  return ref;
}

/**
 * Fetch ayah by reference "surah:ayah"
 * Arabic: quran-uthmani
 * English: Saheeh International
 */
export async function fetchAyahByRef(ref){
  const url = `https://api.alquran.cloud/v1/ayah/${encodeURIComponent(ref)}/editions/quran-uthmani,en.sahih`;
  const res = await fetch(url, { cache: "no-store" });
  if(!res.ok) throw new Error("Quran API failed");

  const json = await res.json();
  const editions = json?.data;
  const ar = editions?.find(e => e.edition?.language === "ar")?.text;
  const en = editions?.find(e => e.edition?.language === "en")?.text;

  if(!ar || !en) throw new Error("Missing ayah text");

  return {
    ref,
    ar,
    meaning: en, // translation (you can label it "Meaning" in UI)
  };
}

export async function fetchGentleAyah(){
  const ref = pickNonRepeating();
  return await fetchAyahByRef(ref);
}
