import { showError, clearError, showToast } from "./ui.js";

function auth(){
  if(!window.SLC?.auth) throw new Error("Firebase not ready. Check config.js");
  return window.SLC.auth;
}

export function onAuth(cb){
  return auth().onAuthStateChanged(cb);
}

export async function signIn(email, password){
  clearError();
  const a = auth();
  await a.signInWithEmailAndPassword(email, password);
  showToast("Welcome back ✨");
}

export async function signUp(name, email, password){
  clearError();
  const a = auth();
  const cred = await a.createUserWithEmailAndPassword(email, password);
  await cred.user.updateProfile({ displayName: name || "Lieya" });
  showToast("Account created 🤍");
}

export async function signOut(){
  await auth().signOut();
  showToast("Signed out");
}

export function setAuthError(msg){
  showError(msg);
}
