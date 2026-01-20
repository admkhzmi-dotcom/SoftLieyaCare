import { $, showSettingsModal, hideSettingsModal, hidePopup, showToast } from "./ui.js";
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
    get screen(){ return $("#screen"); }
  };
}

function openSettings(){
  showSettingsModal(renderSettingsModal());
  bindSettingsModal(() => {
    // re-render current route
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  });
}

function bindUI(){
  $("#popupClose")?.addEventListener("click", hidePopup);
  $("#popupOk")?.addEventListener("click", hidePopup);
  $("#popupSnooze")?.addEventListener("click", hidePopup);

  $("#btnOpenSettings")?.addEventListener("click", openSettings);
  $("#btnCloseSettings")?.addEventListener("click", hideSettingsModal);

  $("#btnSignOut")?.addEventListener("click", async () => {
    await signOut();
  });

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
