const CACHE = "softlieya-v3"; // bump version to force refresh
const ASSETS = [
  // The root page (GitHub Pages entry)
  "./",

  // App files live in /SoftLieyaCare/ folder
  "./SoftLieyaCare/index.html",
  "./SoftLieyaCare/styles.css",
  "./SoftLieyaCare/config.js",
  "./SoftLieyaCare/main.js",
  "./SoftLieyaCare/router.js",
  "./SoftLieyaCare/ui.js",
  "./SoftLieyaCare/auth.js",
  "./SoftLieyaCare/db.js",
  "./SoftLieyaCare/toneEngine.js",
  "./SoftLieyaCare/scheduler.js",
  "./SoftLieyaCare/home.js",
  "./SoftLieyaCare/care.js",
  "./SoftLieyaCare/notes.js",
  "./SoftLieyaCare/safety.js",
  "./SoftLieyaCare/settings.js",
  "./SoftLieyaCare/app.webmanifest",
  "./SoftLieyaCare/apple-touch-icon.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(ASSETS))
      .catch(() => {})
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => (k !== CACHE ? caches.delete(k) : null)))
    )
  );
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;

  e.respondWith(
    caches.match(e.request).then((cached) => cached || fetch(e.request))
  );
});
