// ui.js
let modalInitialized = false;
let toastTimer = null;
let savedScrollY = 0;

// Selector helper used throughout your app
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

    // Restore scroll (prevents iOS jump)
    if (savedScrollY) window.scrollTo(0, savedScrollY);
    savedScrollY = 0;
  }

  // Close button: click + touchstart (important on iPhone/WhatsApp/Edge)
  closeBtn?.addEventListener("click", close);
  closeBtn?.addEventListener("touchstart", (e) => {
    e.preventDefault();
    close();
  }, { passive: false });

  // Tap outside closes
  overlay?.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });
  overlay?.addEventListener("touchstart", (e) => {
    if (e.target === overlay) close();
  }, { passive: true });

  // Escape key (desktop)
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });

  // Expose for modules that want to close programmatically
  window.__slcCloseModal = close;
}

export function openModal({ title = "Modal", html = "" }){
  const overlay = document.getElementById("modalOverlay");
  const titleEl = document.getElementById("modalTitle");
  const bodyEl  = document.getElementById("modalBody");

  if (!overlay || !titleEl || !bodyEl) return;

  // Save scroll (iOS) then lock
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

/* For older code compatibility */
export function showSettingsModal(html){
  openModal({ title: "Settings", html });
}
export function hideSettingsModal(){
  closeModal();
}

/* Popup close helper (used by your main.js) */
export function hidePopup(){
  document.getElementById("popupOverlay")?.classList.remove("show");
}

/* Router expects this export: setActiveNav(routeKey) */
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
// Auth error helpers (safe even if element doesn't exist)
export function setError(message){
  const el = document.getElementById("authError");
  if (!el) return;
  el.textContent = message || "";
  el.hidden = !message;
}

export function clearError(){
  setError("");
}
