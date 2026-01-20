import {
  doc, getDoc, setDoc, updateDoc, serverTimestamp,
  collection, addDoc, query, orderBy, limit, getDocs
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";

export const DEFAULT_PREFS = {
  toneLevel: 1,
  remindersEnabled: true,
  quietHours: { start:"22:30", end:"08:30" },
  dailyPopupLimit: 8,
  popupCooldownMinutes: 45
};

export const DEFAULT_STATES = {
  periodModeEnabled:false,
  tiredModeEnabled:false,
  goingOutActive:false,
  goingOut:{ type:"quick", lastCheckInAt:"" }
};

export async function ensureUserDoc(db, user){
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
  if(snap.exists()) return snap.data();

  const data = {
    profile:{
      displayName: user.displayName || "Lieya",
      createdAt: serverTimestamp(),
      lastSeenAt: serverTimestamp()
    },
    preferences:{...DEFAULT_PREFS},
    states:{...DEFAULT_STATES}
  };

  await setDoc(ref, data);
  return data;
}

export async function getUserBundle(db, uid){
  const snap = await getDoc(doc(db,"users",uid));
  return snap.exists() ? snap.data() : null;
}

export async function touchLastSeen(db, uid){
  await updateDoc(doc(db,"users",uid), {"profile.lastSeenAt": serverTimestamp()});
}

export async function updateProfile(db, uid, patch){
  await updateDoc(doc(db,"users",uid), {"profile.displayName": patch.displayName});
}

export async function updatePrefs(db, uid, prefs){
  await updateDoc(doc(db,"users",uid), {preferences: prefs});
}

export async function updateStates(db, uid, states){
  await updateDoc(doc(db,"users",uid), {states: states});
}

export async function addMealLog(db, uid, mealType, size, note){
  await addDoc(collection(db,"users",uid,"mealLogs"), {
    timestamp: serverTimestamp(),
    mealType, size, note: note || ""
  });
}

export async function addSleepLog(db, uid, startISO, endISO, quality, note){
  await addDoc(collection(db,"users",uid,"sleepLogs"), {
    timestamp: serverTimestamp(),
    sleepStart: startISO,
    sleepEnd: endISO,
    quality: Number(quality),
    note: note || ""
  });
}

export async function addNote(db, uid, moodTag, text){
  await addDoc(collection(db,"users",uid,"notes"), {
    timestamp: serverTimestamp(),
    moodTag, text
  });
}

export async function getRecent(db, uid, subcollection, n=6){
  const q = query(
    collection(db,"users",uid,subcollection),
    orderBy("timestamp","desc"),
    limit(n)
  );
  const snaps = await getDocs(q);
  return snaps.docs.map(d => ({id:d.id, ...d.data()}));
}
