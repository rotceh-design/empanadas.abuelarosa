import { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { observarPedidos, cambiarEstado, ESTADOS } from '../../lib/pedidos';
import { fmtCLP } from '../../lib/formato';
import { useCatalog } from '../../contexts/CatalogContext';
import { costoPedido } from '../../lib/costos';
import { signoStock } from '../../lib/stock';

export default function AdminPedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [filtro, setFiltro] = useState('todos');
  const [abiertos, setAbiertos] = useState(new Set());
  const { porId, bebidasTodas, settings } = useCatalog();

  const ctxStock = useMemo(
    () => ({ porId, bebidas: bebidasTodas, settings }),
    [porId, bebidasTodas, settings],
  );
  const porBebida = useMemo(
    () => Object.fromEntries(bebidasTodas.map((b) => [b.id, b])),
    [bebidasTodas],
  );

  useEffect(() => observarPedidos(setPedidos), []);

  const filtrados = useMemo(
    () => (filtro === 'todos' ? pedidos : pedidos.filter((p) => p.status === filtro)),
    [pedidos, filtro]
  );

  const cambiar = async (pedido, status) => {
    const signo = signoStock(pedido, status);
    await cambiarEstado(pedido, status, ctxStock);
    setPedidos((prev) => prev.map((p) => (p.id === pedido.id
      ? { ...p, status, ...(signo !== 0 ? { stockDescontado: signo === 1 } : {}) }
      : p)));
  };

  const toggle = (id) => {
      setAbiertos((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };

  return (
    <div>
      <h1 className="vt-titulo text-3xl">Pedidos</h1>
      <p className="vt-cuerpo text-sm italic opacity-60">{pedidos.length} pedidos en total</p>

      <div className="mt-3 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        <Chip activo={filtro === 'todos'} onClick={() => setFiltro('todos')}>Todos ({pedidos.length})</Chip>
        {ESTADOS.map((e) => (
          <Chip key={e.id} activo={filtro === e.id} onClick={() => setFiltro(e.id)} color={e.color}>
            {e.emoji} {e.label} ({pedidos.filter((p) => p.status === e.id).length})
          </Chip>
        ))}
      </div>

      <div className="mt-4 space-y-3">
        {filtrados.length === 0 && (
          <p className="vt-ficha rounded-2xl p-6 text-center opacity-60">No hay pedidos aquí todavía.</p>
        )}
        <AnimatePresence>
          {filtrados.map((p) => {
            const estado = ESTADOS.find((e) => e.id === p.status) || ESTADOS[0];
            const empanadas = (p.items || []).filter((i) => i.tipo === 'empanada');
            const bebidas = (p.items || []).filter((i) => i.tipo === 'bebida');
            const abierto = abiertos.has(p.id);
            return (
              <motion.div
                key={p.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="vt-ficha rounded-3xl p-4"
                style={{ borderLeft: `5px solid ${estado.color}` }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="vt-titulo text-lg">
                      #{String(p.numero).padStart(4, '0')} · {p.cliente?.nombre}
                    </p>
                    <p className="vt-cuerpo text-xs italic opacity-60">
                      {p.cliente?.telefono} · {p.cliente?.comuna} · {p.entrega?.fecha} {p.entrega?.hora}
                    </p>
                    <p className="mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-extrabold"
                       style={{ background: `${estado.color}22`, color: estado.color }}>
                      {estado.emoji} {estado.label}
                    </p>
                    {p.comprobante && (
                      <a href={p.comprobante} target="_blank" rel="noreferrer"
                         title="Ver comprobante de pago"
                         className="btn-tap mt-1 inline-flex items-center gap-1 rounded-full bg-verde-500/15 px-2 py-0.5 text-[11px] font-extrabold text-verde-600">
                        🧾 Ver comprobante
                      </a>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="vt-titulo text-xl">{fmtCLP(p.totales?.total || 0)}</p>
                    {(p.totales?.ahorro || 0) > 0 && (
                      <p className="text-[11px] font-bold text-verde-600">Ahorro {fmtCLP(p.totales.ahorro)}</p>
                    )}
                    <button onClick={() => toggle(p.id)} className="btn-tap mt-1 text-xs font-bold opacity-60">
                      {abierto ? 'Ocultar ▲' : 'Ver detalle ▼'}
                    </button>
                  </div>
                </div>

                <AnimatePresence>
                  {abierto && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="vt-ficha-suave mt-3 space-y-2 rounded-2xl p-3 text-sm">
                        {empanadas.map((e, i) => (
                          <div key={i} className="vt-ficha-suave rounded-2xl p-2.5">
                            <p className="font-extrabold">🥟 {e.nombre} ×{e.cantidad}</p>
                            <p className="opacity-70">{[e.proteina, e.queso].filter(Boolean).join(' + ')}</p>
                            <p className="opacity-70">{(e.acompanamientos || []).join(', ')}</p>
                            {e.extrasCount > 0 && <p className="text-[11px] font-bold text-naranja-600">+{e.extrasCount} extras</p>}
                          </div>
                        ))}
                        {bebidas.map((b, i) => (
                          <div key={i} className="vt-ficha-suave rounded-2xl p-2.5">
                            <p className="font-extrabold">🥤 {b.nombre} ×{b.cantidad}</p>
                          </div>
                        ))}
                        {p.cliente?.direccion && <p className="opacity-70">📍 {p.cliente.direccion}</p>}
                        {p.cliente?.referencias && <p className="opacity-70">🔎 {p.cliente.referencias}</p>}
                        <p className="vt-ficha-suave rounded-2xl px-2.5 py-2 font-bold">
                          💰 Costo ingredientes {fmtCLP(costoPedido(p, { porId, porBebida, settings }))} ·{' '}
                          margen <b className="text-verde-700">{fmtCLP((p.totales?.total || 0) - costoPedido(p, { porId, porBebida, settings }))}</b>
                        </p>
                        {p.comprobante && (
                          <div className="vt-ficha-suave rounded-2xl p-2.5">
                            <p className="mb-1 font-extrabold">🧾 Comprobante de pago</p>
                            <a href={p.comprobante} target="_blank" rel="noreferrer">
                              <img src={p.comprobante} alt="Comprobante de pago" className="panel-sm max-h-56 w-full object-cover" />
                            </a>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="mt-3 flex flex-wrap gap-2">
                  {ESTADOS.map((e) => (
                    <button
                      key={e.id}
                      onClick={() => cambiar(p, e.id)}
                      disabled={p.status === e.id}
                      className="btn-tap rounded-xl px-2.5 py-1.5 text-[11px] font-extrabold disabled:opacity-30"
                      style={{ background: p.status === e.id ? e.color : `${e.color}18`, color: p.status === e.id ? '#fff' : e.color }}
                    >
                      {e.emoji} {e.label}
                    </button>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}

function Chip({ children, activo, onClick, color }) {
  return (
    <button
      onClick={onClick}
      className="btn-tap flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-extrabold"
      style={{
        background: activo ? (color || '#4a2c17') : 'rgb(255 250 235 / 0.7)',
        color: activo ? '#f3e6c8' : '#4a2c17',
        border: activo ? '2px solid #4a2c17' : '2px solid rgb(74 44 23 / 0.3)',
      }}
    >
      {children}
    </button>
  );
}
