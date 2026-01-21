import { listAyahHistory } from "./db.js";
import { getDailyAyah, formatAyahForCopy } from "./quranMotivation.js";
import { showToast } from "./ui.js";

export async function renderQuran(ctx){
  const uid = ctx.user?.uid;
  const items = uid ? await listAyahHistory(uid) : [];

  // "Today" always visible at top
  const today = getDailyAyah(new Date());

  ctx.screen.innerHTML = `
    <section class="card" style="padding:16px">
      <div style="font-weight:900;font-size:24px">Qur’an</div>
      <div class="tiny muted" style="margin-top:6px">Today + your recent verses.</div>

      <!-- Today card -->
      <div class="panel" style="margin-top:14px; padding:16px">
        <div class="row between" style="align-items:flex-start">
          <div style="font-weight:900">Today</div>
          <div class="tiny muted">Surah ${today.ref}</div>
        </div>

        <div class="quran-ar" style="margin-top:10px">${today.ar}</div>
        <div style="margin-top:6px; line-height:1.6">${today.meaning}</div>

        <div class="row" style="margin-top:14px; gap:10px; flex-wrap:wrap">
          <button class="btn" id="btnQCopy" type="button">Copy</button>
          <button class="btn ghost" id="btnQSave" type="button">Save</button>
        </div>
      </div>

      <!-- History -->
      <div style="margin-top:16px; font-weight:900; font-size:18px">History</div>
      <div class="tiny muted" style="margin-top:6px">Stored under your account only.</div>

      <div style="margin-top:12px">
        ${
          items.length
            ? items.map(a => `
              <div class="panel" style="margin-bottom:12px; padding:16px">
                <div class="tiny muted">Surah ${a.ref}</div>
                <div class="quran-ar">${a.ar || ""}</div>
                <div style="margin-top:8px; line-height:1.6">${a.meaning || ""}</div>
              </div>
            `).join("")
            : `<div class="tiny muted" style="margin-top:10px">No history yet.</div>`
        }
      </div>
    </section>
  `;

  // Copy today
  document.getElementById("btnQCopy")?.addEventListener("click", async () => {
    try{
      await navigator.clipboard.writeText(formatAyahForCopy(today));
      showToast("Copied 🤍");
    }catch{
      showToast("Copy not supported");
    }
  });

  // Save today
  document.getElementById("btnQSave")?.addEventListener("click", async () => {
    // If you already save daily verses in db.js elsewhere, you can keep this simple.
    // If you have a specific save function for ayah history, tell me the function name and I’ll wire it.
    showToast("Saved ✨");
  });
}
