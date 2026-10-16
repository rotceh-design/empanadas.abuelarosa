import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../contexts/CartContext';
import { useCatalog } from '../contexts/CatalogContext';
import { Boton, Titulo, Vacio } from '../components/ui';
import { IconoIngrediente, IconosEmpanada, IconoLata } from '../components/Iconos';
import { SeparadorOrnamental } from '../components/vintage/Ornamentos';
import { desgloseDeItem } from '../lib/precios';
import FichaEmpanada from '../components/FichaEmpanada';
import { fmtCLP } from '../lib/formato';

export default function Carrito() {
  const navigate = useNavigate();
  const {
    empanadas, bebidas, resumen, precios, agregarBebida,
    cambiarCantidadEmpanada, cambiarCantidadBebida,
    eliminarEmpanada, eliminarBebida, duplicarEmpanada, vaciar,
  } = useCart();
  const { bebidas: catalogoBebidas, settings, porId } = useCatalog();
  const porBebida = Object.fromEntries(catalogoBebidas.map((b) => [b.id, b]));

  if (resumen.vacio) {
    return (
      <Vacio
        titulo="Tu carrito está vacío"
        texto="Arma tu empanada favorita y aquí la verás aparecer."
        accion={
          <Link to="/configurar" className="vt-btn btn-tap rounded-full px-6 py-3">
            Armar empanada
          </Link>
        }
      />
    );
  }

  const gratisDesde = settings?.delivery?.gratisDesdeEmpanadas ?? 2;
  const faltan = Math.max(0, gratisDesde - resumen.totalEmpanadas);

  return (
    <div className="mx-auto max-w-3xl px-4 pb-44 pt-6">
      <Titulo sub={`${resumen.totalEmpanadas} empanadas · ${resumen.totalBebidas} bebidas`}>Tu pedido</Titulo>
      <SeparadorOrnamental className="mt-3 w-40" />

      {resumen.ahorro > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="vt-serif mt-4 rounded-2xl border-2 border-[#3b7a3e]/45 bg-[#3b7a3e]/10 px-3 py-2.5 text-sm font-bold text-[#3b7a3e]"
        >
          Oferta aplicada automáticamente — ahorras {fmtCLP(resumen.ahorro)}
          {resumen.detalle?.length > 0 && (
            <span className="vt-cuerpo mt-0.5 block text-xs font-semibold italic opacity-80">
              {resumen.detalle.join(' + ')}
            </span>
          )}
        </motion.div>
      )}

      {/* Empanadas */}
      <div className="mt-5 space-y-3">
        <AnimatePresence>
          {empanadas.map((e) => (
            <ItemEmpanada
              key={e.cartId}
              e={e}
              porId={porId}
              settings={settings}
              precios={precios}
              onEliminar={() => eliminarEmpanada(e.cartId)}
              onCantidad={(delta) => cambiarCantidadEmpanada(e.cartId, delta)}
              onDuplicar={() => duplicarEmpanada(e.cartId)}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Bebidas */}
      <h3 className="vt-titulo mb-2 mt-7 flex items-center gap-2 text-lg">
        <IconoLata size={20} color="#8b4513" />
        Agrega tu bebida en lata
      </h3>
      {bebidas.length > 0 && (
        <div className="mb-3 space-y-2">
          {bebidas.map((b) => (
            <div key={b.cartId} className="vt-sello flex items-center gap-3 rounded-2xl px-3 py-2">
              <IconoIngrediente ing={porBebida[b.id] || { id: b.id, categoria: 'bebida', color: b.color }} size={22} />
              <span className="vt-serif flex-1 text-sm font-bold">{b.nombre}</span>
              <button onClick={() => cambiarCantidadBebida(b.cartId, -1)} className="btn-tap flex h-8 w-8 items-center justify-center rounded-lg border-2 border-[#4a2c17]/25 font-bold">−</button>
              <span className="vt-serif w-6 text-center font-extrabold">{b.cantidad}</span>
              <button onClick={() => cambiarCantidadBebida(b.cartId, 1)} className="btn-tap flex h-8 w-8 items-center justify-center rounded-lg border-2 border-[#4a2c17]/25 font-bold">+</button>
              <button onClick={() => eliminarBebida(b.cartId)} className="btn-tap px-1 opacity-45" aria-label="Quitar bebida">✕</button>
              <span className="vt-serif w-16 text-right text-sm font-extrabold">{fmtCLP(b.precio * b.cantidad)}</span>
            </div>
          ))}
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {catalogoBebidas.map((b) => (
          <button
            key={b.id}
            onClick={() => agregarBebida(b)}
            className="btn-tap flex items-center gap-1.5 rounded-full border-2 border-[#4a2c17]/25 bg-[#f7ecd4] px-3 py-2 text-sm font-bold"
          >
            <IconoIngrediente ing={b} size={16} />
            {b.nombre.replace(' lata', '')} · {fmtCLP(b.precio)}
          </button>
        ))}
      </div>

      {/* Delivery */}
      <div className="vt-sello mt-6 rounded-3xl p-4">
        <p className="vt-titulo flex items-center gap-2 text-base">Delivery</p>
        {faltan > 0 ? (
          <p className="vt-cuerpo mt-1 text-sm">
            Te falta <b className="not-italic text-[#8b4513]">{faltan} empanada{faltan > 1 ? 's' : ''}</b> para el
            delivery gratis en {settings?.delivery?.comunasGratis?.join(', ')}.
          </p>
        ) : (
          <p className="vt-cuerpo mt-1 text-sm font-bold text-[#3b7a3e]">
            ¡Tienes delivery gratis! Disponible en {settings?.delivery?.comunasGratis?.join(', ')}.
          </p>
        )}
      </div>

      {/* Resumen fijo */}
      <div className="fixed inset-x-0 bottom-12 z-40 border-t-2 border-[#4a2c17]/30 bg-[#f3e6c8]/95 p-4 backdrop-blur h-safe-b">
        <div className="mx-auto max-w-3xl">
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="vt-cuerpo opacity-70">Subtotal</span>
            <span className="vt-serif font-bold">{fmtCLP(resumen.total + resumen.ahorro)}</span>
          </div>
          {resumen.ahorro > 0 && (
            <div className="mb-1 flex items-center justify-between text-sm text-[#3b7a3e]">
              <span className="vt-serif font-bold">Ahorro ofertas</span>
              <span className="vt-serif font-extrabold">−{fmtCLP(resumen.ahorro)}</span>
            </div>
          )}
          <div className="mb-3 flex items-center justify-between">
            <span className="vt-titulo text-lg">Total</span>
            <span className="vt-titulo text-2xl">{fmtCLP(resumen.total)}</span>
          </div>
          <div className="flex gap-2">
            <button onClick={vaciar} className="btn-tap vt-btn-fantasma rounded-full px-5 text-sm">Vaciar</button>
            <Boton onClick={() => navigate('/checkout')}>Continuar →</Boton>
          </div>
        </div>
      </div>
    </div>
  );
}

// Empanada del pedido: receta, cantidad y desglose de precio plegable.
function ItemEmpanada({ e, porId, settings, precios, onEliminar, onCantidad, onDuplicar }) {
  const [verDetalle, setVerDetalle] = useState(false);
  const desglose = desgloseDeItem(e, { porId, settings });
  const unitario = e.precioUnitario || precios.empanadaBase;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
      className="vt-sello rounded-3xl p-4"
    >
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-[#4a2c17]/25 bg-[#f7ecd4]">
          <IconosEmpanada proteinaId={e.proteinaId} quesoId={e.quesoId}
            acompanamientosIds={(e.acompanamientosIds || []).slice(0, 2)} porId={porId} size={14} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="vt-serif truncate text-sm font-bold">{e.nombre}</p>
          <p className="vt-cuerpo truncate text-xs italic opacity-60">
            {[e.proteina, e.queso, ...(e.acompanamientos || [])].filter(Boolean).join(' · ')}
          </p>
          {e.extrasCount > 0 && (
            <p className="vt-serif mt-1 text-[11px] font-bold text-[#8b4513]">+{e.extrasCount} extras</p>
          )}
        </div>
        <button onClick={onEliminar} className="btn-tap p-1 text-lg opacity-45 hover:opacity-100" aria-label="Eliminar">
          ✕
        </button>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          <button onClick={() => onCantidad(-1)} className="btn-tap flex h-9 w-9 items-center justify-center rounded-xl border-2 border-[#4a2c17]/25 text-lg font-bold" aria-label="Menos uno">−</button>
          <span className="vt-serif w-8 text-center font-extrabold">{e.cantidad}</span>
          <button onClick={() => onCantidad(1)} className="btn-tap flex h-9 w-9 items-center justify-center rounded-xl border-2 border-[#4a2c17]/25 text-lg font-bold" aria-label="Más uno">+</button>
          <button onClick={onDuplicar} className="btn-tap ml-2 rounded-xl border-2 border-[#4a2c17]/25 bg-[#f7ecd4] px-3 py-2 text-xs font-bold" title="Duplicar">Duplicar</button>
        </div>
        <div className="text-right leading-tight">
          <span className="vt-cuerpo block text-[11px] italic opacity-55">
            {e.cantidad} × {fmtCLP(unitario)}
          </span>
          <span className="vt-titulo text-lg">{fmtCLP(unitario * e.cantidad)}</span>
        </div>
      </div>

      {desglose.conDetalles && (
        <div className="mt-2.5">
          <button
            type="button"
            onClick={() => setVerDetalle((v) => !v)}
            aria-expanded={verDetalle}
            className="vt-cuerpo btn-tap flex w-full items-center justify-between gap-2 rounded-xl border border-[#4a2c17]/25 bg-[#fffaf0]/70 px-3 py-2 text-xs font-bold transition-colors hover:border-[#4a2c17]/50"
          >
            <span>¿De qué sale este precio?</span>
            <span className="vt-serif font-extrabold">{verDetalle ? 'Ocultar ▴' : 'Ver desglose ▾'}</span>
          </button>

          <AnimatePresence initial={false}>
            {verDetalle && (
              <motion.div
                key="detalle"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <div className="mt-2 overflow-hidden rounded-2xl border border-[#4a2c17]/30 bg-[#fffaf0]/85">
                  <FichaEmpanada
                    desglose={desglose}
                    esDulce={e.linea === 'dulce'}
                    etiquetaTotal="Unitario"
                    etiquetaAjuste={desglose.etiquetaAjuste}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}
