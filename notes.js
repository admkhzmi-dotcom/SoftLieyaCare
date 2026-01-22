// notes.js
import { showToast, openModal, closeModal, showConfirmPopup } from "./ui.js";
import { saveNote, listNotes, deleteNote, updateNote, exportNotes } from "./db.js";

const NOTE_SOFT_LIMIT = 3000;

function escapeHtml(str=""){
  return String(str)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

function fmtWhen(note){
  if(note?.when) return note.when;
  const ts = note?.createdAt?.toDate?.();
  return ts ? ts.toLocaleString() : "";
}

function sortPinnedFirst(notes){
  return [...notes].sort((a,b) => {
    const pa = a?.pinned ? 1 : 0;
    const pb = b?.pinned ? 1 : 0;
    if(pb !== pa) return pb - pa;

    const ta = a?.updatedAt?.toMillis?.() || a?.createdAt?.toMillis?.() || 0;
    const tb = b?.updatedAt?.toMillis?.() || b?.createdAt?.toMillis?.() || 0;
    return tb - ta;
  });
}

function downloadJson(filename, data){
  const blob = new Blob([JSON.stringify(data, null, 2)], { type:"application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function renderNotes(ctx){
  const uid = ctx.user?.uid;

  if(!uid){
    ctx.screen.innerHTML = `
      <section class="card" style="padding:16px">
        <div style="font-weight:900;font-size:24px">Notes</div>
        <div class="tiny muted" style="margin-top:6px">Sign in to save and manage notes.</div>
      </section>
    `;
    return;
  }

  const notesRaw = await listNotes(uid, 50);
  const notes = sortPinnedFirst(notesRaw);

  ctx.screen.innerHTML = `
    <section class="card" style="padding:16px">
      <div class="row between" style="gap:12px; flex-wrap:wrap; align-items:flex-start">
        <div>
          <div style="font-weight:900;font-size:24px">Notes</div>
          <div class="tiny muted" style="margin-top:6px">
            Private notes for study, self-care, reminders. Edit, pin, export, or delete anytime.
          </div>
        </div>

        <div class="row" style="gap:8px; flex-wrap:wrap">
          <button class="btn" id="btnExportNotes" type="button">Export</button>
          <button class="btn ghost" id="btnQuickGuide" type="button">How to use</button>
        </div>
      </div>

      <div class="panel" style="margin-top:14px">
        <div style="font-weight:850">New note</div>

        <div class="row" style="margin-top:10px; gap:8px; flex-wrap:wrap">
          <button class="btn" id="tplStudy" type="button">Study</button>
          <button class="btn" id="tplSelfCare" type="button">Self-care</button>
          <button class="btn" id="tplTodo" type="button">To-do</button>
        </div>

        <label class="field" style="margin-top:10px">
          <span>Write</span>
          <textarea id="noteText" class="note-textarea" rows="6"
            placeholder="Example: Today's focus: revise Chapter 3. Drink water. Gentle walk."></textarea>
        </label>

        <div class="row between" style="margin-top:10px; flex-wrap:wrap">
          <div class="tiny muted" id="charCount">0 / ${NOTE_SOFT_LIMIT}</div>
          <div class="row" style="gap:8px; flex-wrap:wrap">
            <button class="btn" id="btnSavePinned" type="button">Save & Pin</button>
            <button class="btn primary" id="btnSaveNote" type="button">Save</button>
          </div>
        </div>

        <div class="guide" style="margin-top:12px">
          <div class="tiny muted">
            Tip: Pin important notes (exam plan / appointments / symptoms) so they stay at the top.
            Keep headings + bullets for fast review.
          </div>
        </div>
      </div>

      <div class="panel" style="margin-top:12px">
        <div style="font-weight:850">Search</div>
        <label class="field" style="margin-top:8px">
          <span>Find a note</span>
          <input id="noteSearch" type="text" placeholder="Type keywords…"/>
        </label>
      </div>

      <div style="margin-top:16px">
        <div class="row between" style="gap:10px; flex-wrap:wrap">
          <div>
            <div style="font-weight:900;font-size:20px">Your notes</div>
            <div class="tiny muted" style="margin-top:4px">
              ${notes.length ? `${notes.length} saved` : "No notes yet."}
            </div>
          </div>

          ${notes.length ? `
            <div class="tiny muted">
              Pinned stay on top • Search filters instantly
            </div>
          ` : ``}
        </div>

        <div id="notesList" style="margin-top:12px">
          ${
            notes.length
              ? notes.map(n => `
                <div class="panel note-item" style="margin-bottom:12px" data-note-id="${n.id}">
                  <div class="row between" style="gap:10px; align-items:flex-start; flex-wrap:wrap">
                    <div class="tiny muted">
                      ${n.pinned ? "📌 Pinned • " : ""}${escapeHtml(fmtWhen(n))}
                    </div>

                    <div class="row" style="gap:8px; flex-wrap:wrap">
                      <button class="btn" data-action="pin" type="button">${n.pinned ? "Unpin" : "Pin"}</button>
                      <button class="btn" data-action="edit" type="button">Edit</button>
                      <button class="btn" data-action="delete" type="button">Delete</button>
                    </div>
                  </div>

                  <div style="margin-top:10px; line-height:1.6; white-space:pre-wrap">
                    ${escapeHtml(n.text || "")}
                  </div>
                </div>
              `).join("")
              : `
                <div class="panel">
                  <div style="font-weight:850">No notes yet</div>
                  <div class="tiny muted" style="margin-top:8px; line-height:1.6">
                    Try one of the templates above (Study / Self-care / To-do).<br/>
                    Your notes are saved to your account only.
                  </div>
                </div>
              `
          }
        </div>
      </div>
    </section>
  `;

  function refresh(){
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  }

  // Templates
  const noteText = document.getElementById("noteText");
  const charCount = document.getElementById("charCount");

  function updateCount(){
    const len = (noteText?.value || "").length;
    charCount.textContent = `${len} / ${NOTE_SOFT_LIMIT}`;
    if(len > NOTE_SOFT_LIMIT){
      charCount.style.color = "#7c1a1a";
    }else{
      charCount.style.color = "";
    }
  }

  function setText(t){
    if(!noteText) return;
    noteText.value = t;
    updateCount();
    noteText.focus();
  }

  document.getElementById("tplStudy")?.addEventListener("click", () => setText(
`📚 Study plan
- Topic:
- What I will finish:
- 25-min focus blocks:
- Questions to ask:
- Reward after:`));

  document.getElementById("tplSelfCare")?.addEventListener("click", () => setText(
`🌿 Self-care check
- Water:
- Food:
- Rest:
- Mood:
- One small win today:
- One kind thing to tell myself:`));

  document.getElementById("tplTodo")?.addEventListener("click", () => setText(
`✅ To-do
1)
2)
3)
Priority: ____`));

  noteText?.addEventListener("input", () => {
    updateCount();
    const len = (noteText?.value || "").length;
    if(len === NOTE_SOFT_LIMIT + 1){
      showToast("That’s a long note — consider splitting it");
    }
  });
  updateCount();

  // Save
  async function save(pinned){
    const text = (noteText?.value || "").trim();
    if(!text) return showToast("Write something first");

    if(text.length > NOTE_SOFT_LIMIT + 800){
      return showToast("Too long — please shorten a bit");
    }

    await saveNote(uid, { text, pinned: !!pinned });
    showToast(pinned ? "Saved & pinned" : "Saved");
    refresh();
  }

  document.getElementById("btnSaveNote")?.addEventListener("click", () => save(false));
  document.getElementById("btnSavePinned")?.addEventListener("click", () => save(true));

  // Search filter
  const searchEl = document.getElementById("noteSearch");
  function applyFilter(){
    const q = (searchEl?.value || "").trim().toLowerCase();
    document.querySelectorAll("#notesList [data-note-id]").forEach(card => {
      const txt = (card.textContent || "").toLowerCase();
      card.style.display = (!q || txt.includes(q)) ? "" : "none";
    });
  }
  searchEl?.addEventListener("input", applyFilter);

  // Export
  document.getElementById("btnExportNotes")?.addEventListener("click", async () => {
    const data = await exportNotes(uid, 200);
    const stamp = new Date().toISOString().slice(0,10);
    downloadJson(`softlieya-notes-${stamp}.json`, data);
    showToast("Exported");
  });

  // Quick guide modal
  document.getElementById("btnQuickGuide")?.addEventListener("click", () => {
    openModal({
      title: "How to use Notes",
      html: `
        <div class="panel">
          <div style="font-weight:850">Fast workflow</div>
          <ol style="margin-top:10px; line-height:1.7">
            <li>Use a template (Study / Self-care / To-do) to start quickly.</li>
            <li>Pin important notes so they stay on top.</li>
            <li>Search anytime to find old notes instantly.</li>
            <li>Export if you want a backup or to move phones.</li>
          </ol>
          <div class="guide" style="margin-top:12px">
            <div class="tiny muted">
              Tip: For study notes, keep them short + bullet-based. For longer writing, split into multiple notes.
            </div>
          </div>

          <div class="row between" style="margin-top:12px; flex-wrap:wrap">
            <button class="btn primary" id="btnCloseGuide" type="button">Okay</button>
          </div>
        </div>
      `
    });
    document.getElementById("btnCloseGuide")?.addEventListener("click", closeModal);
  });

  // Actions: pin / edit / delete (event delegation)
  document.getElementById("notesList")?.addEventListener("click", async (e) => {
    const btn = e.target?.closest?.("button[data-action]");
    if(!btn) return;

    const action = btn.getAttribute("data-action");
    const card = btn.closest("[data-note-id]");
    const noteId = card?.getAttribute("data-note-id");
    if(!noteId) return;

    const note = notes.find(n => n.id === noteId);
    if(!note) return;

    if(action === "pin"){
      await updateNote(uid, noteId, { pinned: !note.pinned });
      showToast(note.pinned ? "Unpinned" : "Pinned");
      refresh();
      return;
    }

    if(action === "delete"){
      showConfirmPopup({
        title: "Delete note?",
        text: "This can’t be undone.",
        yesText: "Delete",
        noText: "Cancel",
        onYes: async () => {
          await deleteNote(uid, noteId);
          showToast("Deleted");
          refresh();
        }
      });
      return;
    }

    if(action === "edit"){
      openModal({
        title: "Edit note",
        html: `
          <div class="panel">
            <label class="field">
              <span>Update</span>
              <textarea id="editNoteText" class="note-textarea" rows="7">${escapeHtml(note.text || "")}</textarea>
            </label>

            <div class="row between" style="margin-top:10px; flex-wrap:wrap">
              <button class="btn ghost" id="btnCancelEdit" type="button">Cancel</button>
              <button class="btn primary" id="btnSaveEdit" type="button">Save changes</button>
            </div>

            <div class="guide" style="margin-top:12px">
              <div class="tiny muted">Tip: Use headings + bullets. Short notes are easier to review later.</div>
            </div>
          </div>
        `
      });

      document.getElementById("btnCancelEdit")?.addEventListener("click", closeModal);
      document.getElementById("btnSaveEdit")?.addEventListener("click", async () => {
        const t = (document.getElementById("editNoteText")?.value || "").trim();
        if(!t) return showToast("Note can't be empty");
        await updateNote(uid, noteId, { text: t });
        closeModal();
        showToast("Updated");
        refresh();
      });

      return;
    }
  });
}
