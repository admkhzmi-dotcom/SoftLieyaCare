// safety.js
export function renderSafety(ctx){
  ctx.screen.innerHTML = `
    <section class="card" style="padding:16px">
      <div style="font-weight:900;font-size:24px">Safety</div>
      <div class="tiny muted" style="margin-top:6px">Support and grounding tools.</div>

      <div class="panel" style="margin-top:14px">
        <div style="font-weight:850">If you feel overwhelmed</div>
        <ol style="margin-top:10px; line-height:1.6">
          <li>Put one hand on your chest. Breathe in slowly.</li>
          <li>Name 5 things you can see, 4 you can touch, 3 you can hear.</li>
          <li>Drink water. Sit down. Ask for help if you need.</li>
        </ol>

        <div class="guide" style="margin-top:12px">
          <div class="tiny muted">
            How to use: open this page when you feel panic or numbness. Follow the steps slowly. Repeat as needed.
          </div>
        </div>

        <div class="tiny muted" style="margin-top:10px">
          This app is not medical advice. If you are in danger, contact local emergency services.
        </div>
      </div>
    </section>
  `;
}
