// main.js
import {
  $,
  showSettingsModal,
  showToast,
  initModalSystem,
  initPopupSystem,
  showConfirmPopup,
  showLoader,
  hideLoader
} from "./ui.js";
import { startRouter } from "./router.js";
import { renderSettingsModal, bindSettingsModal, getSettings } from "./settings.js";
import { onAuth, signIn, signUp, signOut, setAuthError } from "./auth.js";
import { ensureUserDoc, getPeriodState, setPeriodToday } from "./db.js";
import { startScheduler, stopScheduler } from "./scheduler.js";
import { getTodayKey } from "./quranMotivation.js";

let stopRouter = null;
let currentUser = null;

showLoader("Starting…");

function setSignedOutUI(){
  $("#authView").hidden = false;
  $("#appView").hidden = true;
  $("#btnSignOut").hidden = true;
  $("#btnBack").hidden = true;
  if(stopRouter) stopRouter();
  stopRouter = null;
  stopScheduler();
}

function setSignedInUI(){
  $("#authView").hidden = true;
  $("#appView").hidden = false;
  $("#btnSignOut").hidden = false;
}

function ctx(){
  return {
    get user(){ return currentUser; },
    get screen(){ return $("#screen"); }
  };
}

function openSettings(){
  showSettingsModal(renderSettingsModal());
  bindSettingsModal(() => {
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  });
}

function updateBackButton(){
  const btn = $("#btnBack");
  if(!btn) return;
  const r = (location.hash || "#/home").replace("#/","");
  btn.hidden = (r === "home" || r === "" || r.startsWith("home"));
}

function initAuthSwipe(){
  const track = document.getElementById("authTrack");
  const swipe = document.getElementById("authSwipe");
  const tabIn = document.getElementById("authTabIn");
  const tabUp = document.getElementById("authTabUp");
  if(!track || !swipe || !tabIn || !tabUp) return;

  let index = 0;
  let startX = 0;
  let currentDX = 0;
  let dragging = false;

  function setIndex(next){
    index = Math.max(0, Math.min(1, next));
    track.classList.remove("dragging");
    track.style.transform = `translateX(${-50 * index}%)`;
    tabIn.classList.toggle("active", index === 0);
    tabUp.classList.toggle("active", index === 1);
    tabIn.setAttribute("aria-selected", String(index === 0));
    tabUp.setAttribute("aria-selected", String(index === 1));
  }

  tabIn.addEventListener("click", () => setIndex(0));
  tabUp.addEventListener("click", () => setIndex(1));

  function onDown(clientX){
    dragging = true;
    startX = clientX;
    currentDX = 0;
    track.classList.add("dragging");
  }
  function onMove(clientX){
    if(!dragging) return;
    currentDX = clientX - startX;
    const width = swipe.getBoundingClientRect().width || 1;
    const pct = (currentDX / width) * 50;
    track.style.transform = `translateX(${(-50 * index) + pct}%)`;
  }
  function onUp(){
    if(!dragging) return;
    dragging = false;
    const width = swipe.getBoundingClientRect().width || 1;
    const threshold = width * 0.18;
    if(currentDX < -threshold) setIndex(index + 1);
    else if(currentDX > threshold) setIndex(index - 1);
    else setIndex(index);
  }

  // Touch
  swipe.addEventListener("touchstart", (e) => onDown(e.touches[0].clientX), {passive:true});
  swipe.addEventListener("touchmove", (e) => onMove(e.touches[0].clientX), {passive:true});
  swipe.addEventListener("touchend", onUp);

  // Mouse
  swipe.addEventListener("mousedown", (e) => onDown(e.clientX));
  window.addEventListener("mousemove", (e) => onMove(e.clientX));
  window.addEventListener("mouseup", onUp);

  setIndex(0);
}

function bindUI(){
  initModalSystem();
  initPopupSystem();
  initAuthSwipe();

  $("#btnOpenSettings")?.addEventListener("click", openSettings);
  $("#btnBack")?.addEventListener("click", () => {
    if(location.hash && location.hash !== "#/home") location.hash = "#/home";
    else window.history.back();
  });

  $("#btnSignOut")?.addEventListener("click", async () => {
    showLoader("Signing out…");
    try{ await signOut(); }
    finally{ hideLoader(); }
  });

  $("#signInForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = e.target.email.value.trim();
    const password = e.target.password.value;

    showLoader("Signing in…");
    try{
      await signIn(email, password);
    }catch(err){
      setAuthError(err?.message || "Sign in failed");
      hideLoader();
    }
  });

  $("#signUpForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = e.target.name.value.trim() || "Lieya";
    const email = e.target.email.value.trim();
    const password = e.target.password.value;

    showLoader("Creating account…");
    try{
      await signUp(name, email, password);
    }catch(err){
      setAuthError(err?.message || "Sign up failed");
      hideLoader();
    }
  });

  window.addEventListener("hashchange", updateBackButton);
}
bindUI();

// ✅ NEW: wait firebase using your config.js promise
(async () => {
  try{
    await window.SLC.ready; // from config.js

    onAuth(async (user) => {
      currentUser = user || null;

      if(!user){
        setSignedOutUI();
        hideLoader();
        return;
      }

      setSignedInUI();

      try{
        showLoader("Loading your account…");
        await ensureUserDoc(user.uid, user);

        if(!location.hash) location.hash = "#/home";
        if(!stopRouter) stopRouter = startRouter(ctx());
        updateBackButton();

        startScheduler(() => ({ uid: currentUser?.uid || null }));

        const s = getSettings();
        if(s.toneLevel === 2) showToast("Warm mode on");

        // Daily period check-in (only if not currently on period)
        (async function maybeAskPeriodToday(){
          const uid = currentUser?.uid;
          if(!uid) return;

          const today = getTodayKey(new Date());
          const lsKey = `slc_period_asked_${uid}`;
          const lastAskedLS = localStorage.getItem(lsKey);

          const state = await getPeriodState(uid);
          const active = !!state?.active;
          const lastAskedFS = state?.lastAskedDayKey;

          if(active) return;
          if(lastAskedLS === today || lastAskedFS === today) return;

          showConfirmPopup({
            title: "Quick check-in",
            text: "Are you having your period today?",
            yesText: "Yes",
            noText: "No",
            onYes: async () => {
              localStorage.setItem(lsKey, today);
              await setPeriodToday(uid, { isOnPeriod: true });
              location.hash = "#/care";
            },
            onNo: async () => {
              localStorage.setItem(lsKey, today);
              await setPeriodToday(uid, { isOnPeriod: false });
            }
          });
        })();

      }catch(err){
        console.error(err);
        showToast("Something went wrong (check console)");
      }finally{
        hideLoader();
      }
    });

  }catch(err){
    console.error("Firebase ready failed:", err);
    showToast("Firebase failed to start");
    hideLoader();
  }
})();
