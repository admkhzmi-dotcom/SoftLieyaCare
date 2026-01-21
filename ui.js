// ui.js
let modalInitialized = false;
let toastTimer = null;
let savedScrollY = 0;

// Selector helper
export function $(sel){
  return document.querySelector(sel);
}

/* Toast */
export function showToast(text){
  const el = document.getElementById("toast");
  if (!el) return;
  el.textContent = text;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 1400);
}

/* Auth error helpers */
export function showError(message){
  const el = document.getElementById("authError");
  if (!el) return;
  el.textContent = message || "";
  el.hidden = !message;
}
export function clearError(){
  showError("");
}

/* Modal system (Settings) */
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
  const bodyEl  = document.getElementById("modalBody");
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

/* Backward-compat helpers used by main.js */
export function showSettingsModal(html){
  openModal({ title: "Settings", html });
}
export function hideSettingsModal(){
  closeModal();
}

/* Popup (Scheduler) */
export function showPopup({ title="Reminder", text="", body="", okText="Okay", snoozeText="Snooze" } = {}){
  const overlay = document.getElementById("popupOverlay");
  const titleEl = document.getElementById("popupTitle");
  const bodyEl  = document.getElementById("popupBody");
  const okBtn   = document.getElementById("popupOk");
  const snoozeBtn = document.getElementById("popupSnooze");
  if(!overlay) return;

  if(titleEl) titleEl.textContent = title;

  if(bodyEl){
    if(body) bodyEl.innerHTML = body;
    else bodyEl.textContent = text || "";
  }

  if(okBtn) okBtn.textContent = okText;
  if(snoozeBtn) snoozeBtn.textContent = snoozeText;

  overlay.classList.add("show");
  overlay.setAttribute("aria-hidden","false");
}

export function hidePopup(){
  const overlay = document.getElementById("popupOverlay");
  overlay?.classList.remove("show");
  overlay?.setAttribute("aria-hidden","true");
}

/* Router expects this export */
export function setActiveNav(routeKey){
  const key = String(routeKey || "home").toLowerCase();
  document.querySelectorAll("[data-nav]").forEach(el => {
    const target = String(el.getAttribute("data-nav") || "").toLowerCase();
    const active = target === key;
    el.classList.toggle("active", active);
    if(active) el.setAttribute("aria-current","page");
    else el.removeAttribute("aria-current");
  });
}
