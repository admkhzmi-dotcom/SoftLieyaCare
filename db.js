// db.js
// Firestore persistence for SoftLieya Care.

function db(){
  if(!window.SLC?.db) throw new Error("Firebase not ready. Check config.js");
  return window.SLC.db;
}
function f(){
  return firebase.firestore;
}
function todayKey(d=new Date()){
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,"0");
  const day = String(d.getDate()).padStart(2,"0");
  return `${y}-${m}-${day}`;
}
function userRef(uid){
  return db().collection("users").doc(uid);
}

export async function ensureUserDoc(uid, user){
  const ref = userRef(uid);
  const snap = await ref.get();
  const payload = {
    displayName: user?.displayName || "Lieya",
    email: user?.email || "",
    updatedAt: f().FieldValue.serverTimestamp()
  };
  if(!snap.exists){
    await ref.set({
      ...payload,
      createdAt: f().FieldValue.serverTimestamp()
    }, { merge: true });
  }else{
    await ref.set(payload, { merge: true });
  }
}

async function bumpDay(uid, key, patch){
  const ref = userRef(uid).collection("days").doc(key);
  await ref.set({
    dayKey: key,
    updatedAt: f().FieldValue.serverTimestamp(),
    ...patch
  }, { merge: true });
}

async function addRawLog(uid, type, data, dayKeyValue = todayKey()){
  const ref = userRef(uid).collection("logs");
  await ref.add({
    type,
    dayKey: dayKeyValue,
    data: data || {},
    createdAt: f().FieldValue.serverTimestamp()
  });
}

async function addLog(uid, type, data){
  const key = todayKey();
  await addRawLog(uid, type, data, key);

  const inc = f().FieldValue.increment(1);
  if(type === "water") await bumpDay(uid, key, { waterCount: inc });
  if(type === "meal")  await bumpDay(uid, key, { mealCount: inc });
  if(type === "rest")  await bumpDay(uid, key, { restCount: inc });
}

export async function addWaterLog(uid, data){ return addLog(uid, "water", data); }
export async function addMealLog(uid, data){ return addLog(uid, "meal", data); }
export async function addRestLog(uid, data){ return addLog(uid, "rest", data); }

/* ===========================
  Daily counts (Home badges)
=========================== */
export async function getDayCounts(uid, dayKeyValue = todayKey()){
  const ref = userRef(uid).collection("days").doc(dayKeyValue);
  const snap = await ref.get();
  const d = snap.exists ? snap.data() : null;
  return {
    dayKey: dayKeyValue,
    waterCount: Number(d?.waterCount || 0),
    mealCount: Number(d?.mealCount || 0),
    restCount: Number(d?.restCount || 0)
  };
}

// Undo: decrement today count safely (won’t go below 0) + record an undo log
async function adjustDayCount(uid, dayKeyValue, field, delta){
  const ref = userRef(uid).collection("days").doc(dayKeyValue);

  await db().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const data = snap.exists ? snap.data() : {};
    const current = Number(data?.[field] || 0);
    const next = Math.max(0, current + delta);

    tx.set(ref, {
      dayKey: dayKeyValue,
      updatedAt: f().FieldValue.serverTimestamp(),
      [field]: next
    }, { merge: true });
  });
}

export async function undoTodayCare(uid, type){
  const key = todayKey();
  if(type === "water"){
    await adjustDayCount(uid, key, "waterCount", -1);
    await addRawLog(uid, "water_undo", {}, key);
    return;
  }
  if(type === "meal"){
    await adjustDayCount(uid, key, "mealCount", -1);
    await addRawLog(uid, "meal_undo", {}, key);
    return;
  }
  if(type === "rest"){
    await adjustDayCount(uid, key, "restCount", -1);
    await addRawLog(uid, "rest_undo", {}, key);
    return;
  }
}

/* ===========================
  Streak
=========================== */
export async function getStreak(uid){
  const q = await userRef(uid)
    .collection("days")
    .orderBy("dayKey", "desc")
    .limit(60)
    .get();

  const days = q.docs.map(d => d.data()).filter(Boolean);

  const map = new Map();
  for(const d of days){
    const hasAny = (d.waterCount || 0) + (d.mealCount || 0) + (d.restCount || 0) > 0;
    map.set(d.dayKey, hasAny);
  }

  let count = 0;
  const start = new Date();
  for(let i=0;i<365;i++){
    const dt = new Date(start);
    dt.setDate(start.getDate() - i);
    const key = todayKey(dt);
    if(map.get(key)){
      count += 1;
    }else{
      break;
    }
  }
  return { count };
}

/* ===========================
  Period tracking
=========================== */
function periodStateRef(uid){
  return userRef(uid).collection("period").doc("state");
}

export async function getPeriodState(uid){
  const snap = await periodStateRef(uid).get();
  return snap.exists ? snap.data() : null;
}

export async function listPeriods(uid, limit=12){
  const q = await userRef(uid)
    .collection("periods")
    .orderBy("createdAt", "desc")
    .limit(limit)
    .get();
  return q.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function setPeriodToday(uid, { isOnPeriod }){
  const key = todayKey();
  const ref = periodStateRef(uid);

  if(isOnPeriod){
    await ref.set({
      active: true,
      periodStartDayKey: key,
      periodEndDayKey: null,
      lastAskedDayKey: key,
      updatedAt: f().FieldValue.serverTimestamp()
    }, { merge: true });

    await userRef(uid).collection("periods").add({
      startDayKey: key,
      endDayKey: null,
      finishedEarly: false,
      finishedLate: false,
      createdAt: f().FieldValue.serverTimestamp()
    });
  }else{
    await ref.set({
      active: false,
      lastAskedDayKey: key,
      updatedAt: f().FieldValue.serverTimestamp()
    }, { merge: true });
  }
}

export async function healPeriodStateFromHistory(uid){
  const state = await getPeriodState(uid);

  const q = await userRef(uid).collection("periods")
    .where("endDayKey","==",null)
    .limit(5)
    .get();

  const open = q.docs.map(d => ({ id:d.id, ...d.data() }))
    .filter(p => p?.startDayKey)
    .sort((a,b) => {
      const ta = a.createdAt?.toMillis?.() || 0;
      const tb = b.createdAt?.toMillis?.() || 0;
      return tb - ta;
    })[0] || null;

  const ref = periodStateRef(uid);

  if(open){
    const shouldFix = !state?.active || state?.periodStartDayKey !== open.startDayKey;
    if(shouldFix){
      await ref.set({
        active: true,
        periodStartDayKey: open.startDayKey,
        periodEndDayKey: null,
        updatedAt: f().FieldValue.serverTimestamp()
      }, { merge: true });
    }
  }else{
    if(state?.active){
      await ref.set({
        active: false,
        periodEndDayKey: todayKey(),
        updatedAt: f().FieldValue.serverTimestamp()
      }, { merge: true });
    }
  }
}

export async function endPeriod(uid, { endDayKey, finishedEarly=false, finishedLate=false }){
  const ref = periodStateRef(uid);

  await ref.set({
    active: false,
    periodEndDayKey: endDayKey,
    updatedAt: f().FieldValue.serverTimestamp()
  }, { merge: true });

  const q = await userRef(uid).collection("periods")
    .where("endDayKey","==",null)
    .limit(5)
    .get();

  const open = q.docs.map(d => ({ id:d.id, ref:d.ref, ...d.data() }))
    .sort((a,b) => {
      const ta = a.createdAt?.toMillis?.() || 0;
      const tb = b.createdAt?.toMillis?.() || 0;
      return tb - ta;
    })[0];

  if(open?.ref){
    await open.ref.set({
      endDayKey,
      finishedEarly,
      finishedLate,
      updatedAt: f().FieldValue.serverTimestamp()
    }, { merge: true });
  }
}

/* ===========================
  Qur’an history
=========================== */
export async function saveDailyAyahIfNeeded(uid, ayah){
  const key = todayKey();
  const ref = userRef(uid).collection("ayahDaily").doc(key);
  const snap = await ref.get();
  if(snap.exists) return;

  await ref.set({
    dayKey: key,
    ref: ayah.ref,
    ar: ayah.ar,
    meaning: ayah.meaning,
    createdAt: f().FieldValue.serverTimestamp()
  });

  await userRef(uid).collection("ayahHistory").add({
    ref: ayah.ref,
    ar: ayah.ar,
    meaning: ayah.meaning,
    source: "daily",
    createdAt: f().FieldValue.serverTimestamp()
  });
}

export async function saveAyahToHistory(uid, ayah){
  await userRef(uid).collection("ayahHistory").add({
    ref: ayah.ref,
    ar: ayah.ar,
    meaning: ayah.meaning,
    source: "manual",
    createdAt: f().FieldValue.serverTimestamp()
  });
}

export async function listAyahHistory(uid){
  const q = await userRef(uid)
    .collection("ayahHistory")
    .orderBy("createdAt", "desc")
    .limit(12)
    .get();
  return q.docs.map(d => d.data());
}

/* ===========================
  Notes (CRUD)
=========================== */
export async function saveNote(uid, { text, pinned=false }){
  const when = new Date().toLocaleString();
  await userRef(uid).collection("notes").add({
    text: text || "",
    pinned: !!pinned,
    when,
    createdAt: f().FieldValue.serverTimestamp(),
    updatedAt: f().FieldValue.serverTimestamp()
  });
}

// IMPORTANT: return IDs so edit/delete works
export async function listNotes(uid, limit=50){
  const q = await userRef(uid)
    .collection("notes")
    .orderBy("createdAt","desc")
    .limit(limit)
    .get();

  return q.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function deleteNote(uid, noteId){
  if(!noteId) return;
  await userRef(uid).collection("notes").doc(noteId).delete();
}

// Generic update (used for pin + edit)
export async function updateNote(uid, noteId, patch = {}){
  if(!noteId) return;
  await userRef(uid).collection("notes").doc(noteId).set({
    ...patch,
    updatedAt: f().FieldValue.serverTimestamp()
  }, { merge: true });
}
// Export notes (client-side download helper uses this)
export async function exportNotes(uid, limit=200){
  const notes = await listNotes(uid, limit);
  return notes.map(n => ({
    id: n.id,
    text: n.text || "",
    pinned: !!n.pinned,
    when: n.when || "",
    createdAt: n.createdAt?.toDate?.()?.toISOString?.() || null,
    updatedAt: n.updatedAt?.toDate?.()?.toISOString?.() || null
  }));
}
