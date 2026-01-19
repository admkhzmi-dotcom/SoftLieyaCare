export function getRouteFromHash(){
  const h = window.location.hash || "#/home";
  const m = h.match(/^#\/([a-zA-Z0-9_-]+)/);
  return m ? m[1] : "home";
}

export function startRouter({onRoute}){
  function handle(){ onRoute(getRouteFromHash()); }
  window.addEventListener("hashchange", handle);
  handle();
  return () => window.removeEventListener("hashchange", handle);
}
