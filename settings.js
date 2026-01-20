function esc(s){
  return String(s||"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;");
}

export function renderSettings(ctx){
  const p=ctx.prefs||{};
  const name=ctx.profile?.displayName||"Lieya";

  return `
    <form id="settingsForm">
      <div class="item">
        <div><b>Profile</b></div>
        <label class="field">
          <span>Name</span>
          <input name="displayName" value="${esc(name)}" />
        </label>
      </div>

      <div class="item">
        <div><b>Tone</b></div>
        <label class="field">
          <span>Tone level</span>
          <select name="toneLevel">
            <option value="0" ${Number(p.toneLevel)===0?"selected":""}>Neutral</option>
            <option value="1" ${Number(p.toneLevel)===1?"selected":""}>Soft</option>
            <option value="2" ${Number(p.toneLevel)===2?"selected":""}>Warm</option>
          </select>
        </label>
      </div>

      <div class="item">
        <div><b>Reminders</b></div>
        <label class="field">
          <span>Reminders enabled</span>
          <select name="remindersEnabled">
            <option value="true" ${p.remindersEnabled ? "selected":""}>On</option>
            <option value="false" ${!p.remindersEnabled ? "selected":""}>Off</option>
          </select>
        </label>

        <div class="grid two">
          <label class="field">
            <span>Quiet hours start</span>
            <input name="quietStart" value="${p.quietHours?.start || "22:30"}" />
          </label>
          <label class="field">
            <span>Quiet hours end</span>
            <input name="quietEnd" value="${p.quietHours?.end || "08:30"}" />
          </label>
        </div>

        <div class="grid two">
          <label class="field">
            <span>Daily popup limit</span>
            <input name="dailyPopupLimit" type="number" min="0" max="30" value="${Number(p.dailyPopupLimit ?? 8)}" />
          </label>
          <label class="field">
            <span>Cooldown (minutes)</span>
            <input name="popupCooldownMinutes" type="number" min="0" max="240" value="${Number(p.popupCooldownMinutes ?? 45)}" />
          </label>
        </div>
      </div>

      <div class="row" style="justify-content:flex-end;">
        <button class="btn primary" type="submit">Save</button>
      </div>
    </form>
  `;
}
