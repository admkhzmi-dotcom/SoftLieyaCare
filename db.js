function db(){
  if(!window.SLC?.db) throw new Error("Firestore not ready. Check config.js");
  return window.SLC.db;
}
function ts(){
  return window.SLC.ts ? window.SLC.ts() : new Date();
}

function dateKey(d=new Date()){
  const y=d.getFullYear();
  const m=String(d.getMonth()+1).padStart(2,"0");
  const da=String(d.getDate()).padStart(2,"0");
  return `${y}-${m}-${da}`;
}

export async function ensureUserDoc(uid, profile){
  const ref = db().collection("users").doc(uid);
  const snap = await ref.get();
  if(!snap.exists){
    await ref.set({
      createdAt: ts(),
      displayName: profile?.displayName || "Lieya",
      email: profile?.email || "",
      streakCount: 0,
      streakLastDate: null
    });
  }
}

/* ---------- STREAK ---------- */
export async function bumpStreak(uid){
  const userRef = db().collection("users").doc(uid);
  await db().runTransaction(async (tx) => {
    const snap = await tx.get(userRef);
    const data = snap.exists ? snap.data() : {};
    const today = dateKey(new Date());
    const last = data?.streakLastDate || null;
    let count = Number(data?.streakCount || 0);

    if(last === today){
      tx.set(userRef, { streakCount: count, streakLastDate: today }, { merge:true });
      return;
    }

    const y = new Date(); y.setDate(y.getDate()-1);
    const yesterday = dateKey(y);

    count = (last === yesterday) ? (count + 1) : 1;

    tx.set(userRef, { streakCount: count, streakLastDate: today }, { merge:true });
  });
}

export async function getStreak(uid){
  const snap = await db().collection("users").doc(uid).get();
  const data = snap.exists ? snap.data() : {};
  return { count: Number(data?.streakCount || 0), lastDate: data?.streakLastDate || null };
}

/* ---------- LOGS (also bump streak) ---------- */
export async function addMealLog(uid, { text, note="" }){
  const ref = db().collection("users").doc(uid).collection("mealLogs").doc();
  await ref.set({ text, note, createdAt: ts() });
  await bumpStreak(uid);
}

export async function addWaterLog(uid, { amount="a few sips" }){
  const ref = db().collection("users").doc(uid).collection("waterLogs").doc();
  await ref.set({ amount, createdAt: ts() });
  await bumpStreak(uid);
}

export async function addRestLog(uid, { note="" }){
  const ref = db().collection("users").doc(uid).collection("restLogs").doc();
  await ref.set({ note, createdAt: ts() });
  await bumpStreak(uid);
}

export async function addNote(uid, { title="Note", body="" }){
  const ref = db().collection("users").doc(uid).collection("notes").doc();
  await ref.set({ title, body, createdAt: ts() });
  await bumpStreak(uid);
}

export async function listNotes(uid, limit=20){
  const qs = await db().collection("users").doc(uid).collection("notes")
    .orderBy("createdAt","desc").limit(limit).get();
  return qs.docs.map(d => ({ id:d.id, ...d.data() }));
}

/* ---------- QUR’AN HISTORY ---------- */
export async function saveDailyAyahIfNeeded(uid, ayah, opts={}){
  const force = !!opts.force;
  const key = opts.dateKey || dateKey(new Date());

  const ref = db().collection("users").doc(uid).collection("quranHistory").doc(key);
  const snap = await ref.get();

  if(snap.exists && !force) return;

  await ref.set({
    dateKey: key,
    ref: ayah.ref,
    ar: ayah.ar,
    meaning: ayah.meaning,
    createdAt: ts()
  }, { merge:true });

  await bumpStreak(uid);
}

export async function listAyahHistory(uid, limit=30){
  const qs = await db().collection("users").doc(uid).collection("quranHistory")
    .orderBy("dateKey","desc").limit(limit).get();
  return qs.docs.map(d => ({ id:d.id, ...d.data() }));
}
