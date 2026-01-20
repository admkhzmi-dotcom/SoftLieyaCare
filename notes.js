import { showToast } from "./ui.js";
import { addNote, listNotes } from "./db.js";

export async function renderNotes(ctx){
  const uid = ctx.user?.uid;
  if(!uid){
    ctx.screen.innerHTML = `<section class="card" style="padding:16px">Please sign in.</section>`;
    return;
  }

  const notes = await listNotes(uid, 30);

  ctx.screen.innerHTML = `
    <section class="card" style="padding:16px">
      <div style="font-weight:800;font-size:26px;letter-spacing:-.3px">Notes</div>
      <div class="tiny muted" style="margin-top:6px">Private notes for Lieya — saved to your account.</div>

      <hr class="hr">

      <div class="panel">
        <label class="field">
          <span>Title</span>
          <input id="noteTitle" placeholder="A soft thought…" />
        </label>
        <label class="field">
          <span>Body</span>
          <input id="noteBody" placeholder="Write something gentle…" />
        </label>
        <button class="btn primary" id="btnNoteSave" type="button">Save note</button>
      </div>

      <div style="margin-top:14px; display:flex; flex-direction:column; gap:10px">
        ${notes.map(n => `
          <div class="panel">
            <div style="font-weight:650">${escapeHtml(n.title || "Note")}</div>
            <div class="tiny muted" style="margin-top:6px">${escapeHtml(n.body || "")}</div>
          </div>
        `).join("") || `<div class="tiny muted">No notes yet.</div>`}
      </div>
    </section>
  `;

  document.getElementById("btnNoteSave")?.addEventListener("click", async () => {
    const title = (document.getElementById("noteTitle")?.value || "").trim() || "Note";
    const body  = (document.getElementById("noteBody")?.value || "").trim();

    await addNote(uid, { title, body });
    showToast("Note saved ✨");
    location.hash = "#/notes"; // refresh
  });
}

function escapeHtml(s){
  return String(s)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}
