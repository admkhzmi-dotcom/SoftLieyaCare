import { showPopup } from "./ui.js";

function todayKey(){
  const d=new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
function minutesSince(ts){ return Math.floor((Date.now()-ts)/60000); }

function parseHHMM(s){
  const [hh,mm]=(s||"00:00").split(":").map(Number);
  return {hh:hh||0, mm:mm||0};
}

function inQuietHours(prefs){
  const q=prefs?.quietHours;
  if(!q?.start || !q?.end) return false;

  const now=new Date();
  const {hh:sh,mm:sm}=parseHHMM(q.start);
  const {hh:eh,mm:em}=parseHHMM(q.end);

  const start=new Date(now); start.setHours(sh,sm,0,0);
  const end=new Date(now); end.setHours(eh,em,0,0);

  if(start > end) return (now >= start) || (now <= end);
  return (now >= start) && (now <= end);
}

function categoryByTime(){
  const h=new Date().getHours();
  if(h>=6 && h<11) return Math.random()<0.55 ? "water":"meal";
  if(h>=11 && h<16) return Math.random()<0.60 ? "meal":"water";
  if(h>=16 && h<21) return Math.random()<0.60 ? "meal":"eyes";
  return Math.random()<0.60 ? "sleep":"comfort";
}

export function startScheduler(ctx){
  const key="slc_sched_state";
  const intervalMs=60_000;

  function load(){
    const raw=localStorage.getItem(key);
    const def={day:todayKey(),count:0,last:0,snoozeUntil:0};
    if(!raw) return def;
    try{
      const s=JSON.parse(raw);
      if(s.day!==todayKey()) return def;
      return {...def,...s};
    }catch{ return def; }
  }
  function save(s){ localStorage.setItem(key, JSON.stringify(s)); }

  function tick(){
    if(!ctx?.prefs || !ctx?.tone) return;
    if(!ctx.prefs.remindersEnabled) return;
    if(inQuietHours(ctx.prefs)) return;

    const s=load();
    const limit=Number(ctx.prefs.dailyPopupLimit ?? 8);
    const cooldown=Number(ctx.prefs.popupCooldownMinutes ?? 45);

    if(s.snoozeUntil && Date.now() < s.snoozeUntil) return;
    if(s.count >= limit) return;
    if(s.last && minutesSince(s.last) < cooldown) return;

    if(Math.random() > 0.18) return;

    const cat=categoryByTime();
    const line=ctx.tone.gentleLine(cat);
    showPopup({title:"A gentle check-in", text: line});

    s.count += 1;
    s.last = Date.now();
    save(s);
  }

  const timer=setInterval(tick, intervalMs);
  setTimeout(tick, 10_000);
  return ()=> clearInterval(timer);
}

export function snoozeScheduler(minutes=25){
  const key="slc_sched_state";
  const raw=localStorage.getItem(key);
  const s=raw ? JSON.parse(raw) : {day:todayKey(),count:0,last:0,snoozeUntil:0};
  s.snoozeUntil = Date.now() + minutes*60_000;
  localStorage.setItem(key, JSON.stringify(s));
}
