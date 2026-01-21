import { listAyahHistory } from "./db.js";

export async function renderQuran(ctx){
  const uid = ctx.user?.uid;
  const items = uid ? await listAyahHistory(uid) : [];

  ctx.screen.innerHTML = `
    <section class="card" style="padding:16px">
      <div style="font-weight:900;font-size:24px">Qur’an</div>
      <div class="tiny muted" style="margin-top:6px">Your recent verses.</div>

      <div style="margin-top:14px">
        ${items.map(a => `
          <div class="panel" style="margin-bottom:12px">
            <div class="tiny muted">Surah ${a.ref}</div>
            <div style="margin-top:6px; font-size:18px; line-height:1.9; direction:rtl">${a.ar || ""}</div>
            <div style="margin-top:8px">${a.meaning || ""}</div>
          </div>
        `).join("") || `<div class="tiny muted">No history yet.</div>`}
      </div>
    </section>
  `;
}
