function db(){
  if(!window.SLC?.db) throw new Error("Firestore not ready. Check config.js");
  return window.SLC.db;
}
function ts(){
  return window.SLC.ts ? window.SLC.ts() : new Date();
}

export async function ensureUserDoc(uid, profile){
  const ref = db().collection("users").doc(uid);
  const snap = await ref.get();
  if(!snap.exists){
    await ref.set({
      createdAt: ts(),
      displayName: profile?.displayName || "Lieya",
      email: profile?.email || ""
    });
  }
}

export async function addMealLog(uid, { text, note="" }){
  const ref = db().collection("users").doc(uid).collection("mealLogs").doc();
  await ref.set({ text, note, createdAt: ts() });
}

export async function addWaterLog(uid, { amount="a few sips" }){
  const ref = db().collection("users").doc(uid).collection("waterLogs").doc();
  await ref.set({ amount, createdAt: ts() });
}

export async function addRestLog(uid, { note="" }){
  const ref = db().collection("users").doc(uid).collection("restLogs").doc();
  await ref.set({ note, createdAt: ts() });
}

export async function addNote(uid, { title="Note", body="" }){
  const ref = db().collection("users").doc(uid).collection("notes").doc();
  await ref.set({ title, body, createdAt: ts() });
}

export async function listNotes(uid, limit=20){
  const qs = await db().collection("users").doc(uid).collection("notes")
    .orderBy("createdAt","desc").limit(limit).get();
  return qs.docs.map(d => ({ id:d.id, ...d.data() }));
}
