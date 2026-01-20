window.SLC = window.SLC || {};

window.firebaseConfig = {
  apiKey: "AIzaSyAGhkQhJYk4ZU-Fmn_sj3469toPTzrWbPE",
  authDomain: "softcare-fc2d7.firebaseapp.com",
  projectId: "softcare-fc2d7",
  storageBucket: "softcare-fc2d7.firebasestorage.app",
  messagingSenderId: "741838046763",
  appId: "1:741838046763:web:2d8b49fb9e0dc6cd2ecc6e",
  measurementId: "G-C3DEFN3RLB"
};

(function initFirebase(){
  function ready() {
    return window.firebase && window.firebase.initializeApp;
  }

  const wait = setInterval(() => {
    if (!ready()) return;
    clearInterval(wait);

    if (!firebase.apps.length) firebase.initializeApp(window.firebaseConfig);

    window.SLC.auth = firebase.auth();
    window.SLC.db = firebase.firestore();
    window.SLC.ts = firebase.firestore.FieldValue.serverTimestamp;

    // Slightly friendlier persistence behavior
    window.SLC.auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL).catch(()=>{});
  }, 50);
})();
