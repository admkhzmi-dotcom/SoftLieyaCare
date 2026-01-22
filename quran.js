// quran.js
import { showToast } from "./ui.js";
import { getDailyAyah, getRandomAyah, formatAyahForCopy } from "./quranMotivation.js";
import { saveDailyAyahIfNeeded, saveAyahToHistory, listAyahHistory } from "./db.js";

async function copyAyah(a){
  try{
    await navigator.clipboard.writeText(formatAyahForCopy(a));
    showToast("Copied ");
  }catch{
    showToast("Copy not supported");
  }
}

export async function renderQuran(ctx){
  const uid = ctx.user?.uid;
  if(!uid){
    ctx.screen.innerHTML = `
      <section class="card" style="padding:16px">
        <div style="font-weight:900;font-size:24px">Qur’an</div>
        <div class="tiny muted" style="margin-top:6px">Sign in to store your history.</div>
      </section>
    `;
    return;
  }

  const todayAyah = getDailyAyah(new Date());
  await saveDailyAyahIfNeeded(uid, todayAyah);

  const items = await listAyahHistory(uid);

  ctx.screen.innerHTML = `
    <section class="card" style="padding:16px">
      <div style="font-weight:900;font-size:24px">Qur’an</div>
      <div class="tiny muted" style="margin-top:6px">Today + your recent verses.</div>

      <div class="panel" style="margin-top:14px">
        <div class="row between" style="align-items:flex-end">
          <div style="font-weight:900;font-size:20px">Today</div>
          <div id="ayahRefToday" class="tiny muted">Surah ${todayAyah.ref}</div>
        </div>

        <div id="ayahArToday" class="quran-ar">${todayAyah.ar}</div>
        <div id="ayahMeaningToday">${todayAyah.meaning}</div>

        <div class="ayah-actions" style="margin-top:12px">
          <button class="btn" id="btnQCopy" type="button">Copy</button>
          <button class="btn primary" id="btnQSave" type="button">Save</button>
          <button class="btn ghost" id="btnQAnother" type="button">Another verse</button>
        </div>

        <div class="guide" style="margin-top:12px">
          <div class="tiny muted">
            How to use: Save stores the verse to your account. “Another verse” is for browsing; it doesn’t replace today’s verse.
          </div>
        </div>
      </div>

      <div style="margin-top:18px">
        <div style="font-weight:900;font-size:20px">History</div>
        <div class="tiny muted" style="margin-top:4px">Stored under your account only.</div>

        <div style="margin-top:12px">
          ${items.map(a => `
            <div class="panel" style="margin-bottom:12px">
              <div class="tiny muted">Surah ${a.ref}</div>
              <div class="quran-ar">${a.ar || ""}</div>
              <div>${a.meaning || ""}</div>
            </div>
          `).join("") || `<div class="tiny muted">No history yet.</div>`}
        </div>
      </div>
    </section>
  `;

  let current = todayAyah;
  const refEl = document.getElementById("ayahRefToday");
  const arEl = document.getElementById("ayahArToday");
  const meEl = document.getElementById("ayahMeaningToday");

  function paint(a){
    current = a;
    if(refEl) refEl.textContent = `Surah ${a.ref}`;
    if(arEl) arEl.textContent = a.ar || "";
    if(meEl) meEl.textContent = a.meaning || "";
  }

  document.getElementById("btnQCopy")?.addEventListener("click", () => copyAyah(current));
  document.getElementById("btnQSave")?.addEventListener("click", async () => {
    await saveAyahToHistory(uid, current);
    showToast("Saved ");
    location.hash = "#/quran";
  });
  document.getElementById("btnQAnother")?.addEventListener("click", () => paint(getRandomAyah()));
}
