export function renderSafety(ctx){
  ctx.screen.innerHTML = `
    <section class="card" style="padding:16px">
      <div style="font-weight:900;font-size:24px">Safety</div>
      <div class="tiny muted" style="margin-top:6px">If you feel overwhelmed, take one step.</div>

      <div class="panel" style="margin-top:12px">
        <div style="font-weight:750">Immediate actions</div>
        <ul class="tiny muted" style="margin-top:8px; line-height:1.6">
          <li>Pause and breathe slowly (4 seconds in, 6 seconds out).</li>
          <li>Drink water. Sit down. Loosen your shoulders.</li>
          <li>Talk to someone you trust.</li>
          <li>If it’s urgent, contact local emergency services.</li>
        </ul>
      </div>

      <div class="panel" style="margin-top:12px">
        <div style="font-weight:750">This app</div>
        <div class="tiny muted" style="margin-top:6px">
          SoftLieya Care is supportive and private — not a medical service.
        </div>
      </div>
    </section>
  `;
}
