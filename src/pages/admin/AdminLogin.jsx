import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function AdminLogin() {
  const { entrar, salir, demo } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const enviar = async (e) => {
    e.preventDefault();
    setError('');
    setCargando(true);
    try {
      const esAdmin = await entrar(email, pass);
      if (!esAdmin) {
        await salir();
        setError('Esa cuenta no tiene permisos de administración.');
        return;
      }
      navigate('/admin', { replace: true });
    } catch (err) {
      setError(err?.message?.replace('Firebase: ', '') || 'No se pudo iniciar sesión');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="vt-papel vt-tinta flex min-h-screen items-center justify-center px-4">
      <form onSubmit={enviar} className="vt-modal w-full max-w-sm rounded-3xl p-6">
        <h1 className="vt-titulo text-center text-2xl">🥟 Panel Admin</h1>
        <p className="vt-cuerpo mt-1 text-center text-sm italic opacity-60">Inicia sesión para gestionar tu negocio</p>

        <label htmlFor="email" className="vt-serif mt-5 block text-sm font-extrabold uppercase tracking-wide">Correo</label>
        <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
          className="vt-input mt-1 w-full px-4 py-3" />

        <label htmlFor="pass" className="vt-serif mt-3 block text-sm font-extrabold uppercase tracking-wide">Contraseña</label>
        <input id="pass" type="password" value={pass} onChange={(e) => setPass(e.target.value)}
          className="vt-input mt-1 w-full px-4 py-3" />

        {error && <p className="mt-2 text-sm text-bermellon-500">{error}</p>}

        <button type="submit" disabled={cargando}
          className="btn-tap mt-5 w-full rounded-2xl bg-naranja-500 py-3.5 font-extrabold text-white disabled:opacity-50">
          {cargando ? 'Entrando…' : 'Entrar'}
        </button>

        {demo && (
          <button type="button" onClick={() => navigate('/admin')}
            className="btn-tap mt-2 w-full rounded-2xl border-2 border-[#4a2c17]/40 py-3 font-extrabold">
            Continuar en modo demo
          </button>
        )}

        <button type="button" onClick={() => navigate('/')}
          className="mt-4 block w-full text-center text-sm font-bold opacity-60">
          ← Volver a la tienda
        </button>
      </form>
    </div>
  );
}
