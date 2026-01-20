import { showPopup } from "./ui.js";

export function renderSafety(ctx){
  const name = (ctx.user?.displayName || "Lieya").trim() || "Lieya";
  ctx.screen.innerHTML = `
    <section class="card" style="padding:16px">
      <div style="font-weight:800;font-size:26px;letter-spacing:-.3px">Safety</div>
      <div class="tiny muted" style="margin-top:6px">Gentle support — choose safety first, always.</div>

      <hr class="hr">

      <div class="panel">
        <div style="font-weight:650">Quick check-in</div>
        <div class="tiny muted" style="margin-top:6px">If anything feels unsafe, ask for help immediately.</div>

        <div class="row" style="margin-top:10px; flex-wrap:wrap">
          <button class="btn primary" id="btnSafeOk" type="button">I’m okay</button>
          <button class="btn" id="btnSafeHelp" type="button">I need help</button>
        </div>
      </div>

      <div class="panel" style="margin-top:12px">
        <div style="font-weight:650">Emergency (Malaysia)</div>
        <div class="tiny muted" style="margin-top:6px">
          Call emergency services if in immediate danger.
        </div>
        <div class="row" style="margin-top:10px; flex-wrap:wrap">
          <a class="btn" href="tel:999">Call 999</a>
          <a class="btn ghost" href="tel:15999">Talian Kasih 15999</a>
        </div>
      </div>

      <div class="tiny muted" style="margin-top:12px">
        ${name}, your safety matters more than any app. 💛
      </div>
    </section>
  `;

  document.getElementById("btnSafeOk")?.addEventListener("click", () => {
    showPopup({ title: "Good.", text: "Stay soft, stay aware. You’re doing your best." });
  });

  document.getElementById("btnSafeHelp")?.addEventListener("click", () => {
    showPopup({
      title: "Choose safety first",
      text: "If you’re in danger, call 999. If you need support, reach out to a trusted person now."
    });
  });
}
