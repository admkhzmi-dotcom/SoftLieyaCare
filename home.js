function esc(s){
  return String(s||"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;");
}

export function renderHome(ctx){
  const name = ctx.profile?.displayName || "Lieya";
  const tone = ["Neutral","Soft","Warm"][Number(ctx.prefs?.toneLevel ?? 1)] || "Soft";

  return `
    <div class="card section">
      <div class="section-title">
        <h2>Home</h2>
        <span class="badge">${tone}</span>
      </div>

      <div class="grid two">
        <div class="kpi">
          <div class="label">Today</div>
          <div class="value">Water • Meals • Rest</div>
        </div>
        <div class="kpi">
          <div class="label">For ${esc(name)}</div>
          <div class="value">${esc(ctx.tone.gentleLine("comfort"))}</div>
        </div>
      </div>

      <hr class="sep"/>

      <div class="row">
        <button class="btn primary" id="homeGoCare" type="button">Open Care</button>
        <button class="btn" id="homeGoNotes" type="button">Write Note</button>
        <button class="btn" id="homeGoSafety" type="button">Safety</button>
      </div>

      <div class="tiny muted">No tracking. No location. Only gentle support.</div>
    </div>
  `;
}

export function bindHome(root){
  root.querySelector("#homeGoCare")?.addEventListener("click", ()=> location.hash="#/care");
  root.querySelector("#homeGoNotes")?.addEventListener("click", ()=> location.hash="#/notes");
  root.querySelector("#homeGoSafety")?.addEventListener("click", ()=> location.hash="#/safety");
}
