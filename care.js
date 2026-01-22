// care.js (Period Tracker)
import { showToast, showTripleChoicePopup } from "./ui.js";
import {
  getPeriodState,
  setPeriodToday,
  endPeriod,
  listPeriods,
  healPeriodStateFromHistory
} from "./db.js";
import { getTodayKey } from "./quranMotivation.js";

// Defaults
// - Bleeding duration is commonly ~2–7 days; you want default 6
// - Cycle length commonly ~21–35 days; fallback average 28 if no history
const DEFAULT_PERIOD_DAYS = 6;
const DEFAULT_CYCLE_DAYS  = 28;
const CYCLE_MIN_DAYS      = 21;
const CYCLE_MAX_DAYS      = 35;

function parseDayKey(key){
  return new Date(`${key}T00:00:00`);
}
function diffDays(aKey, bKey){
  const a = parseDayKey(aKey);
  const b = parseDayKey(bKey);
  return Math.round((b - a) / (1000*60*60*24));
}
function addDays(dayKey, days){
  const d = parseDayKey(dayKey);
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,"0");
  const dd = String(d.getDate()).padStart(2,"0");
  return `${y}-${m}-${dd}`;
}
function average(nums){
  const arr = nums.filter(n => Number.isFinite(n));
  if(!arr.length) return null;
  return arr.reduce((a,b)=>a+b,0) / arr.length;
}

// Small SVG pie chart (no libs)
function pieSvg({ normal=0, early=0, late=0, size=120 }){
  const total = normal + early + late;
  if(!total) return `<div class="tiny muted">No completed history yet.</div>`;

  const r = (size/2) - 8;
  const c = 2 * Math.PI * r;

  const parts = [
    { key:"Normal", value: normal, cls:"pie-n" },
    { key:"Early",  value: early,  cls:"pie-e" },
    { key:"Late",   value: late,   cls:"pie-l" }
  ];

  let offset = 0;
  const circles = parts
    .filter(p => p.value > 0)
    .map(p => {
      const frac = p.value / total;
      const dash = frac * c;
      const seg = `
        <circle class="${p.cls}"
          r="${r}" cx="${size/2}" cy="${size/2}"
          fill="transparent"
          stroke-width="14"
          stroke-dasharray="${dash} ${c - dash}"
          stroke-dashoffset="${-offset}"
          stroke-linecap="butt"
        />
      `;
      offset += dash;
      return seg;
    })
    .join("");

  return `
    <div style="display:flex; align-items:center; gap:14px; flex-wrap:wrap">
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" aria-label="Period history chart">
        <circle r="${r}" cx="${size/2}" cy="${size/2}" fill="transparent" stroke="rgba(0,0,0,0.06)" stroke-width="14"/>
        <g transform="rotate(-90 ${size/2} ${size/2})">
          ${circles}
        </g>
      </svg>

      <div class="tiny muted" style="line-height:1.7">
        <div><span class="pie-dot pie-n"></span> Normal: <b>${normal}</b></div>
        <div><span class="pie-dot pie-e"></span> Early: <b>${early}</b></div>
        <div><span class="pie-dot pie-l"></span> Late: <b>${late}</b></div>
      </div>
    </div>
  `;
}

export async function renderCare(ctx){
  const uid = ctx.user?.uid;

  if(!uid){
    ctx.screen.innerHTML = `
      <section class="card" style="padding:16px">
        <div style="font-weight:900;font-size:24px">Period</div>
        <div class="tiny muted" style="margin-top:6px">Sign in to use your tracker.</div>
      </section>
    `;
    return;
  }

  // Keep state consistent with history (if an open episode exists)
  await healPeriodStateFromHistory(uid);

  const today = getTodayKey(new Date());

  const state = await getPeriodState(uid);
  const periods = await listPeriods(uid, 12);

  const openEpisode = periods.find(p => p?.endDayKey == null) || null;
  const active = !!state?.active || !!openEpisode;

  const startKey = state?.periodStartDayKey || openEpisode?.startDayKey || null;

  // newest known start for cycle-day calculations
  const lastStart = periods?.[0]?.startDayKey || startKey || null;

  const cycleDay  = lastStart ? (diffDays(lastStart, today) + 1) : null;
  const periodDay = (active && startKey) ? (diffDays(startKey, today) + 1) : null;

  // Averages from completed episodes
  const completed = periods.filter(p => p?.startDayKey && p?.endDayKey);
  const lengths = completed.map(p => diffDays(p.startDayKey, p.endDayKey) + 1);
  const avgPeriodLen = average(lengths);

  // Cycle length: difference between consecutive starts (DESC list: newest -> older)
  const starts = periods.map(p => p?.startDayKey).filter(Boolean);
  const cycleLens = [];
  for(let i=0; i<starts.length-1; i++){
    cycleLens.push(diffDays(starts[i+1], starts[i])); // positive
  }
  const avgCycleLen = Math.round(average(cycleLens) || DEFAULT_CYCLE_DAYS);

  // TWO predictions:
  // 1) Typical range (21–35 days, plus average ~28)
  // 2) Personalized based on your average starts (fallback 28)
  const baseStart = lastStart;
  const typicalRange = baseStart
    ? `${addDays(baseStart, CYCLE_MIN_DAYS)} → ${addDays(baseStart, CYCLE_MAX_DAYS)}`
    : null;
  const typicalAvg = baseStart ? addDays(baseStart, DEFAULT_CYCLE_DAYS) : null;
  const personalizedNext = baseStart ? addDays(baseStart, avgCycleLen) : null;

  // Expected end date while active: start + DEFAULT_PERIOD_DAYS - 1 (Day 1 counts as first day)
  const expectedEnd = (active && startKey)
    ? addDays(startKey, DEFAULT_PERIOD_DAYS - 1)
    : null;

  // “Last tag” badge (from most recent completed)
  const lastCompleted = completed[0] || null;
  const lastTag =
    lastCompleted?.finishedEarly ? "Early" :
    lastCompleted?.finishedLate ? "Late" :
    lastCompleted ? "Normal" : null;

  // Auto prompt when on/after day 6 (once/day per startKey)
  const shouldPromptAutoEnd = active && startKey && periodDay && periodDay >= DEFAULT_PERIOD_DAYS;

  // History counts for pie chart
  const normalCount = completed.filter(p => !p.finishedEarly && !p.finishedLate).length;
  const earlyCount  = completed.filter(p => !!p.finishedEarly).length;
  const lateCount   = completed.filter(p => !!p.finishedLate).length;

  ctx.screen.innerHTML = `
    <section class="card" style="padding:16px">
      <div class="row between" style="align-items:flex-start; gap:12px; flex-wrap:wrap">
        <div>
          <div style="font-weight:900;font-size:24px">Period</div>
          <div class="tiny muted" style="margin-top:6px">Private tracker. Not medical advice.</div>
        </div>

        ${lastTag ? `
          <div class="pill" aria-label="Last period tag">Last: <b>${lastTag}</b></div>
        ` : ``}
      </div>

      <!-- Two boxes side-by-side -->
      <div class="row gap" style="margin-top:14px; align-items:stretch; flex-wrap:wrap">
        <!-- LEFT: Today -->
        <div class="panel" style="flex:1; min-width:280px">
          <div style="font-weight:850">Today</div>

          <div class="tiny muted" style="margin-top:8px; line-height:1.65">
            ${active
              ? `On period • Day <b>${periodDay ?? "—"}</b> of <b>${DEFAULT_PERIOD_DAYS}</b>${avgPeriodLen ? ` • Your avg length ${avgPeriodLen.toFixed(0)} days` : ""}`
              : `${cycleDay ? `Cycle day <b>${cycleDay}</b>` : "No history yet"}`
            }
            ${expectedEnd ? `<div>Expected end (if typical): <b>${expectedEnd}</b></div>` : ""}

            <div style="margin-top:8px">
              <div><b>Next cycle</b></div>
              ${typicalRange ? `<div>Typical range (21–35 days): <b>${typicalRange}</b></div>` : `<div>Typical range (21–35 days): <span class="muted">—</span></div>`}
              ${typicalAvg ? `<div>Typical average (~28 days): <b>${typicalAvg}</b></div>` : `<div>Typical average (~28 days): <span class="muted">—</span></div>`}
              ${personalizedNext ? `<div>Your expected (from your history): <b>${personalizedNext}</b></div>` : `<div>Your expected (from your history): <span class="muted">—</span></div>`}
            </div>
          </div>
        </div>

        <!-- RIGHT: Progress / Actions -->
        <div class="panel" style="flex:1; min-width:280px">
          <div style="font-weight:850">Period progress</div>
          <div class="tiny muted" style="margin-top:8px; line-height:1.6">
            ${active
              ? `Day <b>${periodDay ?? "—"}</b> of <b>${DEFAULT_PERIOD_DAYS}</b><br/>Auto check-in appears on/after day <b>${DEFAULT_PERIOD_DAYS}</b>.`
              : `Not currently tracking.<br/>Tap start when bleeding begins (Day 1).`
            }
          </div>

          <div class="row" style="margin-top:12px; flex-wrap:wrap">
            ${active ? `
              <button class="btn primary" id="btnEndNormal" type="button">Ended today</button>
              <button class="btn" id="btnEndEarly" type="button">Ended early</button>
              <button class="btn" id="btnEndLate" type="button">Ended late</button>
            ` : `
              <button class="btn primary" id="btnStartToday" type="button">Start period today</button>
            `}
          </div>

          <div class="guide" style="margin-top:12px">
            <div class="tiny muted">
              How to use: Start on day 1. When bleeding ends, tap “Ended today”.
              Use Early/Late if it ended earlier/later than your usual.
            </div>
          </div>
        </div>
      </div>

      <!-- Pie chart -->
      <div class="panel" style="margin-top:12px">
        <div style="font-weight:850">History summary</div>
        <div class="tiny muted" style="margin-top:8px">Normal vs Early vs Late (from completed logs).</div>
        <div style="margin-top:10px">
          ${pieSvg({ normal: normalCount, early: earlyCount, late: lateCount, size: 120 })}
        </div>
      </div>

      <!-- What to eat -->
      <div class="panel" style="margin-top:12px">
        <div style="font-weight:850">What to eat (simple meal ideas)</div>
        <div class="tiny muted" style="margin-top:8px; line-height:1.55">
          <div style="font-weight:800; margin-top:4px">Breakfast</div>
          <ul style="margin:8px 0 0; padding-left:18px">
            <li>Oats + banana/berries + nuts/seeds</li>
            <li>Eggs + whole-grain toast + fruit</li>
            <li>Yogurt + fruit + granola (if dairy feels ok for you)</li>
          </ul>

          <div style="font-weight:800; margin-top:12px">Lunch</div>
          <ul style="margin:8px 0 0; padding-left:18px">
            <li>Rice/quinoa + chicken/tofu/beans + leafy greens</li>
            <li>Soup + whole-grain bread + side salad</li>
            <li>Tuna/egg/chickpea salad wrap</li>
          </ul>

          <div style="font-weight:800; margin-top:12px">Dinner</div>
          <ul style="margin:8px 0 0; padding-left:18px">
            <li>Salmon/chicken/tofu + vegetables + sweet potato</li>
            <li>Stir-fry veggies + tofu/egg + rice</li>
            <li>Lentil/bean stew + greens</li>
          </ul>

          <div style="font-weight:800; margin-top:12px">Try to limit (if they worsen symptoms)</div>
          <ul style="margin:8px 0 0; padding-left:18px">
            <li>Very salty foods (can increase bloating)</li>
            <li>High-sugar snacks (energy crashes)</li>
            <li>Too much caffeine (sleep/dehydration)</li>
          </ul>
        </div>
      </div>

      <!-- Pain -->
      <div class="panel" style="margin-top:12px">
        <div style="font-weight:850">Pain types & how to ease</div>
        <div style="margin-top:10px; line-height:1.65">
          <div style="font-weight:800">1) Cramps (lower belly)</div>
          <ul style="margin:6px 0 0; padding-left:18px">
            <li>Heat: hot water bottle/heating pad or warm bath</li>
            <li>Gentle movement: walking/stretching</li>
            <li>If safe for you: OTC pain relief may help (follow label; ask clinician if unsure)</li>
          </ul>

          <div style="font-weight:800; margin-top:12px">2) Back ache</div>
          <ul style="margin:6px 0 0; padding-left:18px">
            <li>Heat on lower back</li>
            <li>Light stretches, short walks</li>
          </ul>

          <div style="font-weight:800; margin-top:12px">3) Headache / fatigue</div>
          <ul style="margin:6px 0 0; padding-left:18px">
            <li>Hydrate + small balanced meals</li>
            <li>Sleep/rest; reduce caffeine late in day</li>
          </ul>

          <div style="font-weight:800; margin-top:12px">4) Bloating</div>
          <ul style="margin:6px 0 0; padding-left:18px">
            <li>More water, lighter meals</li>
            <li>Reduce salty foods if you notice swelling/bloat</li>
          </ul>

          <div class="tiny muted" style="margin-top:10px">
            If pain is severe, unusual, or stops you from normal life, consider medical advice.
          </div>
        </div>
      </div>

      <!-- Recent history -->
      <div style="margin-top:18px">
        <div style="font-weight:900;font-size:20px">Recent history</div>
        <div class="tiny muted" style="margin-top:4px">Stored under your account only.</div>

        <div style="margin-top:12px">
          ${periods.slice(0,6).map(p => `
            <div class="panel" style="margin-bottom:12px">
              <div class="tiny muted">
                Start: ${p.startDayKey || "-"} • End: ${p.endDayKey || (p.endDayKey===null ? "—" : "-")}
              </div>
              <div style="margin-top:6px">
                ${p.endDayKey ? `Length: ${diffDays(p.startDayKey, p.endDayKey)+1} days` : `In progress`}
                ${p.finishedEarly ? " • tagged: early" : ""}
                ${p.finishedLate ? " • tagged: late" : ""}
              </div>
            </div>
          `).join("") || `<div class="tiny muted">No history yet.</div>`}
        </div>
      </div>
    </section>
  `;

  // Force re-render on same route (so buttons flip instantly)
  function refreshPage(){
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  }

  document.getElementById("btnStartToday")?.addEventListener("click", async () => {
    if(openEpisode) return showToast("Already in progress");
    await setPeriodToday(uid, { isOnPeriod: true });
    showToast("Period started");
    refreshPage();
  });

  async function endWithFlags(flags){
    try{
      await endPeriod(uid, { endDayKey: today, ...flags });
      refreshPage();

      // Show next expected feedback (personalized)
      if(personalizedNext){
        if(flags?.finishedEarly) showToast(`Ended early • Next expected ~ ${personalizedNext}`);
        else if(flags?.finishedLate) showToast(`Ended late • Next expected ~ ${personalizedNext}`);
        else showToast(`Marked ended • Next expected ~ ${personalizedNext}`);
      }else{
        showToast("Marked ended");
      }
    }catch(err){
      console.error(err);
      showToast("Failed to end (check console)");
    }
  }

  document.getElementById("btnEndNormal")?.addEventListener("click", () =>
    endWithFlags({ finishedEarly:false, finishedLate:false })
  );
  document.getElementById("btnEndEarly")?.addEventListener("click", () =>
    endWithFlags({ finishedEarly:true, finishedLate:false })
  );
  document.getElementById("btnEndLate")?.addEventListener("click", () =>
    endWithFlags({ finishedEarly:false, finishedLate:true })
  );

  // Auto prompt on/after day 6 (once per day per period start)
  if(shouldPromptAutoEnd){
    const promptKey = `slc_period_autoprompt_${uid}_${startKey}`;
    const lastPrompted = localStorage.getItem(promptKey);

    if(lastPrompted !== today){
      localStorage.setItem(promptKey, today);

      showTripleChoicePopup({
        title: "Period check",
        text:
          `It’s been ${DEFAULT_PERIOD_DAYS} days since you started.\n\n` +
          `Choose what fits today:\n` +
          `• Done = bleeding ended today\n` +
          `• Still bleeding = keep tracking\n` +
          `• Ended late = ended today but longer than usual`,
        primaryText: "Done",
        secondaryText: "Still bleeding",
        tertiaryText: "Ended late",
        onPrimary: async () => endWithFlags({ finishedEarly:false, finishedLate:false }),
        onSecondary: async () => showToast("Okay — still tracking"),
        onTertiary: async () => endWithFlags({ finishedEarly:false, finishedLate:true })
      });
    }
  }
}
