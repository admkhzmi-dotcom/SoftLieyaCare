import { showPopup } from "./ui.js";
import { getSettings } from "./settings.js";
import { getDailyAyah, getTodayKey } from "./quranMotivation.js";

let timer = null;

function lastKey(uid){ return `slc_quran_9am_last_${uid || "local"}`; }
function nowMinutes(d=new Date()){ return d.getHours()*60 + d.getMinutes(); }

export function startScheduler(getUser){
  stopScheduler();

  timer = setInterval(() => {
    const s = getSettings();
    if(!s.dailyQuran9amReminder) return;

    const user = getUser?.();
    const uid = user?.uid || "local";

    const keyToday = getTodayKey(new Date());
    const last = localStorage.getItem(lastKey(uid));

    if(nowMinutes() >= 540 && last !== keyToday){
      const a = getDailyAyah(new Date());
      showPopup({
        title: "A gentle morning reminder",
        text: `Surah ${a.ref}\n\n${a.ar}\n\nMeaning (paraphrase): ${a.meaning}`
      });
      localStorage.setItem(lastKey(uid), keyToday);
    }
  }, 30_000);
}

export function stopScheduler(){
  if(timer) clearInterval(timer);
  timer = null;
}
