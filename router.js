import { setActiveNav } from "./ui.js";
import { renderHome } from "./home.js";
import { renderCare } from "./care.js";
import { renderNotes } from "./notes.js";
import { renderSafety } from "./safety.js";

const routes = {
  home: renderHome,
  care: renderCare,
  notes: renderNotes,
  safety: renderSafety
};

function parseRoute(){
  const h = location.hash || "#/home";
  const m = h.match(/^#\/([a-zA-Z0-9_-]+)/);
  return (m?.[1] || "home").toLowerCase();
}

export function startRouter(ctx){
  function go(){
    const r = parseRoute();
    const fn = routes[r] || routes.home;
    setActiveNav(r);
    fn(ctx);
  }

  window.addEventListener("hashchange", go);
  if(!location.hash) location.hash = "#/home";
  go();

  return () => window.removeEventListener("hashchange", go);
}
