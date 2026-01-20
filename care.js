import { showToast } from "./ui.js";
import { addMealLog, addWaterLog, addRestLog } from "./db.js";

export function renderCare(ctx){
  const name = (ctx.user?.displayName || "Lieya").trim() || "Lieya";

  ctx.screen.innerHTML = `
    <section class="card" style="padding:16px">
      <div style="font-weight:800;font-size:26px;letter-spacing:-.3px">Care</div>
      <div class="tiny muted" style="margin-top:6px">Soft routines for ${name} — gentle, not strict.</div>

      <hr class="hr">

      <div class="panel">
        <div style="font-weight:650">Meal tracker</div>
        <div class="tiny muted" style="margin-top:6px">Log a simple meal. No calories. No pressure.</div>

        <label class="field">
          <span>What did you eat?</span>
          <input id="mealText" placeholder="e.g., rice + chicken, sandwich, fruits…" />
        </label>

        <label class="field">
          <span>Note (optional)</span>
          <input id="mealNote" placeholder="e.g., small portion, felt okay…" />
        </label>

        <button class="btn primary" id="btnMealSave" type="button">Save meal</button>
      </div>

      <div class="row" style="margin-top:12px; flex-wrap:wrap">
        <button class="btn" id="btnWater" type="button">Quick water log</button>
        <button class="btn" id="btnRest" type="button">Quick rest log</button>
      </div>
    </section>
  `;

  document.getElementById("btnMealSave")?.addEventListener("click", async () => {
    const uid = ctx.user?.uid;
    if(!uid) return;

    const text = (document.getElementById("mealText")?.value || "").trim() || "Simple meal";
    const note = (document.getElementById("mealNote")?.value || "").trim();

    await addMealLog(uid, { text, note });
    showToast("Meal saved 🤍");
  });

  document.getElementById("btnWater")?.addEventListener("click", async () => {
    const uid = ctx.user?.uid;
    if(!uid) return;
    await addWaterLog(uid, { amount:"a few sips" });
    showToast("Water logged ✨");
  });

  document.getElementById("btnRest")?.addEventListener("click", async () => {
    const uid = ctx.user?.uid;
    if(!uid) return;
    await addRestLog(uid, { note:"Short rest" });
    showToast("Rest logged 🌙");
  });
}
