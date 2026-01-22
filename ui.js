// ui.js
let modalInitialized = false;
let popupInitialized = false;

let toastTimer = null;
let popupTimer = null;

let savedScrollY = 0;

// popup callbacks
let popupOkCb = null;
let popupSnoozeCb = null;
let popupThirdCb = null;

// Selector helper
export function $(sel){
  return document.querySelector(sel);
}

/* ===========================
  Loading overlay
=========================== */
export function showLoader(text = "Loading…"){
  const el = document.getElementById("appLoader");
  if(!el) return;
  const t = el.querySelector(".loader-text");
  if(t) t.textContent = text;
  el.classList.add("show");
  el.setAttribute("aria-busy", "true");
}

export function hideLoader(){
  const el = document.getElementById("appLoader");
  if(!el) return;
  el.classList.remove("show");
  el.setAttribute("aria-busy", "false");
}

/* Toast */
export function showToast(text){
  const el = document.getElementById("toast");
  if (!el) return;
  el.textContent = text;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 1800);
}

/* Auth error helpers (auth.js uses these) */
export function showError(message){
  const el = document.getElementById("authError");
  if (!el) return;
  el.textContent = message || "";
  el.hidden = !message;
}
export function clearError(){
  showError("");
}

/* Modal system (iOS + in-app browsers safe) */
export function initModalSystem(){
  if (modalInitialized) return;
  modalInitialized = true;

  const overlay = document.getElementById("modalOverlay");
  const closeBtn = document.getElementById("modalClose");

  function close(){
    if (!overlay) return;
    overlay.classList.remove("show");
    overlay.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
    if (savedScrollY) window.scrollTo(0, savedScrollY);
    savedScrollY = 0;
  }

  closeBtn?.addEventListener("click", close);
  closeBtn?.addEventListener("touchstart", (e) => {
    e.preventDefault();
    close();
  }, { passive: false });

  overlay?.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });
  overlay?.addEventListener("touchstart", (e) => {
    if (e.target === overlay) close();
  }, { passive: true });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });

  window.__slcCloseModal = close;
}

export function openModal({ title = "Modal", html = "" }){
  const overlay = document.getElementById("modalOverlay");
  const titleEl = document.getElementById("modalTitle");
  const bodyEl = document.getElementById("modalBody");
  if (!overlay || !titleEl || !bodyEl) return;

  savedScrollY = window.scrollY || 0;
  titleEl.textContent = title;
  bodyEl.innerHTML = html;

  overlay.classList.add("show");
  overlay.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
}

export function closeModal(){
  window.__slcCloseModal?.();
}

/* Settings modal helpers */
export function showSettingsModal(html){
  openModal({ title: "Settings", html });
}
export function hideSettingsModal(){
  closeModal();
}

/* Popup system (reminders + questions) */
export function initPopupSystem(){
  if(popupInitialized) return;
  popupInitialized = true;

  const overlay = document.getElementById("popupOverlay");
  const closeBtn = document.getElementById("popupClose");
  const okBtn = document.getElementById("popupOk");
  const snoozeBtn = document.getElementById("popupSnooze");
  const thirdBtn = document.getElementById("popupThird");

  function doClose(){
    hidePopup();
  }

  closeBtn?.addEventListener("click", doClose);
  closeBtn?.addEventListener("touchstart", (e) => {
    e.preventDefault();
    doClose();
  }, { passive:false });

  okBtn?.addEventListener("click", () => {
    const cb = popupOkCb;
    popupOkCb = null; popupSnoozeCb = null; popupThirdCb = null;
    cb ? cb() : hidePopup();
  });

  snoozeBtn?.addEventListener("click", () => {
    const cb = popupSnoozeCb;
    popupOkCb = null; popupSnoozeCb = null; popupThirdCb = null;
    cb ? cb() : hidePopup();
  });

  thirdBtn?.addEventListener("click", () => {
    const cb = popupThirdCb;
    popupOkCb = null; popupSnoozeCb = null; popupThirdCb = null;
    cb ? cb() : hidePopup();
  });

  overlay?.addEventListener("click", (e) => {
    if (e.target === overlay) doClose();
  });
}

function setPopupThirdVisible(visible){
  const thirdBtn = document.getElementById("popupThird");
  if(!thirdBtn) return;
  thirdBtn.hidden = !visible;
}

export function showPopup({ title="Notice", text="", autoCloseMs=0 }){
  const overlay = document.getElementById("popupOverlay");
  const titleEl = document.getElementById("popupTitle");
  const textEl = document.getElementById("popupText");
  const okBtn = document.getElementById("popupOk");
  const snoozeBtn = document.getElementById("popupSnooze");
  if(!overlay || !titleEl || !textEl || !okBtn || !snoozeBtn) return;

  titleEl.textContent = title;
  textEl.textContent = text;

  setPopupThirdVisible(false);

  snoozeBtn.textContent = "Snooze";
  okBtn.textContent = "Okay";

  popupSnoozeCb = () => { hidePopup(); showToast("Snoozed"); };
  popupOkCb = () => hidePopup();
  popupThirdCb = null;

  overlay.classList.add("show");
  overlay.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");

  if (popupTimer) clearTimeout(popupTimer);
  if (autoCloseMs && autoCloseMs > 0){
    popupTimer = setTimeout(() => hidePopup(), autoCloseMs);
  }
}

export function showConfirmPopup({ title="Question", text="", yesText="Yes", noText="No", onYes, onNo }){
  const overlay = document.getElementById("popupOverlay");
  const titleEl = document.getElementById("popupTitle");
  const textEl = document.getElementById("popupText");
  const okBtn = document.getElementById("popupOk");
  const snoozeBtn = document.getElementById("popupSnooze");
  if(!overlay || !titleEl || !textEl || !okBtn || !snoozeBtn) return;

  titleEl.textContent = title;
  textEl.textContent = text;

  setPopupThirdVisible(false);

  okBtn.textContent = yesText;
  snoozeBtn.textContent = noText;

  popupOkCb = () => { hidePopup(); onYes?.(); };
  popupSnoozeCb = () => { hidePopup(); onNo?.(); };
  popupThirdCb = null;

  overlay.classList.add("show");
  overlay.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
}

/**
 * 3-button popup:
 * - primary (right) = popupOk (primary style)
 * - secondary (middle) = popupThird
 * - tertiary (left) = popupSnooze
 */
export function showTripleChoicePopup({
  title = "Question",
  text = "",
  primaryText = "OK",
  secondaryText = "Maybe",
  tertiaryText = "Cancel",
  onPrimary,
  onSecondary,
  onTertiary
}){
  const overlay = document.getElementById("popupOverlay");
  const titleEl = document.getElementById("popupTitle");
  const textEl = document.getElementById("popupText");
  const okBtn = document.getElementById("popupOk");
  const snoozeBtn = document.getElementById("popupSnooze");
  const thirdBtn = document.getElementById("popupThird");
  if(!overlay || !titleEl || !textEl || !okBtn || !snoozeBtn || !thirdBtn) return;

  titleEl.textContent = title;
  textEl.textContent = text;

  setPopupThirdVisible(true);

  okBtn.textContent = primaryText;
  thirdBtn.textContent = secondaryText;
  snoozeBtn.textContent = tertiaryText;

  popupOkCb = () => { hidePopup(); onPrimary?.(); };
  popupThirdCb = () => { hidePopup(); onSecondary?.(); };
  popupSnoozeCb = () => { hidePopup(); onTertiary?.(); };

  overlay.classList.add("show");
  overlay.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
}

export function hidePopup(){
  const overlay = document.getElementById("popupOverlay");
  if(!overlay) return;
  overlay.classList.remove("show");
  overlay.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");

  setPopupThirdVisible(false);

  if (savedScrollY) window.scrollTo(0, savedScrollY);
  savedScrollY = 0;
}

/* Router expects this export */
export function setActiveNav(routeKey){
  const key = String(routeKey || "home").toLowerCase();
  document.querySelectorAll("[data-nav]").forEach(el => {
    const target = String(el.getAttribute("data-nav") || "").toLowerCase();
    const active = target === key;
    el.classList.toggle("active", active);
    if (active) el.setAttribute("aria-current", "page");
    else el.removeAttribute("aria-current");
  });
}
