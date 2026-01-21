const firebaseConfig = {
  apiKey: "AIzaSyAGhkQhJYk4ZU-Fmn_sj3469toPTzrWbPE",
  authDomain: "softcare-fc2d7.firebaseapp.com",
  projectId: "softcare-fc2d7",
  storageBucket: "softcare-fc2d7.firebasestorage.app",
  messagingSenderId: "741838046763",
  appId: "1:741838046763:web:2d8b49fb9e0dc6cd2ecc6e",
  measurementId: "G-C3DEFN3RLB"
};

async function loadScript(src){
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

(async () => {
  if (window.firebase?.apps?.length) {
    window.SLC = {
      app: window.firebase.app(),
      auth: window.firebase.auth(),
      db: window.firebase.firestore()
    };
    return;
  }

  await loadScript("https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js");
  await loadScript("https://www.gstatic.com/firebasejs/9.23.0/firebase-auth-compat.js");
  await loadScript("https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore-compat.js");

  window.firebase.initializeApp(firebaseConfig);

  window.SLC = {
    app: window.firebase.app(),
    auth: window.firebase.auth(),
    db: window.firebase.firestore()
  };
})().catch((err) => console.error("Firebase load failed:", err));
