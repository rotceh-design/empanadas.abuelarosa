import { useState } from 'react';
import { guardarDoc, eliminarDoc } from '../../lib/inventario';
import { useCatalog } from '../../contexts/CatalogContext';
import { fmtCLP } from '../../lib/formato';

export default function AdminOfertas() {
  const { ofertas, reglas, porId, precioBase, bebidasTodas, fuente } = useCatalog();
  const [tab, setTab] = useState('ofertas');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const refBebida = bebidasTodas[0]?.precio ?? 1700;

  const avisar = (texto) => { setMsg(texto); setError(''); };
  const fallar = (e) => { setError(e?.message || 'No se pudo guardar'); setMsg(''); };

  const guardarOferta = async (o) => {
    try {
      await guardarDoc('offers', o.id, o);
      avisar(`✓ Oferta "${o.nombre}" guardada`);
    } catch (e) { fallar(e); }
  };

  const crearOferta = async () => {
    try {
      const orden = Math.max(0, ...ofertas.map((o) => Number(o.orden) || 0)) + 1;
      const nueva = {
        id: `of_${Date.now()}`,
        emoji: '🎁',
        nombre: 'Nueva oferta',
        empanadas: 1,
        bebidas: 0,
        precio: precioBase,
        activa: true,
        orden,
      };
      await guardarDoc('offers', nueva.id, nueva);
      avisar('✓ Oferta creada — edítala abajo');
    } catch (e) { fallar(e); }
  };

  const borrarOferta = async (o) => {
    if (!window.confirm(`¿Borrar la oferta "${o.nombre}"?`)) return;
    try {
      await eliminarDoc('offers', o.id);
      avisar(`✓ Oferta "${o.nombre}" eliminada`);
    } catch (e) { fallar(e); }
  };

  const guardarRegla = async (r) => {
    try {
      await guardarDoc('rules', r.id, r);
      avisar('✓ Regla guardada');
    } catch (e) { fallar(e); }
  };

  const borrarRegla = async (r) => {
    if (!window.confirm('¿Borrar esta regla?')) return;
    try {
      await eliminarDoc('rules', r.id);
      avisar('✓ Regla eliminada');
    } catch (e) { fallar(e); }
  };

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="vt-titulo text-3xl">Ofertas y reglas</h1>
          <p className="vt-cuerpo text-sm italic opacity-60">El carrito aplica la mejor oferta automáticamente</p>
        </div>
        {tab === 'ofertas' && (
          <button onClick={crearOferta} className="vt-btn btn-tap rounded-xl px-4 py-2.5 text-xs">
            + Nueva oferta
          </button>
        )}
      </div>

      <p className="vt-serif mt-2 text-[11px] font-bold uppercase tracking-widest opacity-50">
        Datos: {fuente} · cambios {fuente === 'firestore' ? 'sincronizados' : 'guardados en este equipo'}
      </p>

      {msg && <p className="mt-2 rounded-xl bg-verde-400/15 px-3 py-2 text-sm font-bold text-verde-600">{msg}</p>}
      {error && <p className="mt-2 rounded-xl bg-bermellon-500/15 px-3 py-2 text-sm font-bold text-bermellon-600">{error}</p>}

      <div className="mt-3 flex gap-2">
        {[['ofertas', '🎁 Ofertas'], ['reglas', '💡 Reglas']].map(([id, l]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`btn-tap rounded-xl px-3 py-2 text-xs font-extrabold ${tab === id ? 'bg-naranja-500 text-white' : 'bg-[#8b4513]/10'}`}>
            {l}
          </button>
        ))}
      </div>

      {tab === 'ofertas' && (
        <div className="mt-4 space-y-3">
          {ofertas.length === 0 && (
            <p className="vt-ficha rounded-2xl p-4 text-sm italic opacity-60">
              Sin ofertas. Crea la primera con “+ Nueva oferta”.
            </p>
          )}
          {ofertas.map((o) => (
            <div key={o.id} className="vt-ficha rounded-2xl p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <span className="text-xl" aria-hidden>{o.emoji || '🎁'}</span>
                  <input
                    key={o.id}
                    defaultValue={o.nombre}
                    aria-label="Nombre de la oferta"
                    onBlur={(e) => {
                      const nombre = e.target.value.trim();
                      if (nombre && nombre !== o.nombre) guardarOferta({ ...o, nombre });
                    }}
                    className="vt-input vt-titulo min-w-0 flex-1 rounded-lg px-2 py-1 text-lg"
                  />
                </div>
                <button onClick={() => guardarOferta({ ...o, activa: !o.activa })}
                  className={`flex-shrink-0 rounded-full px-3 py-1 text-xs font-extrabold ${o.activa ? 'bg-verde-500 text-white' : 'bg-bermellon-500 text-white'}`}>
                  {o.activa ? 'Activa' : 'Inactiva'}
                </button>
                <button onClick={() => borrarOferta(o)} title="Borrar oferta"
                  className="btn-tap flex-shrink-0 rounded-full border-2 border-bermellon-500/40 px-2.5 py-1 text-xs font-extrabold text-bermellon-600">
                  🗑
                </button>
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2 text-sm">
                <Num label="Empanadas" value={o.empanadas} onSet={(v) => guardarOferta({ ...o, empanadas: v })} />
                <Num label="Bebidas" value={o.bebidas} onSet={(v) => guardarOferta({ ...o, bebidas: v })} />
                <Num label="Precio" value={o.precio} onSet={(v) => guardarOferta({ ...o, precio: v })} />
              </div>
              <p className="mt-1 text-xs opacity-60">
                Individual: {fmtCLP(o.empanadas * precioBase + o.bebidas * refBebida)} → ahorro{' '}
                {fmtCLP(Math.max(0, o.empanadas * precioBase + o.bebidas * refBebida - o.precio))}
              </p>
            </div>
          ))}
        </div>
      )}

      {tab === 'reglas' && (
        <div className="mt-4 space-y-3">
          {reglas.length === 0 && (
            <p className="vt-ficha rounded-2xl p-4 text-sm italic opacity-60">Sin reglas activas.</p>
          )}
          {reglas.map((r) => (
            <div key={r.id} className="vt-ficha rounded-2xl p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-extrabold uppercase opacity-60">{r.baseTipo}: {porId[r.baseId]?.nombre || r.baseId}</p>
                  <p className="mt-1 text-sm font-bold">{r.mensaje}</p>
                </div>
                <button onClick={() => borrarRegla(r)} title="Borrar regla"
                  className="btn-tap flex-shrink-0 rounded-full border-2 border-bermellon-500/40 px-2.5 py-1 text-xs font-extrabold text-bermellon-600">
                  🗑
                </button>
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {(r.acompanamientos || []).map((a) => (
                  <span key={a} className="rounded-full bg-[#8b4513]/10 px-2 py-0.5 text-[11px] font-bold">
                    {porId[a]?.emoji} {porId[a]?.nombre || a}
                  </span>
                ))}
              </div>
              <div className="mt-2 flex gap-2">
                <input defaultValue={(r.acompanamientos || []).join(', ')}
                  onBlur={(e) => guardarRegla({ ...r, acompanamientos: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })}
                  placeholder="ids separados por coma"
                  className="vt-input flex-1 rounded-xl px-3 py-2 text-xs" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Num({ label, value, onSet }) {
  return (
    <div>
      <p className="text-xs font-extrabold opacity-60">{label}</p>
      <input type="number" defaultValue={value} onBlur={(e) => onSet(Number(e.target.value))}
        className="vt-input w-full rounded-xl px-2 py-1.5" />
    </div>
  );
}
