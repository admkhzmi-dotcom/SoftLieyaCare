// ui.js
let modalInitialized = false;
let toastTimer = null;

export function showToast(text){
  const el = document.getElementById("toast");
  if (!el) return;
  el.textContent = text;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 1400);
}

export function initModalSystem(){
  if (modalInitialized) return;
  modalInitialized = true;

  const overlay = document.getElementById("modalOverlay");
  const closeBtn = document.getElementById("modalClose");

  function close(){
    overlay.classList.remove("show");
    overlay.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
  }

  // Close button
  closeBtn?.addEventListener("click", close);

  // Tap outside closes (important on iPhone)
  overlay?.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });

  // iOS sometimes prefers touchstart for overlays
  overlay?.addEventListener("touchstart", (e) => {
    if (e.target === overlay) close();
  }, { passive: true });

  // Escape key (desktop)
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });

  // expose for other modules
  window.__slcCloseModal = close;
}

export function openModal({ title = "Modal", html = "" }){
  const overlay = document.getElementById("modalOverlay");
  const titleEl = document.getElementById("modalTitle");
  const bodyEl  = document.getElementById("modalBody");

  if (!overlay || !titleEl || !bodyEl) return;

  titleEl.textContent = title;
  bodyEl.innerHTML = html;

  overlay.classList.add("show");
  overlay.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
}

export function closeModal(){
  window.__slcCloseModal?.();
}