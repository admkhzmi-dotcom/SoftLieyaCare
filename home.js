// home.js
import { showToast, showConfirmPopup } from "./ui.js";
import { getSettings } from "./settings.js";
import { getDailyAyah, getRandomAyah, formatAyahForCopy, getTodayKey } from "./quranMotivation.js";
import {
  addWaterLog, addMealLog, addRestLog,
  getStreak, saveDailyAyahIfNeeded, saveAyahToHistory,
  getDayCounts, undoTodayCare,
  getPeriodState, listPeriods,
  saveNote
} from "./db.js";

function ayahCardHTML(a){
  return `
    <section class="card ayah-card">
      <div class="ayah-inner">
        <div class="ayah-title">
          <div class="label">Today’s verse</div>
          <div class="ayah-ref">Surah ${a.ref}</div>
        </div>
        <div class="ayah-ar">${a.ar}</div>
        <div class="ayah-meaning">${a.meaning}</div>
        <div class="ayah-actions">
          <button class="btn" id="btnAyahNew" type="button">Another verse</button>
          <button class="btn ghost" id="btnAyahCopy" type="button">Copy</button>
          <button class="btn ghost" id="btnAyahSave" type="button">Save</button>
          <button class="btn ghost" id="btnAyahHistory" type="button">History</button>
        </div>
      </div>
    </section>
  `;
}

async function copyAyah(a){
  try{
    await navigator.clipboard.writeText(formatAyahForCopy(a));
    showToast("Copied");
  }catch{
    showToast("Copy not supported");
  }
}

function parseDayKey(key){
  return new Date(`${key}T00:00:00`);
}
function diffDays(aKey, bKey){
  const a = parseDayKey(aKey);
  const b = parseDayKey(bKey);
  return Math.round((b - a) / (1000*60*60*24));
}
function addDays(dayKey, days){
  const d = parseDayKey(dayKey);
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,"0");
  const dd = String(d.getDate()).padStart(2,"0");
  return `${y}-${m}-${dd}`;
}
function average(nums){
  const arr = nums.filter(n => Number.isFinite(n));
  if(!arr.length) return null;
  return arr.reduce((a,b)=>a+b,0) / arr.length;
}

export async function renderHome(ctx){
  const s = getSettings();
  const uid = ctx.user?.uid;
  const name = (ctx.user?.displayName || "Lieya").trim() || "Lieya";
  const toneLabel = ["Calm","Soft","Warm"][Number(s.toneLevel ?? 1)] || "Soft";

  // Deterministic daily verse (same even after refresh)
  const daily = getDailyAyah(new Date());
  if(uid) await saveDailyAyahIfNeeded(uid, daily);

  const streak = uid ? await getStreak(uid) : { count:0 };

  // Today counts for button badges
  const counts = uid ? await getDayCounts(uid, getTodayKey(new Date())) : { waterCount:0, mealCount:0, restCount:0 };

  // Period snapshot
  let periodLine = "Period: —";
  let nextLine = "";
  try{
    if(uid){
      const state = await getPeriodState(uid);
      const periods = await listPeriods(uid, 12);
      const openEpisode = periods.find(p => p?.endDayKey == null) || null;
      const active = !!state?.active || !!openEpisode;
      const startKey = state?.periodStartDayKey || openEpisode?.startDayKey || null;

      // next expected based on avg starts, fallback 28
      const starts = periods.map(p => p?.startDayKey).filter(Boolean);
      const cycleLens = [];
      for(let i=0; i<starts.length-1; i++){
        cycleLens.push(diffDays(starts[i+1], starts[i]));
      }
      const avgCycleLen = Math.round(average(cycleLens) || 28);
      const lastStart = starts[0] || startKey;

      if(active && startKey){
        const day = diffDays(startKey, getTodayKey(new Date())) + 1;
        periodLine = `Period: Day ${day} (tracking)`;
        nextLine = lastStart ? `Next expected: ~ ${addDays(lastStart, avgCycleLen)}` : "";
      }else{
        periodLine = "Period: Not active";
        nextLine = lastStart ? `Next expected: ~ ${addDays(lastStart, avgCycleLen)}` : "Next expected: —";
      }
    }
  }catch{
    // keep quiet
  }

  const quranSection = s.dailyQuranCard ? ayahCardHTML(daily) : "";

  ctx.screen.innerHTML = `
    <section class="card" style="padding:16px">
      <div class="row between" style="align-items:flex-start; gap:12px; flex-wrap:wrap">
        <div>
          <div class="tiny muted">${toneLabel} mode • Today</div>
          <div style="font-weight:900;font-size:30px;letter-spacing:-.6px;margin-top:2px">
            Good day, ${name}.
          </div>
          <div class="tiny muted" style="margin-top:8px">
            One gentle step at a time.
          </div>
        </div>

        <div class="panel" style="min-width:140px; text-align:center">
          <div class="tiny muted">Streak</div>
          <div style="font-weight:900;font-size:26px;margin-top:2px">${streak.count || 0}</div>
          <div class="tiny muted">days</div>
        </div>
      </div>

      <div style="margin-top:14px; display:grid; grid-template-columns:repeat(3,1fr); gap:10px">
        <button class="btn primary" id="btnLogWater" type="button">
          Water <span class="badge" id="bWater">${counts.waterCount || 0}</span>
        </button>
        <button class="btn primary" id="btnLogMeal" type="button">
          Meal <span class="badge" id="bMeal">${counts.mealCount || 0}</span>
        </button>
        <button class="btn primary" id="btnLogRest" type="button">
          Rest <span class="badge" id="bRest">${counts.restCount || 0}</span>
        </button>
      </div>

      <div id="undoBar" class="undo-bar" hidden>
        <div class="tiny" id="undoText">Logged.</div>
        <button class="btn ghost btn-sm" id="btnUndo" type="button">Undo</button>
      </div>

      <div class="tiny muted" style="margin-top:12px">
        Private. Gentle. Yours.
      </div>
    </section>

    ${quranSection}

    <section class="card" style="padding:16px; margin-top:14px">
      <div style="font-weight:850">Soft focus</div>
      <div class="tiny muted" style="margin-top:6px">
        Keep your heart calm and your body cared for.
      </div>

      <div class="panel" style="margin-top:12px">
        <div class="row between" style="align-items:flex-end; gap:10px; flex-wrap:wrap">
          <div>
            <div style="font-weight:850">Quick note</div>
            <div class="tiny muted">A small sentence is enough.</div>
          </div>
          <a class="btn ghost btn-sm" href="#/notes">Open Notes</a>
        </div>
        <div class="row" style="margin-top:10px; gap:10px; flex-wrap:wrap">
          <input id="homeNoteText" class="home-note-input" type="text" placeholder="One gentle thought…" />
          <button class="btn primary" id="btnHomeSaveNote" type="button">Save</button>
        </div>
      </div>

      <div class="panel" style="margin-top:12px">
        <div class="row between" style="align-items:flex-end; gap:10px; flex-wrap:wrap">
          <div>
            <div style="font-weight:850">Period snapshot</div>
            <div class="tiny muted" style="margin-top:6px">${periodLine}${nextLine ? ` • ${nextLine}` : ""}</div>
          </div>
          <a class="btn" href="#/care">Open Period tracker</a>
        </div>
      </div>
    </section>
  `;

  // ===========================
  // Quick logs + Undo
  // ===========================
  let undoTimer = null;
  let lastAction = null; // { type: "water"|"meal"|"rest" }

  function setBadge(type, value){
    const id =
      type === "water" ? "bWater" :
      type === "meal"  ? "bMeal"  : "bRest";
    const el = document.getElementById(id);
    if(el) el.textContent = String(value);
  }

  function showUndo(type){
    const bar = document.getElementById("undoBar");
    const text = document.getElementById("undoText");
    const btn = document.getElementById("btnUndo");
    if(!bar || !text || !btn) return;

    lastAction = { type };
    text.textContent =
      type === "water" ? "Logged Water." :
      type === "meal"  ? "Logged Meal."  : "Logged Rest.";

    bar.hidden = false;

    if(undoTimer) clearTimeout(undoTimer);
    undoTimer = setTimeout(() => {
      bar.hidden = true;
      lastAction = null;
    }, 5500);

    btn.onclick = async () => {
      if(!uid || !lastAction) return;
      try{
        await undoTodayCare(uid, lastAction.type);
        const fresh = await getDayCounts(uid, getTodayKey(new Date()));
        setBadge("water", fresh.waterCount);
        setBadge("meal", fresh.mealCount);
        setBadge("rest", fresh.restCount);
        showToast("Undone");
      }catch{
        showToast("Undo failed");
      }finally{
        bar.hidden = true;
        lastAction = null;
      }
    };
  }

  async function needAuth(){
    if(uid) return true;
    showToast("Please sign in first");
    return false;
  }

  document.getElementById("btnLogWater")?.addEventListener("click", async () => {
    if(!await needAuth()) return;
    await addWaterLog(uid, { amount: "a few sips" });
    const fresh = await getDayCounts(uid, getTodayKey(new Date()));
    setBadge("water", fresh.waterCount);
    showUndo("water");
    showToast("Logged water");
  });

  document.getElementById("btnLogMeal")?.addEventListener("click", async () => {
    if(!await needAuth()) return;
    await addMealLog(uid, { text: "Simple meal", note: "" });
    const fresh = await getDayCounts(uid, getTodayKey(new Date()));
    setBadge("meal", fresh.mealCount);
    showUndo("meal");
    showToast("Logged meal");
  });

  document.getElementById("btnLogRest")?.addEventListener("click", async () => {
    if(!await needAuth()) return;
    await addRestLog(uid, { note: "Short rest" });
    const fresh = await getDayCounts(uid, getTodayKey(new Date()));
    setBadge("rest", fresh.restCount);
    showUndo("rest");
    showToast("Logged rest");
  });

  // ===========================
  // Qur’an actions (Home)
  // ===========================
  if(s.dailyQuranCard){
    let current = daily;

    function paint(a){
      current = a;
      const ref = ctx.screen.querySelector(".ayah-ref");
      const ar = ctx.screen.querySelector(".ayah-ar");
      const meaning = ctx.screen.querySelector(".ayah-meaning");
      if(ref) ref.textContent = `Surah ${a.ref}`;
      if(ar) ar.textContent = a.ar;
      if(meaning) meaning.textContent = a.meaning;
    }

    document.getElementById("btnAyahNew")?.addEventListener("click", () => paint(getRandomAyah()));
    document.getElementById("btnAyahCopy")?.addEventListener("click", () => copyAyah(current));

    document.getElementById("btnAyahSave")?.addEventListener("click", async () => {
      if(!uid) return showToast("Please sign in first");
      await saveAyahToHistory(uid, current);
      showToast("Saved");
    });

    document.getElementById("btnAyahHistory")?.addEventListener("click", () => (location.hash = "#/quran"));
  }

  // ===========================
  // Quick note on Home
  // ===========================
  document.getElementById("btnHomeSaveNote")?.addEventListener("click", async () => {
    if(!uid) return showToast("Please sign in first");
    const input = document.getElementById("homeNoteText");
    const text = (input?.value || "").trim();
    if(!text) return showToast("Write something first");

    await saveNote(uid, { text });
    if(input) input.value = "";
    showToast("Saved to Notes");
  });
}
