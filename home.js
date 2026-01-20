import { showToast } from "./ui.js";
import { getSettings } from "./settings.js";
import { getDailyAyah, getRandomAyah, formatAyahForCopy } from "./quranMotivation.js";
import { addWaterLog, addMealLog, addRestLog } from "./db.js";

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

export function renderHome(ctx){
  const s = getSettings();
  const user = ctx.user;
  const name = (user?.displayName || "Lieya").trim() || "Lieya";

  const daily = getDailyAyah(new Date());
  const quranSection = s.dailyQuranCard ? ayahCardHTML(daily) : "";

  const toneLabel = ["Calm","Soft","Warm"][Number(s.toneLevel ?? 1)] || "Soft";

  ctx.screen.innerHTML = `
    <section class="card" style="padding:16px">
      <div class="row between">
        <div>
          <div class="tiny muted">${toneLabel}</div>
          <div style="font-weight:800;font-size:28px;letter-spacing:-.4px">Today</div>
          <div class="tiny muted">Water • Meals • Rest</div>
        </div>
        <div class="tiny muted">For ${name}</div>
      </div>

      <div style="margin-top:10px; font-size:14px; color:var(--muted)">
        Private by design. Gentle by default.
      </div>

      <div class="row" style="margin-top:12px; flex-wrap:wrap">
        <button class="btn" id="btnLogWater" type="button">Log water</button>
        <button class="btn" id="btnLogMeal" type="button">Log meal</button>
        <button class="btn" id="btnLogRest" type="button">Log rest</button>
      </div>
    </section>

    ${quranSection}

    <section class="card" style="padding:16px; margin-top:14px">
      <div style="font-weight:700">A gentle note</div>
      <div class="tiny muted" style="margin-top:6px">
        One step at a time, ${name}. You’re doing enough.
      </div>
    </section>
  `;

  // quick logs
  document.getElementById("btnLogWater")?.addEventListener("click", async () => {
    if(!ctx.user?.uid) return;
    await addWaterLog(ctx.user.uid, { amount: "a few sips" });
    showToast("Logged water ✨");
  });

  document.getElementById("btnLogMeal")?.addEventListener("click", async () => {
    if(!ctx.user?.uid) return;
    await addMealLog(ctx.user.uid, { text: "Simple meal", note: "" });
    showToast("Logged meal 🤍");
  });

  document.getElementById("btnLogRest")?.addEventListener("click", async () => {
    if(!ctx.user?.uid) return;
    await addRestLog(ctx.user.uid, { note: "Short rest" });
    showToast("Logged rest 🌙");
  });

  // Quran buttons
  if(s.dailyQuranCard){
    let current = daily;

    const btnNew = document.getElementById("btnAyahNew");
    const btnCopy = document.getElementById("btnAyahCopy");

    function paint(a){
      current = a;
      const ref = document.querySelector(".ayah-ref");
      const ar = document.querySelector(".ayah-ar");
      const meaning = document.querySelector(".ayah-meaning");
      if(ref) ref.textContent = `Surah ${a.ref}`;
      if(ar) ar.textContent = a.ar;
      if(meaning) meaning.textContent = a.meaning;
    }

    btnNew?.addEventListener("click", () => paint(getRandomAyah()));
    btnCopy?.addEventListener("click", () => copyAyah(current));
  }
}
