// settings.js
import { showToast } from "./ui.js";

const LS_KEY = "slc_settings_v2";

export function getSettings(){
  const raw = localStorage.getItem(LS_KEY);
  let s = {};
  try { s = raw ? JSON.parse(raw) : {}; } catch { s = {}; }
  return {
    dailyQuranCard: s.dailyQuranCard ?? true,
    dailyQuran9amReminder: s.dailyQuran9amReminder ?? true,
    toneLevel: s.toneLevel ?? 1
  };
}

export function saveSettings(next){
  localStorage.setItem(LS_KEY, JSON.stringify(next));
}

export function renderSettingsModal(){
  const s = getSettings();
  return `
    <div class="stack gap">
      <div class="row between">
        <div>
          <div style="font-weight:650">Daily Qur’an Motivation</div>
          <div class="tiny muted">Arabic + meaning (paraphrase). Private, on-device.</div>
        </div>
        <label class="switch">
          <input id="setDailyQuranCard" type="checkbox" ${s.dailyQuranCard ? "checked":""}>
          <span class="slider"></span>
        </label>
      </div>

      <div class="row between">
        <div>
          <div style="font-weight:650">9:00 AM gentle reminder</div>
          <div class="tiny muted">Shows once/day while the app is open.</div>
        </div>
        <label class="switch">
          <input id="setDailyQuran9am" type="checkbox" ${s.dailyQuran9amReminder ? "checked":""}>
          <span class="slider"></span>
        </label>
      </div>

      <hr class="hr">

      <div class="row between">
        <div>
          <div style="font-weight:650">Tone</div>
          <div class="tiny muted">Calm • Soft • Warm</div>
        </div>
        <select id="setToneLevel">
          <option value="0" ${String(s.toneLevel)==="0" ? "selected":""}>Calm</option>
          <option value="1" ${String(s.toneLevel)==="1" ? "selected":""}>Soft</option>
          <option value="2" ${String(s.toneLevel)==="2" ? "selected":""}>Warm</option>
        </select>
      </div>

      <div class="tiny muted">
        Tip: If updates don’t reflect, clear site data once (Service Worker cache).
      </div>
    </div>
  `;
}

export function bindSettingsModal(onChange){
  const prev = getSettings();
  const elCard = document.getElementById("setDailyQuranCard");
  const el9am = document.getElementById("setDailyQuran9am");
  const elTone = document.getElementById("setToneLevel");

  function commit(){
    const next = {
      ...prev,
      dailyQuranCard: !!elCard?.checked,
      dailyQuran9amReminder: !!el9am?.checked,
      toneLevel: Number(elTone?.value ?? prev.toneLevel)
    };
    saveSettings(next);
    showToast("Saved ");
    onChange?.(next);
  }

  elCard?.addEventListener("change", commit);
  el9am?.addEventListener("change", commit);
  elTone?.addEventListener("change", commit);
}
