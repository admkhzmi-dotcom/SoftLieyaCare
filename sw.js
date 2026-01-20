const CACHE = "softlieya-v8"; // bump this when you deploy
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
  e.waitUntil((async () => {
    const cache = await caches.open(CACHE);

    // Add assets one-by-one so a single 404 won't break install
    await Promise.allSettled(
      ASSETS.map((url) => cache.add(url))
    );

    self.skipWaiting();
  })());
});

self.addEventListener("activate", (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map(k => (k !== CACHE ? caches.delete(k) : null)));
    self.clients.claim();
  })());
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  const url = new URL(req.url);

  // Only same-origin
  if (url.origin !== self.location.origin) return;

  const path = url.pathname;
  const isHTML = req.mode === "navigate" || path.endsWith(".html") || path.endsWith("/");

  // HTML: Network-first (so new deploys reflect)
  if (isHTML) {
    e.respondWith((async () => {
      try {
        const fresh = await fetch(req);
        const cache = await caches.open(CACHE);
        cache.put(req, fresh.clone());
        return fresh;
      } catch {
        const cached = await caches.match(req);
        return cached || caches.match("./index.html");
      }
    })());
    return;
  }

  // Static assets: Stale-while-revalidate
  e.respondWith((async () => {
    const cached = await caches.match(req);
    const cache = await caches.open(CACHE);

    const fetchPromise = fetch(req)
      .then((res) => {
        if (res && res.ok) cache.put(req, res.clone());
        return res;
      })
      .catch(() => null);

    return cached || (await fetchPromise) || new Response("", { status: 504 });
  })());
});
