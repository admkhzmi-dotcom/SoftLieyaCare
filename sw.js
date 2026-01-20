const CACHE = "softlieya-v5";
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
  "./safety.js",
  "./settingsView.js"
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

  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
