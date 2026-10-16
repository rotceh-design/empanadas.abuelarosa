import { useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useCatalog } from '../../contexts/CatalogContext';
import { observarPedidos } from '../../lib/pedidos';
import { alertasStock } from '../../lib/stock';
import { play } from '../../lib/sonidos';

const TABS = [
  { to: '/admin', icon: '📊', label: 'Panel', fin: true },
  { to: '/admin/pedidos', icon: '🧾', label: 'Pedidos' },
  { to: '/admin/catalogo', icon: '🥟', label: 'Catálogo' },
  { to: '/admin/inventario', icon: '📦', label: 'Inventario' },
  { to: '/admin/ofertas', icon: '🎁', label: 'Ofertas' },
  { to: '/admin/produccion', icon: '🏭', label: 'Producción' },
  { to: '/admin/metricas', icon: '📈', label: 'Métricas' },
  { to: '/admin/config', icon: '⚙️', label: 'Config' },
];

export default function AdminLayout() {
  const { usuario, esAdmin, cargando, salir, demo } = useAuth();
  const { fuente, ingredientes, bebidasTodas, settings } = useCatalog();
  const navigate = useNavigate();
  const [nuevos, setNuevos] = useState(0);
  const anteriores = useRef(new Set());
  const alertasPrevias = useRef(0);

  const autorizado = demo || (usuario && esAdmin);

  const alertas = useMemo(
    () => alertasStock({ ingredientes, bebidas: bebidasTodas, settings }),
    [ingredientes, bebidasTodas, settings],
  );

  useEffect(() => {
    if (cargando || demo) return;
    if (!usuario) navigate('/admin/login', { replace: true });
  }, [usuario, cargando, demo, navigate]);

  useEffect(() => {
    if (alertas.length > alertasPrevias.current) play('alerta');
    alertasPrevias.current = alertas.length;
  }, [alertas.length]);

  useEffect(() => {
    if (cargando || !autorizado) return undefined;
    const off = observarPedidos((lista) => {
      const ids = new Set(lista.map((o) => o.id));
      if (anteriores.current.size > 0) {
        const frescos = [...ids].filter((id) => !anteriores.current.has(id));
        if (frescos.length > 0) { play('alerta'); setNuevos((n) => n + frescos.length); }
      }
      anteriores.current = ids;
    });
    return off;
  }, [cargando, autorizado]);

  if (cargando) return <div className="p-8 text-center">Cargando…</div>;

  if (!demo && usuario && !esAdmin) {
    return (
      <div className="vt-papel vt-tinta flex min-h-screen flex-col items-center justify-center px-4 text-center">
        <span className="text-5xl">🔒</span>
        <h1 className="vt-titulo mt-3 text-2xl">Sin permisos</h1>
        <p className="vt-cuerpo mt-1 max-w-sm text-sm italic opacity-70">
          {usuario.email} no está habilitada como administradora del panel.
        </p>
        <button onClick={salir} className="vt-btn btn-tap mt-5 rounded-xl px-5 py-3 text-sm">
          Cerrar sesión
        </button>
        <button onClick={() => navigate('/')} className="mt-3 text-sm font-bold opacity-60">
          ← Volver a la tienda
        </button>
      </div>
    );
  }

  if (!autorizado) return null;

  return (
    <div className="vt-papel vt-tinta min-h-screen">
      <header className="sticky top-0 z-40 border-b-[3px] border-[#4a2c17] bg-[#f3e6c8]/95 shadow-[0_10px_24px_-16px_rgb(42_22_11/0.6)] backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🥟</span>
            <div>
              <p className="vt-titulo text-base leading-none">Panel Abuela Rosa</p>
              <p className="vt-serif text-[11px] font-bold uppercase tracking-widest opacity-60">
                {demo ? 'Modo demo (sin Firebase)' : `Datos: ${fuente}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {nuevos > 0 && (
              <span className="rounded-full bg-bermellon-500 px-2 py-1 text-[11px] font-extrabold text-white">{nuevos} nuevos</span>
            )}
            {alertas.length > 0 && (
              <button
                onClick={() => navigate('/admin/inventario')}
                title="Ingredientes con stock bajo — ver inventario"
                className="btn-tap rounded-full border-2 border-[#8b4513]/40 bg-amber-500/25 px-2 py-1 text-[11px] font-extrabold text-[#8b4513]"
              >
                ⚠ {alertas.length} por renovar
              </button>
            )}
            <button onClick={() => { setNuevos(0); navigate('/admin/pedidos'); }} className="vt-btn btn-tap rounded-xl px-3 py-2 text-xs">
              Pedidos
            </button>
            <button onClick={salir} className="vt-btn-fantasma btn-tap rounded-xl px-3 py-2 text-xs">
              Salir
            </button>
          </div>
        </div>
        <nav className="flex gap-1.5 overflow-x-auto px-2 pb-2 no-scrollbar">
          {TABS.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              end={t.fin}
              className={({ isActive }) =>
                `btn-tap vt-serif flex-shrink-0 rounded-lg border-2 px-3 py-1.5 text-xs font-bold uppercase tracking-wide ${
                  isActive
                    ? 'border-[#4a2c17] bg-[#4a2c17] text-[#f3e6c8] shadow-[0_3px_0_#2a160b]'
                    : 'border-[#4a2c17]/25 text-tierra-700 hover:border-[#4a2c17]/60 hover:bg-[#8b4513]/10'
                }`
              }
            >
              {t.icon} {t.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-5">
        <Outlet />
      </main>
    </div>
  );
}
