export function $(sel, root=document){ return root.querySelector(sel); }
export function $all(sel, root=document){ return [...root.querySelectorAll(sel)]; }

let toastTimer = null;
export function showToast(msg, ms=2200){
  const el = $("#toast");
  if(!el) return;
  el.textContent = msg;
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=>{ el.hidden = true; }, ms);
}

export function setActiveNav(route){
  $all(".nav-item").forEach(a => a.classList.toggle("active", a.dataset.route === route));
}

export function showError(msg){
  const el = $("#authError");
  if(!el) return;
  el.textContent = msg;
  el.hidden = false;
}
export function clearError(){
  const el = $("#authError");
  if(!el) return;
  el.textContent = "";
  el.hidden = true;
}

export function showPopup({title, text}){
  $("#popupTitle").textContent = title ?? "A gentle check-in";
  $("#popupText").textContent = text ?? "";
  $("#popupOverlay").hidden = false;
}
export function hidePopup(){ $("#popupOverlay").hidden = true; }

export function showSettingsModal(html){
  $("#settingsBody").innerHTML = html;
  $("#settingsOverlay").hidden = false;
}
export function hideSettingsModal(){
  $("#settingsOverlay").hidden = true;
}
