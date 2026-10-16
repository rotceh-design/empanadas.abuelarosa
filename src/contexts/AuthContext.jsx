import { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const AuthContext = createContext(null);

// Mismo criterio que el RLS (es_admin): perfil marcado o correo de la dueña.
const ADMIN_EMAIL = 'admin@abuelarosa.cl';

async function resolverEsAdmin(user) {
  if (!user) return false;
  if (String(user.email || '').toLowerCase() === ADMIN_EMAIL) return true;
  try {
    const { data } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .maybeSingle();
    return Boolean(data?.is_admin);
  } catch {
    return false;
  }
}

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [esAdmin, setEsAdmin] = useState(false);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) { setCargando(false); return undefined; }
    let vivo = true;

    const aplicar = async (sesion) => {
      const user = sesion?.user || null;
      const admin = await resolverEsAdmin(user);
      if (!vivo) return;
      setUsuario(user);
      setEsAdmin(admin);
      setCargando(false);
    };

    // Sesión inicial + cambios posteriores (login/logout en otra pestaña).
    supabase.auth.getSession().then(({ data }) => { if (vivo) aplicar(data?.session); });
    const { data: sub } = supabase.auth.onAuthStateChange((_evento, sesion) => aplicar(sesion));

    return () => { vivo = false; sub?.subscription?.unsubscribe(); };
  }, []);

  const entrar = async (email, password) => {
    if (!isSupabaseConfigured) throw new Error('Configura Supabase para usar el panel.');
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    const admin = await resolverEsAdmin(data.user);
    setUsuario(data.user);
    setEsAdmin(admin);
    setCargando(false);
    return admin;
  };

  const salir = async () => {
    await supabase.auth.signOut();
    setUsuario(null);
    setEsAdmin(false);
  };

  return (
    <AuthContext.Provider value={{ usuario, esAdmin, cargando, entrar, salir, demo: !isSupabaseConfigured }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
