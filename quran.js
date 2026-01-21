// quran.js
import { showToast } from "./ui.js";
import { listAyahHistory, saveDailyAyahIfNeeded } from "./db.js";
import { getDailyAyah, formatAyahForCopy } from "./quranMotivation.js";

async function copyText(txt){
  try{
    await navigator.clipboard.writeText(txt);
    showToast("Copied 🤍");
  }catch{
    showToast("Copy not supported");
  }
}

export async function renderQuran(ctx){
  const uid = ctx.user?.uid;

  // ✅ Daily verse (stable per day, no refresh change)
  const today = await getDailyAyah(new Date());

  // ✅ ensure saved into history (if user logged in)
  if(uid) await saveDailyAyahIfNeeded(uid, today);

  const items = uid ? await listAyahHistory(uid) : [];

  ctx.screen.innerHTML = `
    <section class="card" style="padding:16px">
      <div style="font-weight:900;font-size:24px">Qur’an</div>
      <div class="tiny muted" style="margin-top:6px">Today + your recent verses.</div>

      <div class="panel" style="margin-top:14px">
        <div class="row between" style="align-items:flex-start">
          <div style="font-weight:900;font-size:20px">Today</div>
          <div class="tiny muted">Surah ${today?.ref || ""}</div>
        </div>

        <div class="quran-ar">${today?.ar || ""}</div>
        <div style="margin-top:8px; line-height:1.6">${today?.meaning || ""}</div>

        <div class="row" style="margin-top:12px; flex-wrap:wrap">
          <button class="btn" id="btnTodayCopy" type="button">Copy</button>
          <button class="btn ghost" id="btnTodaySave" type="button">Save</button>
        </div>
      </div>

      <div style="margin-top:18px">
        <div style="font-weight:900;font-size:20px">History</div>
        <div class="tiny muted" style="margin-top:6px">Stored under your account only.</div>

        <div style="margin-top:12px">
          ${items.map(a => `
            <div class="panel" style="margin-bottom:12px">
              <div class="tiny muted">Surah ${a.ref || ""}</div>
              <div class="quran-ar">${a.ar || ""}</div>
              <div style="margin-top:8px; line-height:1.6">${a.meaning || ""}</div>
            </div>
          `).join("") || `<div class="tiny muted" style="margin-top:10px">No history yet.</div>`}
        </div>
      </div>
    </section>
  `;

  document.getElementById("btnTodayCopy")?.addEventListener("click", () => {
    copyText(formatAyahForCopy(today));
  });

  document.getElementById("btnTodaySave")?.addEventListener("click", async () => {
    if(!uid){
      showToast("Please sign in to save");
      return;
    }
    await saveDailyAyahIfNeeded(uid, today);
    showToast("Saved ✨");
    location.hash = "#/quran";
  });
}
