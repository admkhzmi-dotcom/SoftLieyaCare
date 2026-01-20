const CACHE = "softlieya-v2";
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./config.js",
  "./main.js",
  "./router.js",
  "./ui.js",
  "./auth.js",
  "./db.js",
  "./toneEngine.js",
  "./scheduler.js",
  "./home.js",
  "./care.js",
  "./notes.js",
  "./safety.js",
  "./settings.js",
  "./app.webmanifest",
  "./apple-touch-icon.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).catch(()=>{}));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => (k !== CACHE ? caches.delete(k) : null)))
    )
  );
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;
  e.respondWith(caches.match(e.request).then(cached => cached || fetch(e.request)));
});
