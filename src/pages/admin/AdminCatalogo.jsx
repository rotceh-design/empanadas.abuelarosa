import { useState } from 'react';
import { useCatalog } from '../../contexts/CatalogContext';
import { guardarDoc, eliminarDoc } from '../../lib/inventario';
import { AZUCAR_OPCIONES } from '../../data/catalogoSeed';

const AZUCAR_LABEL = Object.fromEntries(AZUCAR_OPCIONES);

export default function AdminCatalogo() {
  const { ingredientes, bebidasTodas, insignias } = useCatalog();
  const [tab, setTab] = useState('ingredientes');
  const [editando, setEditando] = useState(null);
  const [editandoColeccion, setEditandoColeccion] = useState('ingredients');
  const [msg, setMsg] = useState('');

  const guardar = async (datos, coleccion) => {
    setMsg('');
    if (!datos.nombre?.trim()) { setMsg('⚠️ Falta el nombre'); return; }
    try {
      await guardarDoc(coleccion || 'ingredients', datos.id, datos);
      setMsg(`✓ Guardado: ${datos.nombre}`);
    } catch { setMsg('Error al guardar'); }
  };

  const agregar = () => {
    if (tab === 'bebidas') {
      setEditandoColeccion('drinks');
      setEditando({
        id: `beb_${Date.now()}`, categoria: 'bebida', nombre: '', emoji: '🥤', color: '#DC4B3E',
        orden: bebidasTodas.length + 1, disponible: true, precio: 1700, costo: 1000, azucar: 'normal',
      });
      return;
    }
    setEditandoColeccion('ingredients');
    setEditando({
      id: `ing_${Date.now()}`, categoria: 'acompanamiento', linea: 'salada',
      nombre: '', emoji: '✨', color: '#F07613', orden: ingredientes.length + 1,
      disponible: true, tags: [], porcionGramos: 15, costoKg: 3000, precio: 375,
    });
  };

  const eliminar = async (coleccion, id) => {
    try {
      await eliminarDoc(coleccion, id);
      setMsg('Eliminado');
    } catch { setMsg('Error al eliminar'); }
  };

  const esBebida = editandoColeccion === 'drinks';

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="vt-titulo text-3xl">Catálogo</h1>
          <p className="vt-cuerpo text-sm italic opacity-60">Ingredientes, bebidas e insignias</p>
        </div>
        {(tab === 'ingredientes' || tab === 'bebidas') && (
          <button onClick={agregar} className="btn-tap rounded-xl bg-naranja-500 px-3 py-2 text-xs font-extrabold text-white">+ Nuevo</button>
        )}
      </div>

      {msg && <p className="mt-2 rounded-xl bg-verde-400/15 px-3 py-2 text-sm font-bold text-verde-600">{msg}</p>}

      <div className="mt-3 flex gap-2">
        {[['ingredientes', '🥗 Ingredientes'], ['bebidas', '🥤 Bebidas'], ['insignias', '🏅 Insignias']].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`btn-tap rounded-xl px-3 py-2 text-xs font-extrabold ${tab === id ? 'bg-naranja-500 text-white' : 'bg-[#8b4513]/10'}`}>
            {label}
          </button>
        ))}
      </div>

      {editando && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-tierra-900/60 p-4 backdrop-blur-sm sm:items-center">
          <div className="vt-modal max-h-[85vh] w-full max-w-md overflow-y-auto rounded-3xl p-5">
            <h3 className="vt-titulo text-lg">{esBebida ? 'Editar bebida' : 'Editar ingrediente'}</h3>
            <div className="mt-3 space-y-3 text-sm">
              <Field label="Nombre" value={editando.nombre} onChange={(v) => setEditando({ ...editando, nombre: v })} />
              <div className="grid grid-cols-2 gap-2">
                <Field label="Emoji" value={editando.emoji} onChange={(v) => setEditando({ ...editando, emoji: v })} />
                <Field label="Color" type="color" value={editando.color} onChange={(v) => setEditando({ ...editando, color: v })} />
              </div>
              {esBebida ? (
                <>
                  <div className="grid grid-cols-3 gap-2">
                    <Field label="Precio $" type="number" value={editando.precio} onChange={(v) => setEditando({ ...editando, precio: Number(v) })} />
                    <Field label="Costo $" type="number" value={editando.costo} onChange={(v) => setEditando({ ...editando, costo: Number(v) })} />
                    <Field label="Orden" type="number" value={editando.orden} onChange={(v) => setEditando({ ...editando, orden: Number(v) })} />
                  </div>
                  <Select label="Azúcar" value={editando.azucar || 'normal'} onChange={(v) => setEditando({ ...editando, azucar: v })}
                    opciones={AZUCAR_OPCIONES} />
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <Select label="Categoría" value={editando.categoria} onChange={(v) => setEditando({ ...editando, categoria: v })}
                      opciones={[['proteina', 'Proteína'], ['queso', 'Queso'], ['acompanamiento', 'Acompañamiento']]} />
                    <Select label="Línea" value={editando.linea} onChange={(v) => setEditando({ ...editando, linea: v })}
                      opciones={[['salada', 'Salada'], ['dulce', 'Dulce']]} />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <Field label="Porción (g)" type="number" value={editando.porcionGramos} onChange={(v) => setEditando({ ...editando, porcionGramos: Number(v) })} />
                    <Field label="Costo/kg" type="number" value={editando.costoKg} onChange={(v) => setEditando({ ...editando, costoKg: Number(v) })} />
                    <Field label="Aporte $" type="number" value={editando.precio} onChange={(v) => setEditando({ ...editando, precio: Number(v) })} />
                  </div>
                </>
              )}
              <div className="grid grid-cols-2 gap-2">
                {!esBebida && <Field label="Orden" type="number" value={editando.orden} onChange={(v) => setEditando({ ...editando, orden: Number(v) })} />}
                <div>
                  <p className="mb-1 font-extrabold">Disponible</p>
                  <button onClick={() => setEditando({ ...editando, disponible: !editando.disponible })}
                    className={`w-full rounded-2xl px-3 py-2 font-extrabold ${editando.disponible ? 'bg-verde-500 text-white' : 'bg-bermellon-500 text-white'}`}>
                    {editando.disponible ? '✓ Disponible' : '✕ Agotado'}
                  </button>
                </div>
              </div>
              {!esBebida && (
                <div>
                  <p className="mb-1 font-extrabold">Etiquetas</p>
                  <div className="flex flex-wrap gap-2">
                    {['vegana', 'vegano', 'vegetal', 'pescado', 'marisco', 'picante'].map((t) => {
                      const activo = editando.tags.includes(t);
                      return (
                        <button key={t} onClick={() => setEditando({ ...editando, tags: activo ? editando.tags.filter((x) => x !== t) : [...editando.tags, t] })}
                          className={`rounded-full px-2.5 py-1 text-xs font-bold ${activo ? 'bg-verde-500 text-white' : 'bg-[#8b4513]/10'}`}>
                          {t}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            <div className="mt-4 flex gap-2">
              <button onClick={() => setEditando(null)} className="btn-tap flex-1 rounded-2xl border-2 border-[#4a2c17]/40 py-3 font-extrabold">Cancelar</button>
              <button onClick={async () => { await guardar(editando, editandoColeccion); setEditando(null); }} className="btn-tap flex-[2] rounded-2xl bg-naranja-500 py-3 font-extrabold text-white">Guardar</button>
            </div>
          </div>
        </div>
      )}

      {tab === 'ingredientes' && (
        <div className="mt-4 space-y-4">
          {['proteina', 'queso', 'acompanamiento'].map((cat) => (
            <div key={cat}>
              <h3 className="vt-titulo mb-2 text-lg capitalize">{cat}s ({ingredientes.filter((i) => i.categoria === cat).length})</h3>
              <div className="space-y-2">
                {ingredientes.filter((i) => i.categoria === cat).map((ing) => (
                  <div key={ing.id} className="flex items-center gap-3 vt-ficha rounded-2xl p-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full text-xl" style={{ background: `${ing.color}22` }}>{ing.emoji}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-extrabold">{ing.nombre} <span className="text-[10px] opacity-50">({ing.linea})</span></p>
                      <p className="text-xs opacity-60">{ing.porcionGramos}g · ${ing.costoKg}/kg · aporte ${ing.precio ?? '—'} {ing.disponible === false && '· AGOTADO'}</p>
                    </div>
                    <button onClick={() => { setEditandoColeccion('ingredients'); setEditando({ ...ing, tags: ing.tags || [] }); }} className="btn-tap vt-btn-fantasma rounded-xl px-3 py-2 text-xs">Editar</button>
                    <button onClick={() => { guardar({ ...ing, disponible: ing.disponible === false }, 'ingredients'); }} className="btn-tap vt-btn-fantasma rounded-xl px-3 py-2 text-xs" title="Alternar disponible">
                      {ing.disponible === false ? '✕' : '✓'}
                    </button>
                    <button onClick={() => eliminar('ingredients', ing.id)} className="btn-tap rounded-xl px-2 py-2 text-xs font-extrabold text-bermellon-500">🗑</button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'bebidas' && (
        <div className="mt-4 space-y-2">
          {bebidasTodas.map((b) => (
            <div key={b.id} className="flex items-center gap-3 vt-ficha rounded-2xl p-3">
              <span className="text-2xl">{b.emoji}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-extrabold">
                  {b.nombre}{' '}
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                    b.azucar === 'sin_azucar' ? 'bg-verde-500/15 text-verde-700'
                      : b.azucar === 'azucarada' ? 'bg-amber-500/20 text-amber-700'
                        : 'bg-[#8b4513]/10'
                  }`}>
                    {AZUCAR_LABEL[b.azucar || 'normal']}
                  </span>
                  {b.disponible === false && <span className="ml-1 text-[10px] font-bold text-bermellon-500">· AGOTADA</span>}
                </p>
                <p className="text-xs opacity-60">${b.precio} · costo ${b.costo} {typeof b.stockUnidades === 'number' && `· stock ${b.stockUnidades} u.`}</p>
              </div>
              <button onClick={() => { setEditandoColeccion('drinks'); setEditando({ ...b }); }} className="btn-tap vt-btn-fantasma rounded-xl px-3 py-2 text-xs">Editar</button>
              <button onClick={() => { guardar({ ...b, disponible: b.disponible === false }, 'drinks'); }} className="btn-tap vt-btn-fantasma rounded-xl px-3 py-2 text-xs" title="Alternar disponible">
                {b.disponible === false ? '✕' : '✓'}
              </button>
              <button onClick={() => eliminar('drinks', b.id)} className="btn-tap rounded-xl px-2 py-2 text-xs font-extrabold text-bermellon-500">🗑</button>
            </div>
          ))}
          {bebidasTodas.length === 0 && (
            <p className="vt-ficha rounded-2xl p-6 text-center opacity-60">Aún no hay bebidas — crea la primera con "+ Nuevo".</p>
          )}
        </div>
      )}

      {tab === 'insignias' && (
        <div className="mt-4 space-y-2">
          {insignias.map((i) => (
            <div key={i.id} className="flex items-center gap-3 vt-ficha rounded-2xl p-3">
              <span className="text-2xl">{i.icono}</span>
              <div className="flex-1">
                <p className="text-sm font-extrabold">{i.nombre}</p>
                <p className="text-xs opacity-60">{i.descripcion} · cupón: {i.cupon || '—'}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange, type = 'text' }) {
  return (
    <div>
      <p className="mb-1 font-extrabold">{label}</p>
      <input type={type} value={value ?? ''} onChange={(e) => onChange(e.target.value)}
        className="vt-input w-full px-3 py-2" />
    </div>
  );
}

function Select({ label, value, onChange, opciones }) {
  return (
    <div>
      <p className="mb-1 font-extrabold">{label}</p>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="vt-input w-full px-3 py-2">
        {opciones.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </div>
  );
}
