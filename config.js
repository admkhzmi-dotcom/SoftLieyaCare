// config.js
// Loads Firebase compat builds dynamically (works on GitHub Pages / static hosting)
// and exposes window.SLC = { app, auth, db, ready }

const firebaseConfig = {
  apiKey: "AIzaSyAGhkQhJYk4ZU-Fmn_sj3469toPTzrWbPE",
  authDomain: "softcare-fc2d7.firebaseapp.com",
  projectId: "softcare-fc2d7",
  storageBucket: "softcare-fc2d7.firebasestorage.app",
  messagingSenderId: "741838046763",
  appId: "1:741838046763:web:2d8b49fb9e0dc6cd2ecc6e",
  measurementId: "G-C3DEFN3RLB"
};

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      // already appended; wait for it to finish if needed
      if (existing.dataset.loaded === "1") return resolve();
      existing.addEventListener("load", resolve, { once: true });
      existing.addEventListener("error", reject, { once: true });
      return;
    }

    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.onload = () => {
      s.dataset.loaded = "1";
      resolve();
    };
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

async function initFirebase() {
  // If Firebase already exists (another script loaded it), just reuse it.
  if (window.firebase?.apps?.length) {
    const app = window.firebase.app();
    window.SLC = window.SLC || {};
    window.SLC.app = app;
    window.SLC.auth = window.firebase.auth();
    window.SLC.db = window.firebase.firestore();
    return window.SLC;
  }

  // Load compat SDKs (v9 compat)
  await loadScript("https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js");
  await loadScript("https://www.gstatic.com/firebasejs/9.23.0/firebase-auth-compat.js");
  await loadScript("https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore-compat.js");

  // Initialize once
  if (!window.firebase.apps.length) {
    window.firebase.initializeApp(firebaseConfig);
  }

  const app = window.firebase.app();

  // Expose a single global used by the rest of the app
  window.SLC = window.SLC || {};
  window.SLC.app = app;
  window.SLC.auth = window.firebase.auth();
  window.SLC.db = window.firebase.firestore();

  return window.SLC;
}

// Optional "ready" promise: lets other scripts do `await window.SLC.ready`
window.SLC = window.SLC || {};
window.SLC.ready = initFirebase().catch((err) => {
  console.error("Firebase load failed:", err);
  throw err;
});
