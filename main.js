// main.js
import { $, hidePopup, showToast, initModalSystem, openModal, closeModal } from "./ui.js";
import { startRouter } from "./router.js";
import { renderSettingsModal, bindSettingsModal, getSettings } from "./settings.js";
import { onAuth, signIn, signUp, signOut, setAuthError } from "./auth.js";
import { ensureUserDoc } from "./db.js";
import { startScheduler, stopScheduler } from "./scheduler.js";

let stopRouter = null;
let currentUser = null;

function setSignedOutUI(){
  $("#authView").hidden = false;
  $("#appView").hidden = true;
  $("#btnSignOut").hidden = true;
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
    get screen(){ return $("#screen") || $("#routeOutlet"); } // supports either id
  };
}

function openSettings(){
  // ✅ Use the global modal system (iPhone-safe)
  openModal({
    title: "Settings",
    html: renderSettingsModal()
  });

  bindSettingsModal(() => {
    // re-render current route
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  });
}

function bindUI(){
  // Init modal system once on boot (important)
  initModalSystem();

  // Safety: close modal if iOS cached weird state
  document.body.classList.remove("modal-open");
  $("#modalOverlay")?.classList.remove("show");

  // Popup actions (keep your existing popup system)
  $("#popupClose")?.addEventListener("click", hidePopup);
  $("#popupOk")?.addEventListener("click", hidePopup);
  $("#popupSnooze")?.addEventListener("click", hidePopup);

  // Settings open
  $("#btnOpenSettings")?.addEventListener("click", openSettings);

  // ❌ Remove old settings close binding (modal has its own close button)
  // $("#btnCloseSettings")?.addEventListener("click", hideSettingsModal);

  // Sign out
  $("#btnSignOut")?.addEventListener("click", async () => {
    await signOut();
  });

  // Auth forms
  $("#signInForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = e.target.email.value.trim();
    const password = e.target.password.value;
    try{
      await signIn(email, password);
    }catch(err){
      setAuthError(err?.message || "Sign in failed");
    }
  });

  $("#signUpForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = e.target.name.value.trim() || "Lieya";
    const email = e.target.email.value.trim();
    const password = e.target.password.value;
    try{
      await signUp(name, email, password);
    }catch(err){
      setAuthError(err?.message || "Sign up failed");
    }
  });
}

bindUI();

// Wait for Firebase to be ready (config.js initializes globals)
const waitFirebase = setInterval(() => {
  if(!window.SLC?.auth || !window.SLC?.db) return;
  clearInterval(waitFirebase);

  onAuth(async (user) => {
    currentUser = user || null;

    if(!user){
      setSignedOutUI();
      // optional: close settings modal if user signed out while it was open
      closeModal?.();
      return;
    }

    setSignedInUI();
    await ensureUserDoc(user.uid, user);

    if(!location.hash) location.hash = "#/home";

    if(!stopRouter) stopRouter = startRouter(ctx());

    // Start daily 9am reminder while app open
    startScheduler(() => ({ uid: currentUser?.uid || "local" }));

    // nice first-time toast
    const s = getSettings();
    if(s.toneLevel === 2) showToast("Warm mode on ✨");
  });
}, 50);