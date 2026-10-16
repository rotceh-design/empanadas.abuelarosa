import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { SelloCircular, SelloLinea, Floritura, MarcoOrnamental, SeparadorOrnamental } from '../components/vintage/Ornamentos';
import ModalPago from '../components/vintage/ModalPago';
import { IconoEmpanada, IconoIngrediente } from '../components/Iconos';
import { useCatalog } from '../contexts/CatalogContext';
import { useCart } from '../contexts/CartContext';
import { usePlayer } from '../contexts/PlayerContext';
import { getEnvio } from '../lib/envio';
import { combinacionesDelDia, itemCombinacionDelDia } from '../lib/daily';
import { fmtCLP } from '../lib/formato';
import { crearPedido, diasProduccion } from '../lib/pedidos';
import { enviarPedidoWhatsApp } from '../lib/ticket';

export default function Bienvenida() {
  const navigate = useNavigate();
  const { settings, lineas, porId, whatsapp, bebidas: bebidasCatalogo } = useCatalog();
  const { agregarEmpanada, agregarBebida, empanadas, bebidas, resumen, vaciar } = useCart();
  const { registrarEmpanada, registrarPedido } = usePlayer();
  const dulceActiva = settings?.lineas?.dulce?.activa !== false;

  const delDia = useMemo(
    () => combinacionesDelDia({ lineas, settings, porId }),
    [lineas, settings, porId],
  );
  const tieneDelDia = empanadas.some((e) => e.esDelDia);

  const [modalPago, setModalPago] = useState(false);
  const [enviandoPago, setEnviandoPago] = useState(false);

  const elegirLinea = (lineaId) => {
    // Si ya tiene datos de envío, va directo al armador; si no, pide datos primero
    const envio = getEnvio();
    if (envio?.nombre && envio?.telefono && envio?.direccion) {
      navigate(`/configurar?linea=${lineaId}`);
    } else {
      navigate(`/envio?linea=${lineaId}`);
    }
  };

  const pedirDelDia = (combo) => {
    const item = itemCombinacionDelDia(combo);
    registrarEmpanada(item);
    agregarEmpanada(item);
    // Combo listo: no pasa por el armador; solo faltan datos si no los tiene
    const envio = getEnvio();
    if (!envio?.nombre || !envio?.telefono || !envio?.direccion) {
      navigate('/envio?linea=salada&delDia=1');
    }
  };

  const abrirPago = () => {
    const envio = getEnvio();
    if (!envio?.nombre || !envio?.telefono || !envio?.direccion) {
      navigate('/envio?linea=salada&delDia=1');
      return;
    }
    setModalPago(true);
  };

  const confirmarPago = async () => {
    const envio = getEnvio();
    if (!envio || enviandoPago) return;
    setEnviandoPago(true);
    try {
      const dias = diasProduccion(settings?.produccion?.diasHabilitados);
      const fechaSel = dias[0]?.fecha || 'A coordinar';
      const horaSel = settings?.produccion?.horas?.[0] || 'A coordinar';
      const comunasGratis = settings?.delivery?.comunasGratis || [];
      const gratisDesde = settings?.delivery?.gratisDesdeEmpanadas ?? 2;
      const enZona = comunasGratis.includes(envio.comuna);
      const cumpleMinimo = resumen.totalEmpanadas >= gratisDesde;
      const delivery = enZona && cumpleMinimo ? 0 : (settings?.delivery?.costo ?? 1000);
      const total = resumen.total + delivery;
      const items = [
        ...empanadas.map((e) => ({ ...e, tipo: 'empanada' })),
        ...bebidas.map((b) => ({
          tipo: 'bebida', id: b.id, nombre: b.nombre, emoji: b.emoji,
          cantidad: b.cantidad, precio: b.precio,
        })),
      ];
      const pedido = {
        items,
        cliente: { ...envio },
        entrega: { fecha: fechaSel, hora: horaSel },
        totales: { subtotal: resumen.total + resumen.ahorro, ahorro: resumen.ahorro, delivery, total },
        oferta: { ahorro: resumen.ahorro, detalle: resumen.detalle || [] },
        etiquetas: [...new Set(empanadas.flatMap((e) => e.etiquetas || []))],
        comprobante: null,
        fuente: 'web',
      };
      const creado = await crearPedido(pedido);
      const completo = { ...pedido, numero: creado.numero, id: creado.id };
      registrarPedido(pedido);
      const r = await enviarPedidoWhatsApp({ pedido: completo, numero: whatsapp });
      vaciar();
      navigate('/ticket', { state: { pedido: completo, envio: r }, replace: true });
    } finally {
      setEnviandoPago(false);
      setModalPago(false);
    }
  };

  return (
    <div className="vt-papel vt-tinta flex min-h-screen flex-col items-center px-4 py-8 pb-28 sm:py-12">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex w-full max-w-3xl flex-col items-center"
      >
        {/* Título + sello */}
        <MarcoOrnamental className="w-full bg-[#f7ecd4]/50 px-5 py-8 sm:px-10 sm:py-10">
          <div className="flex flex-col items-center text-center">
            <div className="flex w-full items-center justify-center gap-2">
              <Floritura lado="izq" ancho={72} className="hidden shrink-0 sm:block" />
              <h1 className="vt-titulo text-[2.1rem] leading-none sm:text-[2.9rem]">
                ¿QUÉ SE TE<br />ANTOJA HOY?
              </h1>
              <Floritura lado="der" ancho={72} className="hidden shrink-0 sm:block" />
            </div>
            <SeparadorOrnamental className="mt-4 w-48 sm:w-64" />
            {/* Logo del sello — abajo del texto, como en la imagen */}
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.25, type: 'spring', stiffness: 140, damping: 14 }}
              className="mt-1"
            >
              <SelloCircular size={260} />
            </motion.div>
            {delDia.length > 0 && (
              <button
                type="button"
                onClick={() => document.getElementById('del-dia')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                className="vt-btn-fantasma btn-tap mt-3 rounded-full px-5 py-2 text-xs"
              >
                Ver empanada del día ↓
              </button>
            )}
          </div>
        </MarcoOrnamental>

        {/* Dos sellos: Saladas y Dulces */}
        <p className="vt-cuerpo mt-8 text-center text-lg uppercase italic tracking-wide opacity-80">
          ELIJE Y ARMA TU EMPANADA FRITA A TU GUSTO
        </p>

        <div className="mt-6 flex w-full flex-col items-center justify-center gap-8 sm:flex-row sm:items-stretch sm:gap-12">
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.35, duration: 0.45 }}
            className="flex w-full max-w-[15.5rem] justify-center sm:max-w-none sm:flex-1"
          >
            <SelloLinea
              icono={<IconoEmpanada size={56} color="#b5763a" />}
              titulo="EMPANADAS SALADAS"
              subtitulo="Carne, pollo, camarón y más"
              onClick={() => elegirLinea('salada')}
            />
          </motion.div>

          {dulceActiva && (
            <motion.div
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.45, duration: 0.45 }}
              className="flex w-full max-w-[15.5rem] justify-center sm:max-w-none sm:flex-1"
            >
              <SelloLinea
                icono={<IconoEmpanada size={56} color="#b5763a" />}
                titulo="EMPANADAS DULCES"
                subtitulo="Nutella, chocolate, manjar"
                onClick={() => elegirLinea('dulce')}
              />
            </motion.div>
          )}
        </div>

        {/* Empanadas del día — 3 opciones con oferta */}
        {delDia.length > 0 && (
          <motion.section
            id="del-dia"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.45 }}
            className="mt-12 w-full scroll-mt-28"
          >
            <div className="flex flex-col items-center">
              <p className="vt-serif text-sm font-bold uppercase tracking-[0.2em] opacity-70">★ Oferta del día ★</p>
              <h2 className="vt-titulo mt-1 text-xl sm:text-2xl">EMPANADAS DEL DÍA</h2>
              <SeparadorOrnamental className="mt-3 w-48 sm:w-64" />
              <p className="vt-cuerpo mt-2 text-center text-base italic opacity-75">
                Tres recetas especiales — {fmtCLP(delDia[0].precio)} c/u
              </p>
            </div>

            <div className="mt-5 flex flex-col gap-4 sm:grid sm:grid-cols-3 sm:gap-4">
              {delDia.map((combo, i) => (
                <motion.div
                  key={combo.clave}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + i * 0.08 }}
                  className="vt-sello rounded-3xl px-4 py-5"
                >
                  <div className="flex flex-col items-center">
                    <IconoEmpanada size={48} color="#b5763a" />
                    <span className="mt-2 inline-flex items-center gap-1.5">
                      {[combo.proteinaId, combo.quesoId, ...combo.acompanamientosIds].map((id) => (
                        <IconoIngrediente key={id} ing={porId[id] || { id }} size={18} className="opacity-80" />
                      ))}
                    </span>
                  </div>
                  <p className="vt-serif mt-3 text-center text-lg font-bold leading-tight">{combo.proteina}</p>
                  <p className="vt-cuerpo text-center text-sm italic opacity-70">{combo.queso}</p>
                  <p className="vt-cuerpo mt-1 truncate text-center text-xs opacity-55">{combo.acompanamientos.join(' · ')}</p>
                  <div className="vt-separador mx-auto mt-3 w-24" aria-hidden />
                  {combo.precioRegular > combo.precio && (
                    <p className="vt-cuerpo mt-2 text-center text-xs italic opacity-45 line-through">
                      Valor normal {fmtCLP(combo.precioRegular)}
                    </p>
                  )}
                  <p className="vt-titulo mt-1 text-center text-2xl">{fmtCLP(combo.precio)}</p>
                  <button
                    onClick={() => pedirDelDia(combo)}
                    className="vt-btn btn-tap mt-3 w-full rounded-full px-4 py-2.5 text-sm"
                  >
                    Pedir
                  </button>
                </motion.div>
              ))}
            </div>

            {/* Upsell: pack empanada del día + bebida (−$200) */}
            {tieneDelDia && bebidasCatalogo.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.75, duration: 0.4 }}
                className="vt-sello mt-5 rounded-3xl px-4 py-4"
              >
                <div className="text-center">
                  <p className="vt-serif text-xs font-bold uppercase tracking-[0.18em]">
                    ★ Empanada del día + bebida ★
                  </p>
                  <p className="vt-cuerpo mt-1 text-sm italic opacity-75">
                    Agrega una bebida a tu pedido del día y ahorra{' '}
                    <strong className="not-italic">{fmtCLP(200)}</strong>
                  </p>
                </div>
                <div className="mt-3 flex flex-wrap justify-center gap-2">
                  {bebidasCatalogo.map((b) => {
                    const enPedido = bebidas.some((x) => x.id === b.id);
                    return (
                      <button
                        key={b.id}
                        onClick={() => { if (!enPedido) agregarBebida(b); }}
                        disabled={enPedido}
                        className={`btn-tap flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition ${
                          enPedido
                            ? 'border-[#4a2c17]/45 bg-[#8b4513]/20 opacity-75'
                            : 'border-[#4a2c17]/25 bg-[#f3e6c8] hover:bg-[#e8d3a6]'
                        }`}
                      >
                        <IconoIngrediente ing={b} size={16} />
                        <span className="vt-serif font-semibold">
                          {b.nombre.replace(' lata', '')}
                        </span>
                        {enPedido ? (
                          <span className="vt-cuerpo font-bold">✓</span>
                        ) : (
                          <span className="vt-cuerpo opacity-55 line-through">{fmtCLP(b.precio)}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </motion.section>
        )}
      </motion.div>

      {/* Barra flotante: ya hay empanadas en el pedido → Pagar */}
      <AnimatePresence>
        {resumen.totalEmpanadas > 0 && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            className="fixed inset-x-0 bottom-0 z-50 border-t-2 border-[#4a2c17]/30 bg-[#f3e6c8]/95 px-4 py-3 backdrop-blur h-safe-b"
          >
            <div className="mx-auto flex max-w-3xl items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="vt-serif flex items-center gap-1.5 truncate text-sm font-bold">
                  <IconoEmpanada size={18} color="#8b4513" />
                  {resumen.totalEmpanadas} empanada{resumen.totalEmpanadas > 1 ? 's' : ''} en tu pedido
                </p>
                <p className="vt-cuerpo text-xs italic opacity-70">{fmtCLP(resumen.total)}</p>
              </div>
              <button
                onClick={abrirPago}
                disabled={enviandoPago}
                className="vt-btn btn-tap shrink-0 rounded-full px-6 py-3 text-sm disabled:opacity-50"
              >
                Pagar
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ModalPago
        abierto={modalPago}
        total={resumen.total}
        enviando={enviandoPago}
        onConfirmar={confirmarPago}
        onCancelar={() => setModalPago(false)}
      />
    </div>
  );
}
