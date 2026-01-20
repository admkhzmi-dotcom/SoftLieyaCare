// ui.js
let modalInitialized = false;
let toastTimer = null;
let savedScrollY = 0;

// ✅ selector helper used everywhere
export function $(sel){
  return document.querySelector(sel);
}

// Simple toast
export function showToast(text){
  const el = document.getElementById("toast");
  if (!el) return;
  el.textContent = text;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 1400);
}

// Modal system (iOS/Edge safe)
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

// Backwards compatibility (if old code calls these)
export function showSettingsModal(html){
  openModal({ title: "Settings", html });
}
export function hideSettingsModal(){
  closeModal();
}

// If your old code expects popups, keep no-op safe stubs
export function hidePopup(){
  document.getElementById("popupOverlay")?.classList.remove("show");
}