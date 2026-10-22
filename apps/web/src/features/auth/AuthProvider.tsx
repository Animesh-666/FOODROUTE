import { createContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { firebaseAuth, firestore, isFirebaseConfigured } from '../../lib/firebase';
import type { UserProfile } from './auth.types';

type AuthContextValue = {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  configured: boolean;
  profileError: boolean;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(isFirebaseConfigured);
  const [profileError, setProfileError] = useState(false);

  useEffect(() => {
    const auth = firebaseAuth;
    const db = firestore;
    if (!auth || !db) { setLoading(false); return; }
    let unsubscribeProfile: (() => void) | undefined;
    let sequence = 0;
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      sequence += 1;
      const turn = sequence;
      unsubscribeProfile?.();
      unsubscribeProfile = undefined;
      setUser(currentUser);
      setProfile(null);
      setProfileError(false);
      if (!currentUser) { setLoading(false); return; }
      setLoading(true);
      unsubscribeProfile = onSnapshot(doc(db, 'users', currentUser.uid), (snapshot) => {
        if (turn !== sequence) return;
        setProfile(snapshot.exists() ? snapshot.data() as UserProfile : null);
        setLoading(false);
      }, () => {
        if (turn !== sequence) return;
        setProfile(null);
        setProfileError(true);
        setLoading(false);
      });
    }, () => { setProfileError(true); setLoading(false); });
    return () => { sequence += 1; unsubscribeProfile?.(); unsubscribeAuth(); };
  }, []);

  const value = useMemo(() => ({ user, profile, loading, configured: isFirebaseConfigured, profileError }),
    [user, profile, loading, profileError]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
