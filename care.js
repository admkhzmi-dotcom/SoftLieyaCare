import { showToast } from "./ui.js";

function switchHTML(id, on){
  return `
    <div class="switch ${on?"on":""}" data-switch="${id}" role="switch" aria-checked="${on}">
      <div class="knob"></div>
    </div>
  `;
}

export function renderCare(ctx){
  const p=ctx.prefs||{};
  const m=ctx.modes||{};

  return `
    <div class="card section">
      <div class="section-title">
        <h2>Care</h2>
        <span class="badge">Daily care</span>
      </div>

      <div class="grid two">
        <div class="item">
          <div><b>Meal tracker</b></div>
          <div class="meta">Simple log. No shame. Just care.</div>

          <form id="mealForm">
            <label class="field">
              <span>Meal</span>
              <select name="mealType">
                <option value="breakfast">Breakfast</option>
                <option value="lunch">Lunch</option>
                <option value="dinner">Dinner</option>
                <option value="snack">Snack</option>
              </select>
            </label>

            <label class="field">
              <span>Amount</span>
              <select name="size">
                <option value="small">Small</option>
                <option value="normal">Normal</option>
              </select>
            </label>

            <label class="field">
              <span>Note (optional)</span>
              <input name="note" placeholder="e.g., soup, rice…" />
            </label>

            <button class="btn primary" type="submit">Save meal</button>
          </form>
        </div>

        <div class="item">
          <div><b>Sleep tracker</b></div>
          <div class="meta">Keep it simple. Patterns later.</div>

          <form id="sleepForm">
            <label class="field">
              <span>Sleep start</span>
              <input name="sleepStart" type="datetime-local" required />
            </label>

            <label class="field">
              <span>Wake time</span>
              <input name="sleepEnd" type="datetime-local" required />
            </label>

            <label class="field">
              <span>Quality</span>
              <select name="quality">
                <option value="5">5 - Great</option>
                <option value="4">4 - Good</option>
                <option value="3" selected>3 - Okay</option>
                <option value="2">2 - Rough</option>
                <option value="1">1 - Very rough</option>
              </select>
            </label>

            <label class="field">
              <span>Note (optional)</span>
              <input name="note" placeholder="e.g., woke up once…" />
            </label>

            <button class="btn primary" type="submit">Save sleep</button>
          </form>
        </div>
      </div>

      <hr class="sep"/>

      <div class="grid two">
        <div class="toggle">
          <div>
            <div><b>Period mode</b></div>
            <div class="meta">Extra gentle tone</div>
          </div>
          ${switchHTML("periodMode", !!m.periodModeEnabled)}
        </div>

        <div class="toggle">
          <div>
            <div><b>Tired mode</b></div>
            <div class="meta">Less pressure</div>
          </div>
          ${switchHTML("tiredMode", !!m.tiredModeEnabled)}
        </div>
      </div>

      <hr class="sep"/>

      <div class="row">
        <button class="btn" id="btnEyes" type="button">20-second reset</button>
        <button class="btn" id="btnComfort" type="button">Comfort</button>
      </div>

      <div class="tiny muted">Quiet hours: ${p.quietHours?.start || "—"} → ${p.quietHours?.end || "—"}</div>
    </div>
  `;
}

export function bindCare(ctx, root){
  root.querySelector("#mealForm")?.addEventListener("submit", async (e)=>{
    e.preventDefault();
    const fd=new FormData(e.target);
    await ctx.actions.addMeal(fd.get("mealType"), fd.get("size"), fd.get("note"));
    showToast("Meal saved.");
    e.target.reset();
  });

  root.querySelector("#sleepForm")?.addEventListener("submit", async (e)=>{
    e.preventDefault();
    const fd=new FormData(e.target);
    await ctx.actions.addSleep(fd.get("sleepStart"), fd.get("sleepEnd"), fd.get("quality"), fd.get("note"));
    showToast("Sleep saved.");
    e.target.reset();
  });

  root.querySelector("#btnEyes")?.addEventListener("click", ()=>{
    ctx.actions.showGentlePopup("A tiny reset", ctx.tone.gentleLine("eyes"));
  });

  root.querySelector("#btnComfort")?.addEventListener("click", ()=>{
    ctx.actions.showGentlePopup("Comfort", ctx.tone.gentleLine("comfort"));
  });

  root.querySelectorAll("[data-switch]").forEach(el=>{
    el.addEventListener("click", async ()=>{
      const id=el.getAttribute("data-switch");
      if(id==="periodMode") ctx.modes.periodModeEnabled = !ctx.modes.periodModeEnabled;
      if(id==="tiredMode") ctx.modes.tiredModeEnabled = !ctx.modes.tiredModeEnabled;
      await ctx.actions.updateStates(ctx.modes);
      ctx.actions.refreshTone();
      showToast("Updated.");
      ctx.actions.renderRoute("care");
    });
  });
}
