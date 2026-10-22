import { createUserWithEmailAndPassword, sendEmailVerification, sendPasswordResetEmail,
  signInWithEmailAndPassword, signOut, updateProfile, type User } from 'firebase/auth';
import { doc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { firebaseAuth, firestore } from '../../lib/firebase';

function services() {
  if (!firebaseAuth || !firestore) throw new Error('firebase/not-configured');
  return { auth: firebaseAuth, db: firestore };
}

function validDisplayName(name: string) {
  const clean = name.trim().replace(/\s+/g, ' ');
  if (clean.length < 2 || clean.length > 80) throw new Error('profile/invalid-name');
  return clean;
}

// Explicit, customer-only profile creation. The Firestore rules independently enforce it.
export async function ensureCustomerProfile(user: User, name: string) {
  const { db } = services();
  const displayName = validDisplayName(name);
  await setDoc(doc(db, 'users', user.uid), {
    uid: user.uid,
    email: user.email,
    displayName,
    role: 'customer',
    status: 'active',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function registerCustomer(name: string, email: string, password: string) {
  const { auth } = services();
  const displayName = validDisplayName(name);
  const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
  // If profile creation fails, the newly authenticated account remains. The Account page
  // offers "Complete customer profile" so the user can safely recover (without escalation).
  await ensureCustomerProfile(credential.user, displayName);
  await updateProfile(credential.user, { displayName });
  // Verification email is best effort; signup succeeds even when delivery is unavailable.
  try { await sendEmailVerification(credential.user); } catch { /* can resend on account page */ }
}

export async function loginCustomer(email: string, password: string) {
  const { auth } = services();
  await signInWithEmailAndPassword(auth, email.trim(), password);
}

export async function logoutCustomer() {
  const { auth } = services();
  await signOut(auth);
}

export async function resetPassword(email: string) {
  const { auth } = services();
  await sendPasswordResetEmail(auth, email.trim());
}

export async function resendVerification(user: User) {
  await sendEmailVerification(user);
}

export async function updateCustomerName(user: User, name: string) {
  const { db } = services();
  const displayName = validDisplayName(name);
  await updateDoc(doc(db, 'users', user.uid), {
    displayName, updatedAt: serverTimestamp(),
  });
  // Firestore is the source of truth for the display name. Auth profile is a convenience mirror.
  try { await updateProfile(user, { displayName }); } catch { /* auth mirror can be retried */ }
}
