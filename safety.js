import { showToast } from "./ui.js";

function switchHTML(id, on){
  return `
    <div class="switch ${on?"on":""}" data-switch="${id}" role="switch" aria-checked="${on}">
      <div class="knob"></div>
    </div>
  `;
}

export function renderSafety(ctx){
  const go = ctx.modes?.goingOut || {};
  const active = !!ctx.modes?.goingOutActive;

  return `
    <div class="card section">
      <div class="section-title">
        <h2>Safety</h2>
        <span class="badge">No tracking</span>
      </div>

      <div class="toggle">
        <div>
          <div><b>Going out mode</b></div>
          <div class="meta">Simple check-ins. No location.</div>
        </div>
        ${switchHTML("goingOutActive", active)}
      </div>

      <div class="item">
        <div><b>Type</b></div>
        <label class="field">
          <span>Going out type</span>
          <select id="goingOutType">
            <option value="quick" ${go.type==="quick"?"selected":""}>Quick errand</option>
            <option value="commute" ${go.type==="commute"?"selected":""}>Commute</option>
            <option value="night" ${go.type==="night"?"selected":""}>Night out</option>
            <option value="travel" ${go.type==="travel"?"selected":""}>Travel</option>
          </select>
        </label>

        <div class="row">
          <button class="btn primary" id="btnImOkay" type="button">I’m okay</button>
          <button class="btn" id="btnSafetyPopup" type="button">Safety note</button>
        </div>

        <div class="meta">
          Last check-in: ${go.lastCheckInAt ? new Date(go.lastCheckInAt).toLocaleString() : "—"}
        </div>
      </div>
    </div>
  `;
}

export function bindSafety(ctx, root){
  root.querySelector("#goingOutType")?.addEventListener("change", async (e)=>{
    ctx.modes.goingOut.type = e.target.value;
    await ctx.actions.updateStates(ctx.modes);
    showToast("Updated.");
  });

  root.querySelector("#btnImOkay")?.addEventListener("click", async ()=>{
    ctx.modes.goingOut.lastCheckInAt = new Date().toISOString();
    await ctx.actions.updateStates(ctx.modes);
    showToast("Okay.");
    ctx.actions.renderRoute("safety");
  });

  root.querySelector("#btnSafetyPopup")?.addEventListener("click", ()=>{
    ctx.actions.showGentlePopup("Safety", ctx.tone.gentleLine("safety"));
  });

  root.querySelectorAll("[data-switch]").forEach(el=>{
    el.addEventListener("click", async ()=>{
      const id=el.getAttribute("data-switch");
      if(id==="goingOutActive") ctx.modes.goingOutActive = !ctx.modes.goingOutActive;
      await ctx.actions.updateStates(ctx.modes);
      showToast(ctx.modes.goingOutActive ? "Going out mode on." : "Going out mode off.");
      ctx.actions.renderRoute("safety");
    });
  });
}
