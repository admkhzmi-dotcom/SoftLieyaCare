const CACHE = "softlieya-v11";

const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.webmanifest",
  "./apple-touch-icon.png",

  "./config.js",
  "./main.js",
  "./router.js",
  "./ui.js",
  "./settings.js",
  "./quranMotivation.js",
  "./scheduler.js",
  "./toneEngine.js",
  "./auth.js",
  "./db.js",
  "./home.js",
  "./care.js",
  "./notes.js",
  "./quran.js",
  "./safety.js"
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).catch(()=>{})
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => (k !== CACHE ? caches.delete(k) : null)))
    )
  );
});

// Network-first for HTML/JS to avoid "Firebase not ready" + stale module mismatches
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;

  const path = url.pathname || "";

  const isHTML = path.endsWith("/") || path.endsWith("/index.html") || path.endsWith(".html");
  const isJS = path.endsWith(".js");

  if (isHTML || isJS) {
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // Cache-first for CSS/icons/assets
  e.respondWith(
    caches.match(e.request).then((cached) => cached || fetch(e.request))
  );
});
