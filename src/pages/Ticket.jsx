import { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useCatalog } from '../contexts/CatalogContext';
import { enviarPedidoWhatsApp } from '../lib/ticket';
import { fmtCLP } from '../lib/formato';
import { Boton } from '../components/ui';
import logoAbuela from '../assets/abuela-rosa.png';

const avisoPara = (r) => (
  r === 'compartido' ? 'Imagen compartida: elige WhatsApp y la tienda'
    : r === 'copiado' ? 'Imagen copiada: pégala en el chat (Ctrl+V o toca y mantén → Pegar)'
      : r === 'descargado' ? 'Descargamos la imagen: adjúntala en el chat de WhatsApp'
        : r === 'abierto' ? 'WhatsApp abierto con la tienda'
          : r === 'cancelado' ? '' : 'No se pudo abrir WhatsApp'
);

export default function Ticket() {
  const { state } = useLocation();
  const { settings } = useCatalog();
  const pedido = state?.pedido;
  const envioInicial = state?.envio;
  const [enviandoWsp, setEnviandoWsp] = useState(false);
  const [avisoWsp, setAvisoWsp] = useState('');

  useEffect(() => {
    if (envioInicial) setAvisoWsp(avisoPara(envioInicial));
  }, [envioInicial]);

  if (!pedido) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
        <p className="vt-titulo text-4xl">?</p>
        <p className="vt-serif mt-3 font-bold">No encontramos tu pedido</p>
        <Link to="/" className="vt-btn btn-tap mt-4 rounded-full px-5 py-3">Volver al inicio</Link>
      </div>
    );
  }

  const empanadas = (pedido.items || []).filter((i) => i.tipo === 'empanada');
  const bebidas = (pedido.items || []).filter((i) => i.tipo === 'bebida');
  const t = pedido.totales || {};
  const c = pedido.cliente || {};
  const e = pedido.entrega || {};
  const num = String(pedido.numero ?? '').padStart(4, '0');
  const precioLinea = (it) => {
    const unit = typeof it.precioUnitario === 'number' ? it.precioUnitario : (it.precio || 0);
    return fmtCLP(unit * (it.cantidad || 1));
  };

  const enviarWsp = async () => {
    setEnviandoWsp(true);
    try {
      const r = await enviarPedidoWhatsApp({
        pedido,
        comprobanteDataUrl: pedido.comprobante || null,
      });
      setAvisoWsp(avisoPara(r));
    } finally {
      setEnviandoWsp(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg px-4 pb-20 pt-8">
      {/* Recibo del pedido: encabezado, ítems, totales y entrega en una sola pieza */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="vt-sello rounded-3xl p-5"
      >
        <div className="flex items-center gap-3">
          <img src={logoAbuela} alt="Empanadas Abuela Rosa" className="h-11 w-11 rounded-full border-2 border-[#4a2c17]/30" />
          <div className="min-w-0">
            <p className="vt-serif text-[10px] font-bold uppercase tracking-[0.25em] opacity-60">Pedido enviado</p>
            <p className="vt-titulo text-xl leading-tight">#{num}</p>
          </div>
          <span className="vt-serif ml-auto rounded-full border-2 border-[#3b7a3e]/40 bg-[#3b7a3e]/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#3b7a3e]">
            Recibido
          </span>
        </div>

        <div className="vt-separador mt-3" aria-hidden />

        <ul className="space-y-2.5">
          {empanadas.map((it, i) => (
            <li key={i}>
              <div className="flex items-baseline justify-between gap-3">
                <p className="vt-serif min-w-0 truncate text-sm font-bold">{it.nombre} ×{it.cantidad}</p>
                <p className="vt-serif shrink-0 text-sm font-bold tabular-nums">{precioLinea(it)}</p>
              </div>
              {[it.proteina, it.queso].filter(Boolean).length + (it.acompanamientos || []).length > 0 && (
                <p className="vt-cuerpo truncate text-xs italic opacity-60">
                  {[it.proteina, it.queso].filter(Boolean).join(' + ')}
                  {(it.acompanamientos || []).length ? ` · ${it.acompanamientos.join(', ')}` : ''}
                </p>
              )}
            </li>
          ))}
          {bebidas.map((b) => (
            <li key={b.id || b.cartId} className="flex items-baseline justify-between gap-3">
              <p className="vt-serif min-w-0 truncate text-sm font-bold">{b.emoji} {b.nombre} ×{b.cantidad}</p>
              <p className="vt-serif shrink-0 text-sm font-bold tabular-nums">{precioLinea(b)}</p>
            </li>
          ))}
        </ul>

        <div className="vt-separador mt-3" aria-hidden />

        <div className="space-y-1 text-sm">
          {(t.ahorro || 0) > 0 && (
            <div className="flex justify-between text-[#3b7a3e]">
              <span className="vt-serif">Ahorro</span>
              <span className="vt-serif font-bold">−{fmtCLP(t.ahorro)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="vt-cuerpo opacity-70">Delivery</span>
            <span className="vt-serif">{t.delivery === 0 ? 'GRATIS' : fmtCLP(t.delivery || 0)}</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="vt-titulo text-lg">Total</span>
            <span className="vt-titulo text-lg">{fmtCLP(t.total || 0)}</span>
          </div>
        </div>

        <div className="vt-separador mt-3" aria-hidden />

        <p className="vt-cuerpo text-xs italic opacity-70">
          {(c.direccion || c.comuna) && <>{[c.direccion, c.comuna].filter(Boolean).join(', ')}<br /></>}
          {e.fecha && <>Entrega: {e.fecha}{e.hora ? ` · ${e.hora}` : ''}</>}
        </p>
        {settings?.pago?.mensaje && (
          <p className="vt-cuerpo mt-2 text-[11px] italic opacity-60">{settings.pago.mensaje}</p>
        )}
      </motion.div>

      <div className="mt-5 space-y-2">
        <button
          type="button"
          onClick={enviarWsp}
          disabled={enviandoWsp}
          className="btn-tap vt-serif flex w-full items-center justify-center gap-2 rounded-full border-2 border-[#1f7a3d] bg-[#25D366] py-4 text-sm font-bold uppercase tracking-wide text-white shadow-puff disabled:opacity-50"
        >
          {enviandoWsp ? 'Preparando imagen…' : pedido.comprobante ? 'Enviar ticket + comprobante' : 'Enviar ticket por WhatsApp'}
        </button>
        {avisoWsp && (
          <p className="vt-cuerpo rounded-xl border-2 border-[#3b7a3e]/35 bg-[#3b7a3e]/10 px-3 py-2 text-center text-xs italic font-bold text-[#3b7a3e]">
            {avisoWsp}
          </p>
        )}
        <Link to="/">
          <Boton variante="secundario">Armar otra empanada</Boton>
        </Link>
      </div>
    </div>
  );
}
