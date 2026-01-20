import { showPopup } from "./ui.js";
import { getSettings } from "./settings.js";
import { getDailyAyah, getTodayKey } from "./quranMotivation.js";
import { saveDailyAyahIfNeeded } from "./db.js";

let timer = null;

function nowMinutes(d=new Date()){
  return d.getHours()*60 + d.getMinutes();
}

export function startScheduler(getUser){
  stopScheduler();

  timer = setInterval(async () => {
    const s = getSettings();
    if(!s.dailyQuran9amReminder) return;

    const user = getUser?.();
    const uid = user?.uid || null;
    if(!uid) return;

    const keyToday = getTodayKey(new Date());
    const lastKey = `slc_quran_9am_last_${uid}`;
    const last = localStorage.getItem(lastKey);

    if(nowMinutes() >= 540 && last !== keyToday){
      const a = getDailyAyah(new Date());
      await saveDailyAyahIfNeeded(uid, a);

      showPopup({
        title: "A gentle morning reminder",
        text: `Surah ${a.ref}\n\n${a.ar}\n\nMeaning (paraphrase): ${a.meaning}`
      });

      localStorage.setItem(lastKey, keyToday);
    }
  }, 30_000);
}

export function stopScheduler(){
  if(timer) clearInterval(timer);
  timer = null;
}
