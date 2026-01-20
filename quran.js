import { showToast } from "./ui.js";
import { getDailyAyah, getRandomAyah, formatAyahForCopy } from "./quranMotivation.js";
import { saveDailyAyahIfNeeded, listAyahHistory } from "./db.js";

async function copyText(text){
  try{
    await navigator.clipboard.writeText(text);
    showToast("Copied 🤍");
  }catch{
    showToast("Copy not supported");
  }
}

export async function renderQuran(ctx){
  const uid = ctx.user?.uid;
  if(!uid){
    ctx.screen.innerHTML = `<section class="card" style="padding:16px">Please sign in.</section>`;
    return;
  }

  const today = getDailyAyah(new Date());
  await saveDailyAyahIfNeeded(uid, today);

  const history = await listAyahHistory(uid, 30);

  ctx.screen.innerHTML = `
    <section class="card" style="padding:16px">
      <div class="row between">
        <div>
          <div style="font-weight:800;font-size:26px;letter-spacing:-.3px">Qur’an</div>
          <div class="tiny muted" style="margin-top:6px">Daily motivation • saved privately</div>
        </div>
        <button class="btn ghost" id="btnQRandom" type="button">Random</button>
      </div>

      <div class="card ayah-card" style="margin-top:14px">
        <div class="ayah-title">
          <div class="label">Today</div>
          <div class="ayah-ref" id="qRef">Surah ${today.ref}</div>
        </div>
        <div class="ayah-ar" id="qAr">${today.ar}</div>
        <div class="ayah-meaning" id="qMeaning">${today.meaning}</div>

        <div class="ayah-actions">
          <button class="btn" id="btnQCopy" type="button">Copy</button>
          <button class="btn ghost" id="btnQSave" type="button">Save</button>
        </div>
      </div>

      <hr class="hr">

      <div style="font-weight:700">History</div>
      <div class="tiny muted" style="margin-top:6px">Stored under your account only.</div>

      <div style="margin-top:12px; display:flex; flex-direction:column; gap:10px">
        ${
          history.length
            ? history.map(h => `
              <div class="panel">
                <div class="row between">
                  <div style="font-weight:650">Surah ${h.ref}</div>
                  <div class="tiny muted">${h.dateKey || ""}</div>
                </div>
                <div class="ayah-ar" style="margin-top:8px">${h.ar}</div>
                <div class="tiny muted" style="margin-top:8px">${h.meaning}</div>
                <div class="row" style="margin-top:10px; flex-wrap:wrap">
                  <button class="btn ghost" data-copy="${encodeURIComponent(formatAyahForCopy(h))}">Copy</button>
                </div>
              </div>
            `).join("")
            : `<div class="tiny muted">No history yet (it saves automatically each day).</div>`
        }
      </div>
    </section>
  `;

  let current = today;

  document.getElementById("btnQRandom")?.addEventListener("click", () => {
    current = getRandomAyah();
    document.getElementById("qRef").textContent = `Surah ${current.ref}`;
    document.getElementById("qAr").textContent = current.ar;
    document.getElementById("qMeaning").textContent = current.meaning;
    showToast("A gentle new verse ✨");
  });

  document.getElementById("btnQCopy")?.addEventListener("click", () => copyText(formatAyahForCopy(current)));
  document.getElementById("btnQSave")?.addEventListener("click", async () => {
    await saveDailyAyahIfNeeded(uid, current, { force:true });
    showToast("Saved ✨");
    location.hash = "#/quran";
  });

  ctx.screen.querySelectorAll("[data-copy]")?.forEach(btn => {
    btn.addEventListener("click", () => {
      const text = decodeURIComponent(btn.getAttribute("data-copy") || "");
      copyText(text);
    });
  });
}
