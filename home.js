import { showToast } from "./ui.js";
import { getSettings } from "./settings.js";
import { getDailyAyah, getRandomAyah, formatAyahForCopy } from "./quranMotivation.js";
import { addWaterLog, addMealLog, addRestLog, getStreak, saveDailyAyahIfNeeded } from "./db.js";

function ayahCardHTML(a){
  return `
    <section class="card ayah-card">
      <div class="ayah-title">
        <div class="label">Daily Qur’an Motivation</div>
        <div class="ayah-ref">Surah ${a.ref}</div>
      </div>
      <div class="ayah-ar">${a.ar}</div>
      <div class="ayah-meaning">${a.meaning}</div>

      <div class="ayah-actions">
        <button class="btn" id="btnAyahNew" type="button">Another verse</button>
        <button class="btn ghost" id="btnAyahCopy" type="button">Copy</button>
        <button class="btn ghost" id="btnAyahHistory" type="button">View history</button>
      </div>
    </section>
  `;
}

async function copyAyah(a){
  try{
    await navigator.clipboard.writeText(formatAyahForCopy(a));
    showToast("Copied 🤍");
  }catch{
    showToast("Copy not supported");
  }
}

export async function renderHome(ctx){
  const s = getSettings();
  const uid = ctx.user?.uid;
  const name = (ctx.user?.displayName || "Lieya").trim() || "Lieya";
  const toneLabel = ["Calm","Soft","Warm"][Number(s.toneLevel ?? 1)] || "Soft";

  const daily = getDailyAyah(new Date());
  if(uid) await saveDailyAyahIfNeeded(uid, daily); // autosave daily verse

  const streak = uid ? await getStreak(uid) : { count:0 };
  const quranSection = s.dailyQuranCard ? ayahCardHTML(daily) : "";

  ctx.screen.innerHTML = `
    <section class="card" style="padding:16px">
      <div class="row between" style="align-items:flex-start">
        <div>
          <div class="tiny muted">${toneLabel} • Malaysia launch</div>
          <div style="font-weight:900;font-size:30px;letter-spacing:-.6px;margin-top:2px">
            Good day, ${name}.
          </div>
          <div class="tiny muted" style="margin-top:8px">
            Small care, repeated daily — that’s what becomes beautiful.
          </div>
        </div>

        <div class="panel" style="min-width:140px; text-align:center">
          <div class="tiny muted">Streak</div>
          <div style="font-weight:900;font-size:26px;margin-top:2px">${streak.count || 0}</div>
          <div class="tiny muted">days cared</div>
        </div>
      </div>

      <div style="margin-top:14px; display:grid; grid-template-columns:repeat(3,1fr); gap:10px">
        <button class="btn primary" id="btnLogWater" type="button">Water ✨</button>
        <button class="btn primary" id="btnLogMeal" type="button">Meal 🤍</button>
        <button class="btn primary" id="btnLogRest" type="button">Rest 🌙</button>
      </div>

      <div class="tiny muted" style="margin-top:12px">
        Private by design. Gentle by default.
      </div>
    </section>

    ${quranSection}

    <section class="card" style="padding:16px; margin-top:14px">
      <div style="font-weight:750">Soft focus</div>
      <div class="tiny muted" style="margin-top:6px">
        Today’s goal is simple: keep your heart calm and your body cared for.
      </div>
      <div class="row" style="margin-top:12px; flex-wrap:wrap">
        <a class="btn" href="#/care">Open Care</a>
        <a class="btn ghost" href="#/notes">Open Notes</a>
      </div>
    </section>
  `;

  // logs
  document.getElementById("btnLogWater")?.addEventListener("click", async () => {
    if(!uid) return;
    await addWaterLog(uid, { amount: "a few sips" });
    showToast("Logged water ✨");
    location.hash = "#/home";
  });

  document.getElementById("btnLogMeal")?.addEventListener("click", async () => {
    if(!uid) return;
    await addMealLog(uid, { text: "Simple meal", note: "" });
    showToast("Logged meal 🤍");
    location.hash = "#/home";
  });

  document.getElementById("btnLogRest")?.addEventListener("click", async () => {
    if(!uid) return;
    await addRestLog(uid, { note: "Short rest" });
    showToast("Logged rest 🌙");
    location.hash = "#/home";
  });

  // Quran buttons
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
    document.getElementById("btnAyahHistory")?.addEventListener("click", () => (location.hash = "#/quran"));
  }
}
