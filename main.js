import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";

import { signUp, signIn, signOutUser } from "./auth.js";
import {
  ensureUserDoc, getUserBundle, touchLastSeen,
  addMealLog, addSleepLog, addNote, getRecent,
  updatePrefs, updateStates, updateProfile
} from "./db.js";

import { startRouter } from "./router.js";
import {
  $, setActiveNav, showToast, showError, clearError,
  showPopup, hidePopup, showSettingsModal, hideSettingsModal
} from "./ui.js";

import { buildTone } from "./toneEngine.js";
import { startScheduler, snoozeScheduler } from "./scheduler.js";

import { renderHome, bindHome } from "./home.js";
import { renderCare, bindCare } from "./care.js";
import { renderNotes, bindNotes } from "./notes.js";
import { renderSafety, bindSafety } from "./safety.js";
import { renderSettings } from "./settings.js";

const firebaseConfig = window.__SLC_FIREBASE_CONFIG__;
if (!firebaseConfig || !firebaseConfig.projectId) {
  showError("Setup error: config.js is missing or invalid.");
  throw new Error("Missing Firebase config");
}

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const ctx = {
  user: null,
  profile: null,
  prefs: null,
  modes: null,
  tone: null,
  actions: {}
};

let stopRouter = null;
let stopScheduler = null;

function setSignedOutUI(){
  $("#authView").hidden = false;
  $("#appView").hidden = true;
  $("#btnSignOut").hidden = true;

  if (stopRouter) stopRouter();
  if (stopScheduler) stopScheduler();
  stopRouter = null;
  stopScheduler = null;
}

function setSignedInUI(){
  $("#authView").hidden = true;
  $("#appView").hidden = false;
  $("#btnSignOut").hidden = false;
}

function refreshTone(){
  ctx.tone = buildTone(ctx.prefs, ctx.profile, ctx.modes);
}

function buildActions(){
  ctx.actions = {
    async addMeal(mealType, size, note){
      await addMealLog(db, ctx.user.uid, mealType, size, note);
    },
    async addSleep(startLocal, endLocal, quality, note){
      const startISO = new Date(startLocal).toISOString();
      const endISO = new Date(endLocal).toISOString();
      await addSleepLog(db, ctx.user.uid, startISO, endISO, quality, note);
    },
    async addNote(mood, text){
      await addNote(db, ctx.user.uid, mood, text);
    },
    async getRecent(sub, n){
      return await getRecent(db, ctx.user.uid, sub, n);
    },
    async updateStates(states){
      await updateStates(db, ctx.user.uid, states);
    },
    async saveAllSettings(profile, prefs){
      await updateProfile(db, ctx.user.uid, { displayName: profile.displayName });
      await updatePrefs(db, ctx.user.uid, prefs);
    },
    refreshTone,
    showGentlePopup(title, text){
      showPopup({ title, text });
    },
    renderRoute(route){
      renderRoute(route);
    }
  };
}

async function bootstrapUser(user){
  ctx.user = user;
  await ensureUserDoc(db, user);

  const bundle = await getUserBundle(db, user.uid);
  ctx.profile = bundle.profile;
  ctx.prefs = bundle.preferences;
  ctx.modes = bundle.states;

  refreshTone();
  buildActions();
  await touchLastSeen(db, user.uid);
}

function renderRoute(route){
  const screen = $("#screen");
  const r = route || "home";
  setActiveNav(r);

  const views = {
    home: async () => { screen.innerHTML = renderHome(ctx); bindHome(screen); },
    care: async () => { screen.innerHTML = renderCare(ctx); bindCare(ctx, screen); },
    notes: async () => { screen.innerHTML = renderNotes(ctx); await bindNotes(ctx, screen); },
    safety: async () => { screen.innerHTML = renderSafety(ctx); bindSafety(ctx, screen); }
  };

  (views[r] || views.home)();
}

function wireShell(){
  $("#popupClose")?.addEventListener("click", hidePopup);
  $("#popupOk")?.addEventListener("click", ()=>{ hidePopup(); showToast("Okay."); });
  $("#popupSnooze")?.addEventListener("click", ()=>{
    snoozeScheduler(25);
    hidePopup();
    showToast("Snoozed 25 minutes.");
  });

  $("#btnOpenSettings")?.addEventListener("click", ()=>{
    if(!ctx.user) return;
    showSettingsModal(renderSettings(ctx));

    setTimeout(()=>{
      const form = document.querySelector("#settingsForm");
      if(!form) return;

      form.addEventListener("submit", async (e)=>{
        e.preventDefault();
        const fd = new FormData(form);

        ctx.profile.displayName = String(fd.get("displayName") || "Lieya").trim() || "Lieya";
        ctx.prefs.toneLevel = Number(fd.get("toneLevel") ?? 1);
        ctx.prefs.remindersEnabled = String(fd.get("remindersEnabled")) === "true";
        ctx.prefs.quietHours = { start: String(fd.get("quietStart")||"22:30"), end: String(fd.get("quietEnd")||"08:30") };
        ctx.prefs.dailyPopupLimit = Number(fd.get("dailyPopupLimit") ?? 8);
        ctx.prefs.popupCooldownMinutes = Number(fd.get("popupCooldownMinutes") ?? 45);

        await ctx.actions.saveAllSettings(ctx.profile, ctx.prefs);
        refreshTone();
        hideSettingsModal();
        showToast("Saved.");
      });
    }, 0);
  });

  $("#btnCloseSettings")?.addEventListener("click", hideSettingsModal);

  $("#btnSignOut")?.addEventListener("click", async ()=>{ await signOutUser(auth); });
}

function wireAuth(){
  $("#signInForm")?.addEventListener("submit", async (e)=>{
    e.preventDefault();
    clearError();
    const fd = new FormData(e.target);
    try{
      await signIn(auth, fd.get("email"), fd.get("password"));
    }catch(err){
      showError(err?.message || "Sign in failed.");
    }
  });

  $("#signUpForm")?.addEventListener("submit", async (e)=>{
    e.preventDefault();
    clearError();
    const fd = new FormData(e.target);
    try{
      await signUp(auth, fd.get("name"), fd.get("email"), fd.get("password"));
      showToast("Account created.");
    }catch(err){
      showError(err?.message || "Sign up failed.");
    }
  });
}

wireShell();
wireAuth();

onAuthStateChanged(auth, async (user)=>{
  if(!user){
    setSignedOutUI();
    return;
  }

  setSignedInUI();
  await bootstrapUser(user);

  if(!location.hash) location.hash = "#/home";

  if(stopRouter) stopRouter();
  stopRouter = startRouter({ onRoute: renderRoute });

  if(stopScheduler) stopScheduler();
  stopScheduler = startScheduler(ctx);

  showToast(`Hi ${ctx.profile.displayName}.`);
});
