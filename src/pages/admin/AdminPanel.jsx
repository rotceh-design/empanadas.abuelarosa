import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { observarPedidos, ESTADOS } from '../../lib/pedidos';
import { alertasStock } from '../../lib/stock';
import { useCatalog } from '../../contexts/CatalogContext';
import { fmtCLP } from '../../lib/formato';

const ACCESOS = [
  { to: '/admin/pedidos', icon: '🧾', label: 'Pedidos', desc: 'Estados y cobros' },
  { to: '/admin/inventario', icon: '📦', label: 'Inventario', desc: 'Stock y merma' },
  { to: '/admin/catalogo', icon: '🥟', label: 'Catálogo', desc: 'Ingredientes' },
  { to: '/admin/ofertas', icon: '🎁', label: 'Ofertas', desc: 'Bundles y reglas' },
  { to: '/admin/produccion', icon: '🏭', label: 'Producción', desc: 'Plan del día' },
  { to: '/admin/metricas', icon: '📈', label: 'Métricas', desc: 'Ventas y margen' },
  { to: '/admin/config', icon: '⚙️', label: 'Config', desc: 'Negocio y precios' },
];

export default function AdminPanel() {
  const { ingredientes, bebidasTodas, settings } = useCatalog();
  const [pedidos, setPedidos] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const off = observarPedidos((lista) => { setPedidos(lista); setError(''); },
      (e) => setError(e?.message || 'Sin conexión a los pedidos'));
    return off;
  }, []);

  const hoy = new Date().toISOString().slice(0, 10);

  const datos = useMemo(() => {
    const porEstado = Object.fromEntries(ESTADOS.map((e) => [e.id, 0]));
    let ventasHoy = 0;
    let cobrado = 0;
    pedidos.forEach((p) => {
      porEstado[p.status] = (porEstado[p.status] || 0) + 1;
      const total = p.totales?.total || 0;
      if (p.status !== 'pendiente_pago') cobrado += total;
      const dia = (p.entrega?.fecha || p.createdAt || '').slice(0, 10);
      if (dia === hoy && p.status !== 'pendiente_pago') ventasHoy += total;
    });
    const enFlujo = ESTADOS.slice(1, 4).reduce((n, e) => n + (porEstado[e.id] || 0), 0);
    return { porEstado, ventasHoy, cobrado, enFlujo };
  }, [pedidos, hoy]);

  const alertas = useMemo(
    () => alertasStock({ ingredientes, bebidas: bebidasTodas, settings }),
    [ingredientes, bebidasTodas, settings],
  );

  const ultimos = pedidos.slice(0, 5);

  const kpis = [
    { label: 'Ventas de hoy', valor: fmtCLP(datos.ventasHoy), pie: 'cobrado' },
    { label: 'En el flujo', valor: datos.enFlujo, pie: 'pagado → entregado' },
    { label: 'Pendientes de pago', valor: datos.porEstado.pendiente_pago || 0, pie: 'por confirmar' },
    { label: 'Alertas de stock', valor: alertas.length, pie: alertas.length ? 'renovar' : 'todo cargado' },
  ];

  return (
    <div>
      <h1 className="vt-titulo text-3xl">Panel</h1>
      <p className="vt-cuerpo text-sm italic opacity-60">Estado del negocio, de un vistazo</p>

      {error && (
        <p className="mt-2 rounded-xl bg-bermellon-500/15 px-3 py-2 text-sm font-bold text-bermellon-600">{error}</p>
      )}

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="vt-ficha rounded-2xl p-3">
            <p className="vt-serif text-[10px] font-extrabold uppercase tracking-widest opacity-60">{k.label}</p>
            <p className="vt-titulo mt-1 text-xl leading-tight">{k.valor}</p>
            <p className="text-[10px] italic opacity-50">{k.pie}</p>
          </div>
        ))}
      </div>

      <section className="mt-6">
        <div className="flex items-baseline justify-between">
          <h2 className="vt-titulo text-xl">Flujo de pedidos</h2>
          <Link to="/admin/pedidos" className="vt-serif text-xs font-bold uppercase tracking-wide underline-offset-2 hover:underline">
            Ver todos →
          </Link>
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {ESTADOS.map((e) => (
            <Link
              key={e.id}
              to="/admin/pedidos"
              className="btn-tap vt-ficha flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold"
              style={{ borderLeft: `4px solid ${e.color}` }}
            >
              <span aria-hidden>{e.emoji}</span>
              <span>{e.label}</span>
              <span className="vt-titulo text-sm">{datos.porEstado[e.id] || 0}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-6">
        <div className="flex items-baseline justify-between">
          <h2 className="vt-titulo text-xl">Últimos pedidos</h2>
          {ultimos.length > 0 && (
            <Link to="/admin/pedidos" className="vt-serif text-xs font-bold uppercase tracking-wide underline-offset-2 hover:underline">
              Abrir →
            </Link>
          )}
        </div>
        {ultimos.length === 0 ? (
          <p className="vt-ficha mt-2 rounded-2xl p-4 text-sm italic opacity-60">
            Aún no hay pedidos. Crea uno de prueba desde la tienda para verlo llegar aquí en vivo.
          </p>
        ) : (
          <ul className="mt-2 space-y-2">
            {ultimos.map((p) => {
              const e = ESTADOS.find((x) => x.id === p.status) || ESTADOS[0];
              return (
                <li key={p.id} className="vt-ficha flex items-center gap-3 rounded-xl px-3 py-2 text-sm"
                  style={{ borderLeft: `4px solid ${e.color}` }}>
                  <span className="vt-titulo text-sm">#{String(p.numero || 0).padStart(4, '0')}</span>
                  <span className="min-w-0 flex-1 truncate font-bold">{p.cliente?.nombre || '—'}</span>
                  <span className="hidden text-xs opacity-60 sm:inline">{e.emoji} {e.label}</span>
                  <span className="vt-titulo text-sm">{fmtCLP(p.totales?.total || 0)}</span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="mt-6">
        <h2 className="vt-titulo text-xl">Ir a…</h2>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {ACCESOS.map((a) => (
            <Link key={a.to} to={a.to} className="vt-ficha btn-tap rounded-xl px-3 py-2.5 hover:bg-[#8b4513]/10">
              <p className="text-base">{a.icon} <span className="vt-serif text-xs font-extrabold uppercase">{a.label}</span></p>
              <p className="text-[10px] italic opacity-55">{a.desc}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
