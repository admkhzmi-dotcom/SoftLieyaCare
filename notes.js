import { showToast } from "./ui.js";
import { addNote, listNotes } from "./db.js";

export async function renderNotes(ctx){
  const uid = ctx.user?.uid;
  const notes = uid ? await listNotes(uid) : [];

  ctx.screen.innerHTML = `
    <section class="card" style="padding:16px">
      <div style="font-weight:900;font-size:24px">Notes</div>
      <div class="tiny muted" style="margin-top:6px">Private thoughts, saved gently.</div>

      <div class="panel" style="margin-top:12px">
        <label class="field">
          <span>Write a note</span>
          <input id="noteText" placeholder="A soft thought…" />
        </label>
        <button id="btnSaveNote" class="btn primary" type="button">Save</button>
      </div>

      <div style="margin-top:14px">
        ${notes.map(n => `
          <div class="panel" style="margin-bottom:10px">
            <div style="font-weight:650">${escapeHtml(n.text || "")}</div>
            <div class="tiny muted" style="margin-top:6px">${new Date(n.createdAt || Date.now()).toLocaleString()}</div>
          </div>
        `).join("") || `<div class="tiny muted">No notes yet.</div>`}
      </div>
    </section>
  `;

  document.getElementById("btnSaveNote")?.addEventListener("click", async () => {
    const t = document.getElementById("noteText")?.value?.trim();
    if(!uid || !t) return;
    await addNote(uid, t);
    showToast("Saved ✨");
    location.hash = "#/notes";
  });
}

function escapeHtml(s){
  return String(s).replace(/[&<>"']/g, m => ({
    "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"
  }[m]));
}
