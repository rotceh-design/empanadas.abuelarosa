import { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged, signInWithEmailAndPassword, signOut,
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../lib/firebase';

const AuthContext = createContext(null);

// Mismo criterio que firestore.rules: claim `admin` o correo de la dueña.
const ADMIN_EMAIL = 'admin@abuelarosa.cl';

async function resolverEsAdmin(user) {
  if (!user) return false;
  try {
    const token = await user.getIdTokenResult();
    if (token?.claims?.admin === true) return true;
  } catch { /* sin token cacheado → caemos al correo */ }
  return String(user.email || '').toLowerCase() === ADMIN_EMAIL;
}

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [esAdmin, setEsAdmin] = useState(false);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (!isFirebaseConfigured) { setCargando(false); return undefined; }
    let vivo = true;
    const off = onAuthStateChanged(auth, async (u) => {
      const admin = await resolverEsAdmin(u);
      if (!vivo) return;
      setUsuario(u);
      setEsAdmin(admin);
      setCargando(false);
    }, () => { if (vivo) setCargando(false); });
    return () => { vivo = false; off(); };
  }, []);

  const entrar = async (email, password) => {
    if (!isFirebaseConfigured) throw new Error('Configura Firebase para usar el panel.');
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const admin = await resolverEsAdmin(cred.user);
    setUsuario(cred.user);
    setEsAdmin(admin);
    setCargando(false);
    return admin;
  };

  const salir = async () => {
    await signOut(auth);
    setUsuario(null);
    setEsAdmin(false);
  };

  return (
    <AuthContext.Provider value={{ usuario, esAdmin, cargando, entrar, salir, demo: !isFirebaseConfigured }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
