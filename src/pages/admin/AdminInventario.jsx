import { useEffect, useMemo, useState } from 'react';
import { useCatalog } from '../../contexts/CatalogContext';
import { fmtCLP } from '../../lib/formato';
import { alertasStock, rendimientoEmpanadas, rendimientoBebidas, UMBRAL_DEFECTO } from '../../lib/stock';
import { guardarDoc, guardarSettingsPatch, registrarMovimiento, leerLog } from '../../lib/inventario';
import { IconoIngrediente, AvatarIngrediente } from '../../components/Iconos';
import {
  IconoAlerta, IconoMasa, IconoBebidas, IconoReloj, IconoCompra, IconoConteo,
} from '../../components/IconosAdmin';

export default function AdminInventario() {
  const { ingredientes, bebidasTodas, settings } = useCatalog();
  const [msg, setMsg] = useState('');
  const [modal, setModal] = useState(null); // { modo: 'compra'|'conteo', naturaleza, item }
  const [log, setLog] = useState([]);
  const [umbralTexto, setUmbralTexto] = useState('');

  const umbral = settings?.inventario?.umbralEmpanadas ?? UMBRAL_DEFECTO;
  const inv = settings?.inventario || {};

  const refrescarLog = () => leerLog(25).then(setLog).catch(() => setLog([]));
  useEffect(() => { refrescarLog(); }, []);
  useEffect(() => { setUmbralTexto(String(umbral)); }, [umbral]);

  const alertas = useMemo(
    () => alertasStock({ ingredientes, bebidas: bebidasTodas, settings }),
    [ingredientes, bebidasTodas, settings],
  );

  const stockDe = (naturaleza, item) => {
    if (naturaleza === 'masa') return inv.masaGramos;
    if (naturaleza === 'bebida') return item?.stockUnidades;
    return item?.stockGramos;
  };

  const rendimientoDe = (naturaleza, item) => {
    if (naturaleza === 'masa') {
      return typeof inv.masaGramos === 'number'
        ? Math.floor(inv.masaGramos / (settings?.masa?.porcionGramos || 90))
        : null;
    }
    if (naturaleza === 'bebida') return rendimientoBebidas(item?.stockUnidades);
    return rendimientoEmpanadas(item);
  };

  const guardarUmbral = async () => {
    const n = Math.max(0, Number(umbralTexto) || 0);
    try {
      await guardarSettingsPatch({ inventario: { ...inv, umbralEmpanadas: n } });
      setMsg(`✓ Alerta configurada: ≤ ${n} empanadas`);
    } catch { setMsg('Error al guardar la alerta'); }
  };

  const aplicarValor = async (naturaleza, item, valor) => {
    if (naturaleza === 'masa') {
      await guardarSettingsPatch({ inventario: { ...inv, masaGramos: valor } });
    } else if (naturaleza === 'bebida') {
      await guardarDoc('drinks', item.id, { stockUnidades: valor });
    } else {
      await guardarDoc('ingredients', item.id, { stockGramos: valor });
    }
  };

  const grupos = [
    { cat: 'proteina', label: 'Proteínas', lista: ingredientes.filter((i) => i.categoria === 'proteina') },
    { cat: 'queso', label: 'Quesos', lista: ingredientes.filter((i) => i.categoria === 'queso') },
    { cat: 'acompanamiento', label: 'Acompañamientos', lista: ingredientes.filter((i) => i.categoria === 'acompanamiento') },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="vt-titulo text-3xl">Inventario</h1>
          <p className="vt-cuerpo text-sm italic opacity-60">Stock en gramos · alerta cuando rinde ≤ a cierto número de empanadas</p>
        </div>
        <div className="flex items-end gap-2">
          <div>
            <p className="mb-1 text-[11px] font-extrabold uppercase tracking-wide opacity-60">Alerta desde</p>
            <input
              type="number" min="0" value={umbralTexto}
              onChange={(e) => setUmbralTexto(e.target.value)}
              onBlur={guardarUmbral}
              className="vt-input w-24 px-3 py-2 text-sm"
            />
          </div>
          <span className="pb-2 text-xs font-bold opacity-60">empanadas</span>
        </div>
      </div>

      {msg && <p className="mt-2 rounded-xl bg-verde-400/15 px-3 py-2 text-sm font-bold text-verde-600">{msg}</p>}

      {alertas.length > 0 && (
        <div className="mt-4 rounded-3xl border-2 border-bermellon-500/40 bg-bermellon-500/10 p-4">
          <h3 className="vt-serif flex items-center gap-2 text-lg font-extrabold text-bermellon-600">
            <IconoAlerta size={18} /> Renovar pronto ({alertas.length})
          </h3>
          <ul className="mt-2 flex flex-wrap gap-2">
            {alertas.map((a) => (
              <li key={`${a.tipo}-${a.id}`} className="vt-ficha flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-extrabold">
                <AvatarIngrediente ing={{ id: a.id, foto: a.foto }} size={13} />
                {a.nombre} — {a.rendimiento === 0 ? 'AGOTADO' : `quedan ${a.rendimiento} ${a.unidades ? 'u.' : 'emp.'}`}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Masa */}
      <div className="mt-4">
        <h3 className="mb-2 vt-titulo flex items-center gap-2"><IconoMasa size={17} className="opacity-70" /> Masa</h3>
        <FilaStock
          nombre={settings?.masa?.nombre || 'Masa de empanada'}
          stock={stockDe('masa')}
          rendimiento={rendimientoDe('masa')}
          unidades={false}
          umbral={umbral}
          onCompra={() => setModal({ modo: 'compra', naturaleza: 'masa', item: null })}
          onConteo={() => setModal({ modo: 'conteo', naturaleza: 'masa', item: null })}
        />
      </div>

      {grupos.map((g) => (
        <div key={g.cat} className="mt-5">
          <h3 className="mb-2 vt-titulo flex items-center gap-2">
            <IconoIngrediente ing={{ categoria: g.cat }} size={17} />
            {g.label} ({g.lista.length})
          </h3>
          <div className="space-y-2">
            {g.lista.map((ing) => (
              <FilaStock
                key={ing.id}
                nombre={ing.nombre}
                foto={ing.foto}
                iconoId={ing.id}
                stock={stockDe('ingrediente', ing)}
                rendimiento={rendimientoDe('ingrediente', ing)}
                unidades={false}
                umbral={umbral}
                onCompra={() => setModal({ modo: 'compra', naturaleza: 'ingrediente', item: ing })}
                onConteo={() => setModal({ modo: 'conteo', naturaleza: 'ingrediente', item: ing })}
              />
            ))}
          </div>
        </div>
      ))}

      <div className="mt-5">
        <h3 className="mb-2 vt-titulo flex items-center gap-2"><IconoBebidas size={17} className="opacity-70" /> Bebidas ({bebidasTodas.length})</h3>
        <div className="space-y-2">
          {bebidasTodas.map((b) => (
            <FilaStock
              key={b.id}
              nombre={b.nombre}
              foto={b.foto}
              iconoId={b.id}
              stock={stockDe('bebida', b)}
              rendimiento={rendimientoDe('bebida', b)}
              unidades
              umbral={umbral}
              onCompra={() => setModal({ modo: 'compra', naturaleza: 'bebida', item: b })}
              onConteo={() => setModal({ modo: 'conteo', naturaleza: 'bebida', item: b })}
            />
          ))}
        </div>
      </div>

      {log.length > 0 && (
        <div className="vt-ficha mt-6 rounded-3xl p-4">
          <h3 className="vt-titulo flex items-center gap-2"><IconoReloj size={17} className="opacity-70" /> Historial de movimientos</h3>
          <ul className="mt-2 space-y-1.5 text-sm">
            {log.map((l, i) => (
              <li key={l.id || i} className="flex flex-wrap items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 font-bold">
                  {l.tipo === 'compra' ? <IconoCompra size={14} /> : <IconoConteo size={14} />}
                  {l.nombre} — {l.tipo === 'compra' ? 'compra' : 'conteo'}
                  {typeof l.gramos === 'number' && ` · ${fmtNum(l.gramos)}${l.naturaleza === 'bebida' ? ' u.' : ' g'}`}
                  {typeof l.costo === 'number' && l.costo > 0 && ` · ${fmtCLP(l.costo)}`}
                </span>
                <span className="text-xs opacity-60">
                  {typeof l.merma === 'number' && l.merma !== 0 && (
                    <b className={l.merma > 0 ? 'text-bermellon-500' : 'text-verde-600'}>
                      merma {fmtNum(Math.abs(l.merma))} g{l.mermaCLP ? ` · ${fmtCLP(Math.abs(l.mermaCLP))}` : ''} ·{' '}
                    </b>
                  )}
                  {fechaCorta(l.fecha)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {modal && (
        <ModalMovimiento
          {...modal}
          stockActual={stockDe(modal.naturaleza, modal.item)}
          settings={settings}
          onCerrar={() => setModal(null)}
          onGuardar={async (payload) => {
            try {
              await aplicarValor(modal.naturaleza, modal.item, payload.nuevoStock);
              await registrarMovimiento({
                tipo: payload.modo,
                naturaleza: modal.naturaleza,
                id: modal.item?.id || 'masa',
                nombre: modal.item?.nombre || settings?.masa?.nombre || 'Masa',
                gramos: payload.gramos,
                costo: payload.costo,
                costoKg: modal.item?.costoKg,
                esperado: payload.esperado,
                real: payload.real,
                merma: payload.merma,
                mermaCLP: payload.mermaCLP,
                nota: payload.nota,
              });
              setMsg(`✓ ${payload.modo === 'compra' ? 'Compra registrada' : 'Conteo guardado'}: ${modal.item?.nombre || 'Masa'}`);
              setModal(null);
              refrescarLog();
            } catch { setMsg('Error al guardar el movimiento'); }
          }}
        />
      )}
    </div>
  );
}

function FilaStock({ nombre, foto, iconoId, stock, rendimiento, unidades, umbral, onCompra, onConteo }) {
  const chip = rendimiento === null
    ? 'bg-[#8b4513]/10 text-tierra-700 opacity-70'
    : rendimiento === 0
      ? 'bg-bermellon-500 text-white'
      : rendimiento <= umbral
        ? 'bg-amber-500/20 text-amber-700'
        : 'bg-verde-500/15 text-verde-700';
  return (
    <div className="vt-ficha flex items-center gap-3 rounded-2xl p-3">
      <AvatarIngrediente ing={{ id: iconoId, foto }} size={17} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-extrabold">{nombre}</p>
        <p className="text-xs opacity-60">
          {typeof stock === 'number' ? `${fmtNum(stock)} ${unidades ? 'u.' : 'g'}` : 'Stock sin cargar'}
        </p>
      </div>
      <span className={`rounded-full px-2.5 py-1 text-[11px] font-extrabold ${chip}`}>
        {rendimiento === null ? 'sin cargar' : rendimiento === 0 ? 'AGOTADO' : `${rendimiento} ${unidades ? 'u.' : 'emp.'}`}
      </span>
      <button onClick={onCompra} className="btn-tap vt-btn-fantasma rounded-xl px-3 py-2 text-xs">+ Compra</button>
      <button onClick={onConteo} className="btn-tap rounded-xl border-2 border-[#4a2c17]/40 px-3 py-2 text-xs font-extrabold">Conteo</button>
    </div>
  );
}

function ModalMovimiento({ modo, naturaleza, item, stockActual, settings, onCerrar, onGuardar }) {
  const unidades = naturaleza === 'bebida';
  const etiquetaCant = unidades ? 'Unidades' : 'Gramos';
  const [cantidad, setCantidad] = useState('');
  const [costo, setCosto] = useState('');
  const [nota, setNota] = useState('');
  const [real, setReal] = useState('');

  const esMasa = naturaleza === 'masa';
  const nombre = item?.nombre || settings?.masa?.nombre || 'Masa';
  const esperado = typeof stockActual === 'number' ? stockActual : 0;

  const confirmar = () => {
    if (modo === 'compra') {
      const gramos = Math.max(0, Number(cantidad) || 0);
      if (!gramos) return;
      onGuardar({
        modo, gramos,
        costo: Number(costo) || 0,
        nota,
        nuevoStock: esperado + gramos,
      });
    } else {
      const r = Number(real);
      if (real === '' || Number.isNaN(r) || r < 0) return;
      const merma = typeof stockActual === 'number' ? Math.round(stockActual - r) : 0;
      const mermaAbs = Math.abs(merma);
      // Bebidas se cuentan por unidad (costo c/u); ingredientes y masa por gramos (costo/kg).
      const mermaCLP = mermaAbs > 0
        ? (naturaleza === 'bebida'
          ? mermaAbs * (item?.costo ?? 0)
          : Math.round((mermaAbs * (naturaleza === 'masa' ? (settings?.masa?.costoKg ?? 0) : (item?.costoKg ?? 0))) / 1000))
        : 0;
      onGuardar({
        modo, gramos: r,
        esperado: typeof stockActual === 'number' ? stockActual : null,
        real: r, merma,
        mermaCLP,
        nuevoStock: r,
        costoKg: naturaleza === 'bebida' ? undefined : (naturaleza === 'masa' ? settings?.masa?.costoKg : item?.costoKg),
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-tierra-900/60 p-4 backdrop-blur-sm sm:items-center">
      <div className="vt-modal w-full max-w-md rounded-3xl p-5">
        <h3 className="vt-titulo flex items-center gap-2 text-lg">
          {modo === 'compra' ? <IconoCompra size={17} /> : <IconoConteo size={17} />}
          {modo === 'compra' ? 'Registrar compra' : 'Conteo físico'} — {nombre}
        </h3>
        <p className="mt-1 text-xs opacity-60">
          Stock actual: {typeof stockActual === 'number' ? `${fmtNum(stockActual)} ${unidades ? 'u.' : 'g'}` : 'sin cargar'}
          {!esMasa && item?.porcionGramos ? ` · porción ${item.porcionGramos} g` : ''}
        </p>

        <div className="mt-4 space-y-3 text-sm">
          {modo === 'compra' ? (
            <>
              <div>
                <p className="mb-1 font-extrabold">{etiquetaCant} compradas</p>
                <input type="number" min="0" value={cantidad} onChange={(e) => setCantidad(e.target.value)} autoFocus
                  placeholder={unidades ? 'ej. 24' : 'ej. 2000'}
                  className="vt-input w-full px-3 py-2" />
              </div>
              <div>
                <p className="mb-1 font-extrabold">Costo total $ (opcional)</p>
                <input type="number" min="0" value={costo} onChange={(e) => setCosto(e.target.value)}
                  placeholder="ej. 15990"
                  className="vt-input w-full px-3 py-2" />
              </div>
              <div>
                <p className="mb-1 font-extrabold">Nota (opcional)</p>
                <input type="text" value={nota} onChange={(e) => setNota(e.target.value)}
                  placeholder="ej. proveedor de siempre"
                  className="vt-input w-full px-3 py-2" />
              </div>
            </>
          ) : (
            <div>
              <p className="mb-1 font-extrabold">¿Cuánto hay realmente? ({unidades ? 'unidades' : 'gramos'})</p>
              <input type="number" min="0" value={real} onChange={(e) => setReal(e.target.value)} autoFocus
                className="vt-input w-full px-3 py-2" />
              {typeof stockActual === 'number' && real !== '' && !Number.isNaN(Number(real)) && (
                <p className="mt-1 text-xs font-bold opacity-70">
                  El sistema tiene {fmtNum(stockActual)} {unidades ? 'u.' : 'g'} → diferencia{' '}
                  <b className={stockActual - Number(real) > 0 ? 'text-bermellon-500' : 'text-verde-600'}>
                    {fmtNum(stockActual - Number(real))} {unidades ? 'u.' : 'g'}
                  </b>
                </p>
              )}
            </div>
          )}
        </div>

        <div className="mt-4 flex gap-2">
          <button onClick={onCerrar} className="btn-tap flex-1 rounded-2xl border-2 border-[#4a2c17]/40 py-3 font-extrabold">Cancelar</button>
          <button onClick={confirmar} className="btn-tap flex-[2] rounded-2xl bg-naranja-500 py-3 font-extrabold text-white">
            {modo === 'compra' ? 'Registrar' : 'Guardar conteo'}
          </button>
        </div>
      </div>
    </div>
  );
}

function fmtNum(n) {
  return new Intl.NumberFormat('es-CL').format(Math.round(n));
}

function fechaCorta(iso) {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleDateString('es-CL', { day: '2-digit', month: 'short' }) + ' ' +
      d.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
  } catch { return ''; }
}
