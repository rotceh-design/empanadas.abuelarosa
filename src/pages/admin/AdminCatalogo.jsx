import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCatalog } from '../../contexts/CatalogContext';
import { guardarDoc, eliminarDoc } from '../../lib/inventario';
import { comprimirImagen } from '../../lib/fotos';
import { AZUCAR_OPCIONES } from '../../data/catalogoSeed';
import { IconoIngrediente } from '../../components/Iconos';
import { Esquina, SeparadorOrnamental } from '../../components/vintage/Ornamentos';
import {
  IconoIngredientes, IconoBebidas, IconoInsignias, IconoBasura,
} from '../../components/IconosAdmin';

const AZUCAR_LABEL = Object.fromEntries(AZUCAR_OPCIONES);

const TABS = [
  { id: 'ingredientes', label: 'Ingredientes', icon: IconoIngredientes },
  { id: 'bebidas', label: 'Bebidas', icon: IconoBebidas },
  { id: 'insignias', label: 'Insignias', icon: IconoInsignias },
];

const CONDICION_TIPOS = [
  ['proteinasDistintas', 'Proteínas distintas'],
  ['quesosDistintos', 'Quesos distintos'],
  ['veggieCount', 'Pedidos vegetarianos'],
  ['marCount', 'Pedidos de mar'],
  ['pedidos', 'Pedidos totales'],
];

export default function AdminCatalogo() {
  const { ingredientes, bebidasTodas, insignias } = useCatalog();
  const [tab, setTab] = useState('ingredientes');
  const [editando, setEditando] = useState(null);
  const [editandoColeccion, setEditandoColeccion] = useState('ingredients');
  const [msg, setMsg] = useState(null);

  const aviso = (texto, tipo = 'ok') => setMsg({ texto, tipo });

  const guardar = async (datos, coleccion) => {
    setMsg(null);
    const col = coleccion || 'ingredients';
    if (!datos.nombre?.trim()) { aviso('Falta el nombre', 'error'); return false; }
    try {
      const fila = col === 'badges' ? prepararBadge(datos) : datos;
      await guardarDoc(col, datos.id, fila);
      aviso(`Guardado: ${datos.nombre}`);
      return true;
    } catch (e) {
      const msg = String(e?.message || e?.hint || '');
      const esRed = /failed to fetch|networkerror|load failed/i.test(msg);
      const faltaFoto = msg.toLowerCase().includes('foto');
      aviso(
        esRed
          ? 'Sin conexión a Supabase: revisa que el proyecto no esté pausado y que las variables VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY estén bien en Vercel'
          : faltaFoto
            ? 'Falta la migración de fotos en Supabase (columna foto) — corre el SQL y reintenta'
            : `No se pudo guardar${msg ? `: ${msg.slice(0, 140)}` : ''}`,
        'error',
      );
      return false;
    }
  };

  const eliminar = async (coleccion, id) => {
    try {
      await eliminarDoc(coleccion, id);
      aviso('Eliminado');
    } catch { aviso('No se pudo eliminar', 'error'); }
  };

  const agregar = () => {
    if (tab === 'bebidas') {
      setEditandoColeccion('drinks');
      setEditando({
        id: `beb_${Date.now()}`, categoria: 'bebida', nombre: '', color: '#DC4B3E',
        orden: bebidasTodas.length + 1, disponible: true, precio: 1700, costo: 1000, azucar: 'normal',
      });
      return;
    }
    if (tab === 'insignias') {
      setEditandoColeccion('badges');
      setEditando({
        id: `ins_${Date.now()}`, nombre: '', descripcion: '', icono: '',
        condicionTipo: 'pedidos', condicionValor: 5, cupon: '',
      });
      return;
    }
    setEditandoColeccion('ingredients');
    setEditando({
      id: `ing_${Date.now()}`, categoria: 'acompanamiento', linea: 'salada',
      nombre: '', color: '#F07613', orden: ingredientes.length + 1,
      disponible: true, tags: [], porcionGramos: 15, costoKg: 3000, precio: 375,
    });
  };

  const abrir = (coleccion, datos) => {
    setEditandoColeccion(coleccion);
    if (coleccion === 'badges') {
      setEditando({
        ...datos,
        condicionTipo: datos.condicion?.tipo || 'pedidos',
        condicionValor: datos.condicion?.valor ?? 1,
      });
    } else {
      setEditando({ ...datos, tags: datos.tags || [] });
    }
  };

  const subirFoto = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !editando) return;
    try {
      const c = await comprimirImagen(file, { maxLado: 384, calidad: 0.62, maxKB: 18 });
      setEditando((prev) => ({ ...prev, foto: c.dataUrl }));
      aviso(`Foto lista (${Math.round(c.bytes / 1024)} KB)`);
    } catch (err) {
      aviso(err?.message || 'No se pudo leer la imagen', 'error');
    }
  };

  const esBebida = editandoColeccion === 'drinks';
  const esInsignia = editandoColeccion === 'badges';

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="vt-titulo text-3xl">Catálogo</h1>
          <p className="vt-cuerpo text-sm italic opacity-60">Ingredientes, bebidas e insignias</p>
        </div>
        <button onClick={agregar} className="btn-tap vt-btn rounded-full px-4 py-2 text-xs">+ Nuevo</button>
      </div>

      {msg && (
        <p className={`mt-2 rounded-xl px-3 py-2 text-sm font-bold ${
          msg.tipo === 'error' ? 'bg-bermellon-500/15 text-bermellon-600' : 'bg-verde-400/15 text-verde-600'
        }`}>
          {msg.texto}
        </p>
      )}

      <div className="mt-3 flex gap-2">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`btn-tap vt-serif flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-extrabold uppercase tracking-wide ${
              tab === t.id ? 'bg-naranja-500 text-white' : 'bg-[#8b4513]/10'
            }`}>
            <t.icon size={14} />
            {t.label}
          </button>
        ))}
      </div>

      <AnimatePresence>
        {editando && (
          <motion.div
            className="vt-modal-fondo fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setEditando(null)}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={esInsignia ? 'Editar insignia' : esBebida ? 'Editar bebida' : 'Editar ingrediente'}
              className="vt-modal relative w-full max-w-lg overflow-hidden rounded-[1.75rem]"
              initial={{ scale: 0.92, y: 18 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.94, y: 12 }}
              transition={{ type: 'spring', stiffness: 240, damping: 24 }}
              onClick={(e) => e.stopPropagation()}
            >
              <Esquina className="pointer-events-none absolute left-1 top-1 z-10" size={44} />
              <Esquina className="pointer-events-none absolute right-1 top-1 z-10 rotate-90" size={44} />

              {/* Encabezado: sello con la cara del ingrediente + ornamento */}
              <div className="px-6 pt-6 text-center">
                <span
                  className="relative mx-auto flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border-[3px] border-[#4a2c17]"
                  style={{
                    background: `${editando.color || '#8b4513'}22`,
                    boxShadow: 'inset 0 0 0 2px #f3e6c8, inset 0 0 0 4px #4a2c17',
                  }}
                >
                  {editando.foto
                    ? <img src={editando.foto} alt="" className="h-full w-full object-cover" />
                    : <IconoIngrediente ing={esBebida ? { ...editando, categoria: 'bebida' } : editando} size={30} />}
                </span>
                <h3 className="vt-titulo mt-2.5 text-xl uppercase tracking-wide sm:text-2xl">
                  {esInsignia ? 'Insignia' : esBebida ? 'Bebida' : 'Ingrediente'}
                </h3>
                <p className="vt-cuerpo mt-0.5 text-xs italic opacity-60">
                  {editando.nombre?.trim() ? editando.nombre : 'Nuevo registro del catálogo'}
                </p>
                <SeparadorOrnamental className="mx-auto mt-3 w-44" />
              </div>

              {msg && (
                <p className={`mx-6 mt-3 rounded-xl border-2 px-3 py-2 text-center vt-cuerpo text-sm font-bold ${
                  msg.tipo === 'error'
                    ? 'border-bermellon-500/40 bg-bermellon-500/10 text-bermellon-500'
                    : 'border-verde-600/40 bg-verde-600/10 text-verde-600'
                }`}>
                  {msg.texto}
                </p>
              )}

              <div className="max-h-[52vh] space-y-5 overflow-y-auto px-6 pb-2 pt-4">
                {esInsignia ? (
                  <>
                    <Seccion titulo="Identidad">
                      <Field label="Nombre" value={editando.nombre} onChange={(v) => setEditando({ ...editando, nombre: v })} />
                      <Field label="Descripción" value={editando.descripcion || ''} onChange={(v) => setEditando({ ...editando, descripcion: v })} />
                    </Seccion>
                    <Seccion titulo="Condición">
                      <div className="grid grid-cols-2 gap-3">
                        <Select label="Condición" value={editando.condicionTipo} onChange={(v) => setEditando({ ...editando, condicionTipo: v })}
                          opciones={CONDICION_TIPOS} />
                        <Field label="Cantidad" type="number" value={editando.condicionValor} onChange={(v) => setEditando({ ...editando, condicionValor: Number(v) })} />
                      </div>
                    </Seccion>
                    <Seccion titulo="Apariencia">
                      <div className="grid grid-cols-2 gap-3">
                        <Field label="Icono (emoji o texto)" value={editando.icono || ''} onChange={(v) => setEditando({ ...editando, icono: v })} />
                        <Field label="Cupón" value={editando.cupon || ''} onChange={(v) => setEditando({ ...editando, cupon: v })} />
                      </div>
                    </Seccion>
                  </>
                ) : (
                  <>
                    <Seccion titulo="Identidad">
                      <Field label="Nombre" value={editando.nombre} onChange={(v) => setEditando({ ...editando, nombre: v })} />
                      <div className={`grid gap-3 ${esBebida ? 'grid-cols-1' : 'grid-cols-2'}`}>
                        <CampoColor value={editando.color} onChange={(v) => setEditando({ ...editando, color: v })} />
                        {!esBebida && (
                          <Select label="Categoría" value={editando.categoria} onChange={(v) => setEditando({ ...editando, categoria: v })}
                            opciones={[['proteina', 'Proteína'], ['queso', 'Queso'], ['acompanamiento', 'Acompañamiento']]} />
                        )}
                      </div>
                      {!esBebida && (
                        <Select label="Línea" value={editando.linea} onChange={(v) => setEditando({ ...editando, linea: v })}
                          opciones={[['salada', 'Salada'], ['dulce', 'Dulce']]} />
                      )}
                      {esBebida && (
                        <Select label="Azúcar" value={editando.azucar || 'normal'} onChange={(v) => setEditando({ ...editando, azucar: v })}
                          opciones={AZUCAR_OPCIONES} />
                      )}
                    </Seccion>

                    <Seccion titulo={esBebida ? 'Precios' : 'Receta y costos'}>
                      {esBebida ? (
                        <div className="grid grid-cols-3 gap-3">
                          <Field label="Precio" sufijo="$" type="number" value={editando.precio} onChange={(v) => setEditando({ ...editando, precio: Number(v) })} />
                          <Field label="Costo" sufijo="$" type="number" value={editando.costo} onChange={(v) => setEditando({ ...editando, costo: Number(v) })} />
                          <Field label="Orden" type="number" value={editando.orden} onChange={(v) => setEditando({ ...editando, orden: Number(v) })} />
                        </div>
                      ) : (
                        <div className="grid grid-cols-3 gap-3">
                          <Field label="Porción" sufijo="g" type="number" value={editando.porcionGramos} onChange={(v) => setEditando({ ...editando, porcionGramos: Number(v) })} />
                          <Field label="Costo/kg" sufijo="$" type="number" value={editando.costoKg} onChange={(v) => setEditando({ ...editando, costoKg: Number(v) })} />
                          <Field label="Aporte" sufijo="$" type="number" value={editando.precio} onChange={(v) => setEditando({ ...editando, precio: Number(v) })} />
                        </div>
                      )}
                    </Seccion>

                    <Seccion titulo="Ficha">
                      <div className="flex items-center gap-4">
                        <span
                          className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-[#4a2c17]"
                          style={{ background: `${editando.color || '#8b4513'}22`, boxShadow: 'inset 0 0 0 2px #f3e6c8, inset 0 0 0 3.5px #4a2c17' }}
                        >
                          {editando.foto
                            ? <img src={editando.foto} alt="" className="h-full w-full object-cover" />
                            : <IconoIngrediente ing={esBebida ? { ...editando, categoria: 'bebida' } : editando} size={26} />}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap gap-2">
                            <label className="btn-tap vt-btn-fantasma cursor-pointer rounded-full px-4 py-1.5 text-[0.65rem]">
                              {editando.foto ? 'Cambiar foto' : 'Subir foto'}
                              <input type="file" accept="image/*" className="hidden" onChange={subirFoto} />
                            </label>
                            {editando.foto && (
                              <button onClick={() => setEditando({ ...editando, foto: null })}
                                className="btn-tap vt-btn-fantasma rounded-full px-4 py-1.5 text-[0.65rem]">
                                Quitar
                              </button>
                            )}
                          </div>
                          <p className="vt-cuerpo mt-1.5 text-[11px] italic opacity-55">
                            Se usa en el panel y en la tienda. Sin foto, se dibuja el icono SVG.
                          </p>
                        </div>
                      </div>
                      {!esBebida && (
                        <div>
                          <Etiqueta>Etiquetas</Etiqueta>
                          <div className="mt-1.5 flex flex-wrap gap-2">
                            {['vegana', 'vegano', 'vegetal', 'pescado', 'marisco', 'picante'].map((t) => {
                              const activo = (editando.tags || []).includes(t);
                              return (
                                <button key={t} onClick={() => setEditando({ ...editando, tags: activo ? editando.tags.filter((x) => x !== t) : [...(editando.tags || []), t] })}
                                  className={`btn-tap vt-serif rounded-full border-2 px-3 py-1 text-[0.65rem] font-bold uppercase tracking-wider transition-colors ${
                                    activo
                                      ? 'border-[#4a2c17] bg-[#4a2c17] text-[#f3e6c8]'
                                      : 'border-[#4a2c17]/30 bg-[#8b4513]/10 text-[#4a2c17]'
                                  }`}>
                                  {t}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      {!esBebida && (
                        <div className="grid grid-cols-2 items-end gap-3">
                          <Field label="Orden" type="number" value={editando.orden} onChange={(v) => setEditando({ ...editando, orden: Number(v) })} />
                          <div>
                            <Etiqueta>Disponible</Etiqueta>
                            <button onClick={() => setEditando({ ...editando, disponible: !editando.disponible })}
                              className={`btn-tap vt-serif mt-1.5 w-full rounded-full border-2 px-3 py-2 text-[0.65rem] font-bold uppercase tracking-wider transition-colors ${
                                editando.disponible
                                  ? 'border-[#3B7A3E] bg-[#3B7A3E] text-[#f3e6c8]'
                                  : 'border-[#B5402F] bg-[#B5402F] text-[#f3e6c8]'
                              }`}>
                              {editando.disponible ? '✓ Disponible' : '✕ Agotado'}
                            </button>
                          </div>
                        </div>
                      )}
                      {esBebida && (
                        <div>
                          <Etiqueta>Disponible</Etiqueta>
                          <button onClick={() => setEditando({ ...editando, disponible: !editando.disponible })}
                            className={`btn-tap vt-serif mt-1.5 w-full rounded-full border-2 px-3 py-2 text-[0.65rem] font-bold uppercase tracking-wider transition-colors ${
                              editando.disponible
                                ? 'border-[#3B7A3E] bg-[#3B7A3E] text-[#f3e6c8]'
                                : 'border-[#B5402F] bg-[#B5402F] text-[#f3e6c8]'
                            }`}>
                            {editando.disponible ? '✓ Disponible' : '✕ Agotado'}
                          </button>
                        </div>
                      )}
                    </Seccion>
                  </>
                )}
              </div>

              <div className="px-6 pb-6 pt-3">
                <SeparadorOrnamental className="mb-4 w-32 opacity-60" />
                <div className="flex gap-2.5">
                  <button onClick={() => setEditando(null)} className="btn-tap vt-btn-fantasma flex-1 rounded-full py-3 text-xs">
                    Cancelar
                  </button>
                  <button
                    onClick={async () => {
                      const okGuardar = await guardar(editando, editandoColeccion);
                      if (okGuardar) setEditando(null);
                    }}
                    className="btn-tap vt-btn flex-[2] rounded-full py-3 text-sm">
                    Guardar
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {tab === 'ingredientes' && (
        <div className="mt-4 space-y-4">
          {['proteina', 'queso', 'acompanamiento'].map((cat) => (
            <div key={cat}>
              <h3 className="vt-titulo mb-2 text-lg capitalize">{cat}s ({ingredientes.filter((i) => i.categoria === cat).length})</h3>
              <div className="space-y-2">
                {ingredientes.filter((i) => i.categoria === cat).map((ing) => (
                  <div key={ing.id} className="flex items-center gap-3 vt-ficha rounded-2xl p-3">
                    <AvatarFicha item={ing} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-extrabold">{ing.nombre} <span className="text-[10px] opacity-50">({ing.linea})</span></p>
                      <p className="text-xs opacity-60">{ing.porcionGramos}g · ${ing.costoKg}/kg · aporte ${ing.precio ?? '—'} {ing.disponible === false && '· AGOTADO'}</p>
                    </div>
                    <button onClick={() => abrir('ingredients', ing)} className="btn-tap vt-btn-fantasma rounded-xl px-3 py-2 text-xs">Editar</button>
                    <button onClick={() => { guardar({ ...ing, disponible: ing.disponible === false }, 'ingredients'); }} className="btn-tap vt-btn-fantasma rounded-xl px-3 py-2 text-xs" title="Alternar disponible">
                      {ing.disponible === false ? '✕' : '✓'}
                    </button>
                    <button onClick={() => eliminar('ingredients', ing.id)} className="btn-tap vt-btn-fantasma rounded-xl p-2 text-bermellon-500" title="Eliminar">
                      <IconoBasura size={16} />
                    </button>
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
              <AvatarFicha item={b} esBebida />
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
              <button onClick={() => abrir('drinks', b)} className="btn-tap vt-btn-fantasma rounded-xl px-3 py-2 text-xs">Editar</button>
              <button onClick={() => { guardar({ ...b, disponible: b.disponible === false }, 'drinks'); }} className="btn-tap vt-btn-fantasma rounded-xl px-3 py-2 text-xs" title="Alternar disponible">
                {b.disponible === false ? '✕' : '✓'}
              </button>
              <button onClick={() => eliminar('drinks', b.id)} className="btn-tap vt-btn-fantasma rounded-xl p-2 text-bermellon-500" title="Eliminar">
                <IconoBasura size={16} />
              </button>
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
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#8b4513]/10 text-xl">
                {i.icono || <IconoInsignias size={20} />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-extrabold">{i.nombre}</p>
                <p className="truncate text-xs opacity-60">
                  {i.descripcion} · {CONDICION_TIPOS.find(([t]) => t === i.condicion?.tipo)?.[1] || i.condicion?.tipo} {i.condicion?.valor} · cupón: {i.cupon || '—'}
                </p>
              </div>
              <button onClick={() => abrir('badges', i)} className="btn-tap vt-btn-fantasma rounded-xl px-3 py-2 text-xs">Editar</button>
              <button onClick={() => eliminar('badges', i.id)} className="btn-tap vt-btn-fantasma rounded-xl p-2 text-bermellon-500" title="Eliminar">
                <IconoBasura size={16} />
              </button>
            </div>
          ))}
          {insignias.length === 0 && (
            <p className="vt-ficha rounded-2xl p-6 text-center opacity-60">Aún no hay insignias — crea la primera con "+ Nuevo".</p>
          )}
        </div>
      )}
    </div>
  );
}

// Avatar del panel: foto real si existe; si no, el icono SVG de la tienda.
function AvatarFicha({ item, esBebida = false }) {
  return (
    <span
      className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full"
      style={{ background: `${item.color || '#8b4513'}22` }}
    >
      {item.foto
        ? <img src={item.foto} alt="" className="h-full w-full object-cover" />
        : <IconoIngrediente ing={esBebida ? { ...item, categoria: 'bebida' } : item} size={22} />}
    </span>
  );
}

// Limpia campos de formulario antes de guardar una insignia.
function prepararBadge(datos) {
  const { condicionTipo, condicionValor, ...resto } = datos;
  return {
    ...resto,
    condicion: { tipo: condicionTipo || 'pedidos', valor: Number(condicionValor) || 0 },
  };
}

// Etiqueta de campo, en versalitas Cinzel del concepto vintage.
function Etiqueta({ children }) {
  return (
    <span className="vt-serif block text-[0.65rem] font-bold uppercase tracking-[0.2em] text-[#5c3a21]">
      {children}
    </span>
  );
}

// Sección del formulario con rótulo entre líneas (concepto pergamino).
function Seccion({ titulo, children }) {
  return (
    <section>
      <p className="vt-serif mb-2.5 flex items-center gap-2.5 text-[0.65rem] font-bold uppercase tracking-[0.25em] text-[#8b4513]">
        <span className="h-px flex-1 bg-[#4a2c17]/25" />
        {titulo}
        <span className="h-px flex-1 bg-[#4a2c17]/25" />
      </p>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Field({ label, value, onChange, type = 'text', sufijo }) {
  return (
    <label className="block">
      <Etiqueta>{label}</Etiqueta>
      <span className="relative mt-1 block">
        <input type={type} value={value ?? ''} onChange={(e) => onChange(e.target.value)}
          className="vt-input w-full px-3 py-2.5 text-sm" />
        {sufijo && (
          <span className="vt-serif pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold opacity-45">
            {sufijo}
          </span>
        )}
      </span>
    </label>
  );
}

function Select({ label, value, onChange, opciones }) {
  return (
    <label className="block">
      <Etiqueta>{label}</Etiqueta>
      <span className="relative mt-1 block">
        <select value={value} onChange={(e) => onChange(e.target.value)}
          className="vt-input w-full appearance-none px-3 py-2.5 pr-9 text-sm">
          {opciones.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <svg viewBox="0 0 12 8" className="pointer-events-none absolute right-3 top-1/2 h-2 w-3 -translate-y-1/2" aria-hidden>
          <path d="M1 1.5 L6 6.5 L11 1.5" stroke="#4a2c17" strokeWidth="2" strokeLinecap="round" fill="none" />
        </svg>
      </span>
    </label>
  );
}

// Selector de color como sello circular (abre el selector nativo al tocarlo).
function CampoColor({ value, onChange }) {
  return (
    <div>
      <Etiqueta>Color</Etiqueta>
      <div className="mt-1.5 flex items-center gap-3">
        <label className="btn-tap relative h-10 w-10 shrink-0 cursor-pointer rounded-full border-2 border-[#4a2c17]"
          style={{ background: value || '#8b4513', boxShadow: 'inset 0 0 0 2px #f3e6c8' }}>
          <input type="color" value={value || '#8b4513'} onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0" aria-label="Elegir color" />
        </label>
        <span className="vt-cuerpo text-xs italic opacity-55">{value}</span>
      </div>
    </div>
  );
}
