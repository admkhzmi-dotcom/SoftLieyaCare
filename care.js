export function renderCare(ctx){
  const name = (ctx.user?.displayName || "Lieya").trim() || "Lieya";
  ctx.screen.innerHTML = `
    <section class="card" style="padding:16px">
      <div style="font-weight:900;font-size:24px">Care</div>
      <div class="tiny muted" style="margin-top:6px">
        Gentle check-in for ${name}.
      </div>

      <div class="panel" style="margin-top:12px">
        <div style="font-weight:750">A simple reminder</div>
        <div class="tiny muted" style="margin-top:6px">
          Breathe slowly. Relax your shoulders. Drink a little water.
        </div>
      </div>
    </section>
  `;
}
