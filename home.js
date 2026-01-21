// home.js
import { showToast } from "./ui.js";
import { getSettings } from "./settings.js";
import { getDailyAyah, getRandomAyah, formatAyahForCopy } from "./quranMotivation.js";
import { addWaterLog, addMealLog, addRestLog, getStreak, saveDailyAyahIfNeeded } from "./db.js";

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
          <button class="btn ghost" id="btnAyahHistory" type="button">History</button>
        </div>
      </div>
    </section>
  `;
}

function ayahSkeletonHTML(){
  return `
    <section class="card ayah-card">
      <div class="ayah-inner">
        <div class="ayah-title">
          <div class="label">Today’s verse</div>
          <div class="ayah-ref">Loading…</div>
        </div>

        <div class="skeleton" style="height:46px; margin-top:8px"></div>
        <div class="skeleton" style="height:18px; margin-top:10px; width:86%"></div>
        <div class="skeleton" style="height:18px; margin-top:8px; width:72%"></div>

        <div class="ayah-actions" style="margin-top:14px">
          <button class="btn" disabled type="button">Another verse</button>
          <button class="btn ghost" disabled type="button">Copy</button>
          <button class="btn ghost" disabled type="button">History</button>
        </div>
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

  const streak = uid ? await getStreak(uid) : { count:0 };

  // Render base UI first (fast), then hydrate the verse (prevents "stuck" feeling)
  ctx.screen.innerHTML = `
    <section class="card" style="padding:16px">
      <div class="row between" style="align-items:flex-start">
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
        <button class="btn primary" id="btnLogWater" type="button">Water ✨</button>
        <button class="btn primary" id="btnLogMeal" type="button">Meal 🤍</button>
        <button class="btn primary" id="btnLogRest" type="button">Rest 🌙</button>
      </div>

      <div class="tiny muted" style="margin-top:12px">
        Private. Gentle. Yours.
      </div>
    </section>

    ${s.dailyQuranCard ? ayahSkeletonHTML() : ""}

    <section class="card" style="padding:16px; margin-top:14px">
      <div style="font-weight:850">Soft focus</div>
      <div class="tiny muted" style="margin-top:6px">
        Keep your heart calm and your body cared for.
      </div>
      <div class="row" style="margin-top:12px; flex-wrap:wrap">
        <a class="btn" href="#/care">Open Care</a>
        <a class="btn ghost" href="#/notes">Open Notes</a>
      </div>
    </section>
  `;

  // Bind log buttons
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

  // Hydrate Quran section (async)
  if(s.dailyQuranCard){
    let daily = null;

    try{
      daily = await getDailyAyah(new Date()); // ✅ now awaited
      if(uid) await saveDailyAyahIfNeeded(uid, daily);

      // Replace skeleton with real card
      const card = ctx.screen.querySelector(".ayah-card");
      if(card) card.outerHTML = ayahCardHTML(daily);
    }catch{
      // fallback to local random if totally broken
      daily = getRandomAyah();
      const card = ctx.screen.querySelector(".ayah-card");
      if(card) card.outerHTML = ayahCardHTML(daily);
    }

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

    // Another verse: prefer API refresh; fallback to local list
    document.getElementById("btnAyahNew")?.addEventListener("click", async () => {
      try{
        const a = await getDailyAyah(new Date());
        paint(a);
        if(uid) await saveDailyAyahIfNeeded(uid, a);
      }catch{
        paint(getRandomAyah());
      }
    });

    document.getElementById("btnAyahCopy")?.addEventListener("click", () => copyAyah(current));
    document.getElementById("btnAyahHistory")?.addEventListener("click", () => (location.hash = "#/quran"));
  }
}
