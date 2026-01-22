// router.js
import { setActiveNav, showLoader, hideLoader } from "./ui.js";
import { renderHome } from "./home.js";
import { renderCare } from "./care.js";
import { renderNotes } from "./notes.js";
import { renderSafety } from "./safety.js";
import { renderQuran } from "./quran.js";

const routes = {
  home: renderHome,
  care: renderCare,
  notes: renderNotes,
  quran: renderQuran,
  safety: renderSafety
};

function parseRoute(){
  const h = location.hash || "#/home";
  const m = h.match(/^#\/([a-zA-Z0-9_-]+)/);
  return (m?.[1] || "home").toLowerCase();
}

function routeLabel(r){
  if(r === "home") return "Loading Home…";
  if(r === "care") return "Loading Period…";
  if(r === "notes") return "Loading Notes…";
  if(r === "quran") return "Loading Qur’an…";
  if(r === "safety") return "Loading Safety…";
  return "Loading…";
}

export function startRouter(ctx){
  async function go(){
    const r = parseRoute();
    const fn = routes[r] || routes.home;

    setActiveNav(r);
    showLoader(routeLabel(r));

    try{
      await fn(ctx);
    }catch(err){
      console.error(err);
      ctx.screen.innerHTML = `
        <section class="card" style="padding:16px">
          <div style="font-weight:900;font-size:22px">Something went wrong</div>
          <div class="tiny muted" style="margin-top:6px">Check Console for details.</div>
        </section>
      `;
    }finally{
      hideLoader();
    }
  }

  window.addEventListener("hashchange", go);
  if(!location.hash) location.hash = "#/home";
  go();
  return () => window.removeEventListener("hashchange", go);
}
