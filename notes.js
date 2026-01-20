import { showToast } from "./ui.js";

function esc(s){
  return String(s||"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;");
}

function fmt(ts){
  if(!ts) return "";
  const d = ts.toDate ? ts.toDate() : new Date();
  return d.toLocaleString();
}

export function renderNotes(){
  return `
    <div class="card section">
      <div class="section-title">
        <h2>Notes</h2>
        <span class="badge">Private</span>
      </div>

      <form id="noteForm" class="item">
        <div><b>Write</b></div>
        <div class="meta">Only you can see this.</div>

        <label class="field">
          <span>Mood</span>
          <select name="mood">
            <option value="calm">Calm</option>
            <option value="happy">Happy</option>
            <option value="tired">Tired</option>
            <option value="sad">Sad</option>
            <option value="anxious">Anxious</option>
            <option value="mixed">Mixed</option>
          </select>
        </label>

        <label class="field">
          <span>Note</span>
          <textarea name="text" placeholder="Write gently…"></textarea>
        </label>

        <button class="btn primary" type="submit">Save note</button>
      </form>

      <div class="item">
        <div><b>Recent</b></div>
        <div class="meta">Latest entries</div>
        <div id="notesList" class="list"></div>
      </div>
    </div>
  `;
}

export async function bindNotes(ctx, root){
  const list = root.querySelector("#notesList");
  const recent = await ctx.actions.getRecent("notes", 6);

  if(recent.length === 0){
    list.innerHTML = `<div class="tiny muted">No notes yet.</div>`;
  } else {
    list.innerHTML = recent.map(n => `
      <div class="item">
        <div><b>${esc((n.moodTag||"").toUpperCase())}</b></div>
        <div>${esc(n.text||"")}</div>
        <div class="meta">${fmt(n.timestamp)}</div>
      </div>
    `).join("");
  }

  root.querySelector("#noteForm")?.addEventListener("submit", async (e)=>{
    e.preventDefault();
    const fd=new FormData(e.target);
    const text=String(fd.get("text")||"").trim();
    if(!text){ showToast("Write a little first."); return; }
    await ctx.actions.addNote(fd.get("mood"), text);
    showToast("Saved.");
    e.target.reset();
    ctx.actions.renderRoute("notes");
  });
}
