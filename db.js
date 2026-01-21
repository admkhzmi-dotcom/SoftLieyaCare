function db(){
  if(!window.SLC?.db) throw new Error("Firestore not ready");
  return window.SLC.db;
}

export async function ensureUserDoc(uid, user){
  const ref = db().collection("users").doc(uid);
  const snap = await ref.get();
  if(!snap.exists){
    await ref.set({
      name: user?.displayName || "Lieya",
      email: user?.email || "",
      createdAt: Date.now()
    });
  }
}

export async function addWaterLog(uid, data){
  return db().collection("users").doc(uid).collection("water").add({ ...data, createdAt: Date.now() });
}
export async function addMealLog(uid, data){
  return db().collection("users").doc(uid).collection("meals").add({ ...data, createdAt: Date.now() });
}
export async function addRestLog(uid, data){
  return db().collection("users").doc(uid).collection("rest").add({ ...data, createdAt: Date.now() });
}

export async function addNote(uid, text){
  return db().collection("users").doc(uid).collection("notes").add({ text, createdAt: Date.now() });
}
export async function listNotes(uid){
  const q = await db().collection("users").doc(uid).collection("notes").orderBy("createdAt","desc").limit(50).get();
  return q.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function saveDailyAyahIfNeeded(uid, ayah){
  const todayKey = new Date().toISOString().slice(0,10);
  const ref = db().collection("users").doc(uid).collection("quranHistory").doc(todayKey);
  const snap = await ref.get();
  if(!snap.exists){
    await ref.set({ ...ayah, day: todayKey, createdAt: Date.now() });
  }
}

export async function listAyahHistory(uid){
  const q = await db().collection("users").doc(uid).collection("quranHistory").orderBy("createdAt","desc").limit(30).get();
  return q.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getStreak(uid){
  // Very simple: count distinct day docs in quranHistory (can be replaced with better logic later)
  const q = await db().collection("users").doc(uid).collection("quranHistory").get();
  return { count: q.size || 0 };
}
