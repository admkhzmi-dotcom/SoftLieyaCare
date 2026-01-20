// Arabic excerpt + reference + English meaning (paraphrase).
const AYAT = [
  { ref:"94:5–6", ar:"فَإِنَّ مَعَ الْعُسْرِ يُسْرًا • إِنَّ مَعَ الْعُسْرِ يُسْرًا",
    meaning:"With hardship comes ease — and ease will come again. Keep going gently." },
  { ref:"2:286", ar:"لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا",
    meaning:"You are not asked to carry more than you can bear. Do what you can — that is enough." },
  { ref:"39:53", ar:"لَا تَقْنَطُوا مِن رَّحْمَةِ اللَّهِ",
    meaning:"Don’t lose hope in Allah’s mercy. There is always a way back to peace." },
  { ref:"65:3", ar:"وَمَن يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ",
    meaning:"When you rely on Allah, He is enough for you. Breathe — you’re not alone." },
  { ref:"3:139", ar:"وَلَا تَهِنُوا وَلَا تَحْزَنُوا",
    meaning:"Don’t collapse into weakness or sadness. Your heart can rise again." },
  { ref:"2:153", ar:"إِنَّ اللَّهَ مَعَ الصَّابِرِينَ",
    meaning:"Allah is with those who are patient. Even slow patience is still patience." },
  { ref:"13:11", ar:"إِنَّ اللَّهَ لَا يُغَيِّرُ مَا بِقَوْمٍ حَتَّىٰ يُغَيِّرُوا مَا بِأَنفُسِهِمْ",
    meaning:"Change begins from within. One small step today can open a new path." },
  { ref:"20:46", ar:"إِنَّنِي مَعَكُمَا أَسْمَعُ وَأَرَىٰ",
    meaning:"Allah hears and sees. You are not unseen — you are held in care." }
];

function todayKey(d=new Date()){
  const y=d.getFullYear();
  const m=String(d.getMonth()+1).padStart(2,"0");
  const da=String(d.getDate()).padStart(2,"0");
  return `${y}-${m}-${da}`;
}
function seedFromKey(key){
  let h=2166136261;
  for(let i=0;i<key.length;i++){
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h>>>0;
}
function seededIndex(seed, len){
  const x = (seed*1664525 + 1013904223)>>>0;
  return x % len;
}

export function getDailyAyah(date=new Date()){
  const key=todayKey(date);
  const seed=seedFromKey(key);
  return AYAT[seededIndex(seed, AYAT.length)];
}
export function getRandomAyah(){
  return AYAT[Math.floor(Math.random()*AYAT.length)];
}
export function formatAyahForCopy(a){
  return `Surah ${a.ref}\n${a.ar}\n\nMeaning (paraphrase): ${a.meaning}`;
}
export function getTodayKey(date=new Date()){
  return todayKey(date);
}

