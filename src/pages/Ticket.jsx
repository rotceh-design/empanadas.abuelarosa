import { useEffect, useRef, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { useCatalog } from '../contexts/CatalogContext';
import { usePlayer } from '../contexts/PlayerContext';
import { enviarPedidoWhatsApp } from '../lib/ticket';
import { comprimirImagen, compartirConArchivo } from '../lib/fotos';
import { fmtCLP } from '../lib/formato';
import { Boton } from '../components/ui';
import { IconosEmpanada, IconoIngrediente, IconoLata } from '../components/Iconos';
import logoAbuela from '../assets/abuela-rosa.png';

export default function Ticket() {
  const { state } = useLocation();
  const { settings, porId } = useCatalog();
  const { desbloqueadas } = usePlayer();
  const pedido = state?.pedido;
  const envioInicial = state?.envio;
  const [foto, setFoto] = useState(null);
  const [estadoShare, setEstadoShare] = useState('');
  const [enviandoWsp, setEnviandoWsp] = useState(false);
  const [avisoWsp, setAvisoWsp] = useState('');
  const [procesandoFoto, setProcesandoFoto] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    if (envioInicial === 'texto') setAvisoWsp('WhatsApp abierto con el detalle de tu pedido — revísalo y presiona enviar');
    if (envioInicial === 'compartido') setAvisoWsp('Ticket enviado como imagen al WhatsApp');
  }, [envioInicial]);

  useEffect(() => {
    if (!pedido) return;
    const end = Date.now() + 1400;
    const disparar = () => {
      confetti({ particleCount: 5, angle: 60, spread: 60, origin: { x: 0, y: 0.7 }, colors: ['#8B4513', '#C89B6A', '#3B7A3E'] });
      confetti({ particleCount: 5, angle: 120, spread: 60, origin: { x: 1, y: 0.7 }, colors: ['#8B4513', '#C89B6A', '#3B7A3E'] });
      if (Date.now() < end) requestAnimationFrame(disparar);
    };
    disparar();
  }, [pedido]);

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
  const insigniasNuevas = desbloqueadas.slice(-2);

  const textoShare = () => {
    const e = empanadas[0];
    const partes = [e?.proteina, e?.queso, ...(e?.acompanamientos || [])].filter(Boolean).join(' + ');
    return `¡Acabo de pedir "${e?.nombre}" en Abuela Rosa! 🥟 ${partes} — Pedido #${String(pedido.numero).padStart(4, '0')}`;
  };

  const tomarFotoShare = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setProcesandoFoto(true);
    try {
      const c = await comprimirImagen(file, { maxLado: 1280, calidad: 0.8 });
      setFoto(c.archivo);
      const r = await compartirConArchivo({ texto: textoShare(), titulo: 'Mi empanada', archivo: c.archivo });
      setEstadoShare(r === 'compartido' ? '¡Compartido!' : r === 'copiado' ? 'Copiado — adjunta la foto en WhatsApp' : r === 'cancelado' ? '' : 'No se pudo procesar');
    } catch {
      setEstadoShare('No se pudo procesar la foto');
    } finally {
      setProcesandoFoto(false);
    }
  };

  const compartir = async () => {
    if (foto) {
      const r = await compartirConArchivo({ texto: textoShare(), titulo: 'Mi empanada', archivo: foto });
      setEstadoShare(r === 'compartido' ? '¡Compartido!' : r === 'copiado' ? 'Copiado' : 'No se pudo compartir');
      return;
    }
    fileRef.current?.click();
  };

  const enviarWsp = async () => {
    setEnviandoWsp(true);
    try {
      const r = await enviarPedidoWhatsApp({
        pedido,
        comprobanteDataUrl: pedido.comprobante || null,
      });
      setAvisoWsp(r !== 'texto' ? 'No se pudo abrir WhatsApp'
        : pedido.comprobante ? 'WhatsApp abierto — adjunta el comprobante que descargamos al chat'
          : 'WhatsApp abierto con el detalle de tu pedido — revísalo y presiona enviar');
    } finally {
      setEnviandoWsp(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg px-4 pb-20 pt-8">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="vt-sello rounded-2xl p-5 text-center"
      >
        <span className="vt-serif inline-block rounded-full border-2 border-[#3b7a3e]/50 bg-[#3b7a3e]/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#3b7a3e]">
          Misión completada
        </span>
        <img src={logoAbuela} alt="Empanadas Abuela Rosa" className="mx-auto mt-3 h-16 w-16 rounded-full border-2 border-[#4a2c17]/30" />
        <h1 className="vt-titulo mt-2 text-2xl uppercase">¡Pedido enviado!</h1>
        <p className="vt-cuerpo mt-1 text-sm italic opacity-70">Tu número de pedido es</p>
        <p className="vt-titulo text-4xl">#{String(pedido.numero).padStart(4, '0')}</p>
        <p className="vt-cuerpo mt-2 inline-block rounded-full border-2 border-[#4a2c17]/25 bg-[#f7ecd4] px-3 py-1 text-xs">
          {settings?.pago?.mensaje}
        </p>
      </motion.div>

      {/* Tarjeta para compartir */}
      <div className="vt-sello mt-4 rounded-2xl p-5">
        <p className="vt-serif text-xs font-bold uppercase tracking-[0.18em] opacity-70">Mi empanada</p>
        {empanadas.map((e, i) => (
          <div key={i} className="mt-2">
            <p className="vt-titulo text-xl">“{e.nombre}”</p>
            <p className="vt-cuerpo text-sm italic opacity-90">{[e.proteina, e.queso].filter(Boolean).join(' · ')}</p>
            <p className="vt-cuerpo text-sm italic opacity-90">{(e.acompanamientos || []).join(', ')}</p>
            <span className="mt-1 inline-flex gap-1">
              <IconosEmpanada proteinaId={e.proteinaId} quesoId={e.quesoId}
                acompanamientosIds={e.acompanamientosIds || []} porId={porId} size={18} />
            </span>
          </div>
        ))}
        {bebidas.length > 0 && (
          <p className="vt-cuerpo mt-2 flex items-center gap-1.5 text-sm italic opacity-90">
            <IconoLata size={16} color="#8b4513" />
            {bebidas.map((b) => `${b.nombre} ×${b.cantidad}`).join(', ')}
          </p>
        )}
        <p className="vt-titulo mt-3 text-2xl">{fmtCLP(pedido.totales?.total || 0)}</p>
        <p className="vt-cuerpo text-xs italic opacity-80">Abuela Rosa · Maipú</p>
        <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={tomarFotoShare} />
        {foto && (
          <div className="mt-3 flex items-center gap-2 rounded-xl border-2 border-[#4a2c17]/25 bg-[#f7ecd4] p-2">
            <img src={URL.createObjectURL(foto)} alt="Foto de tu empanada" className="h-10 w-10 rounded-lg object-cover" />
            <span className="vt-cuerpo flex-1 text-xs italic font-bold">Foto lista para compartir</span>
            <button type="button" onClick={() => { setFoto(null); setEstadoShare(''); }} className="vt-serif text-xs font-bold underline">Quitar</button>
          </div>
        )}
        <button onClick={compartir} disabled={procesandoFoto} className="btn-tap vt-btn-fantasma mt-3 w-full rounded-xl py-2.5 text-sm">
          {procesandoFoto ? 'Procesando…' : foto ? 'Compartir de nuevo' : 'Compartir con foto de la empanada'}
        </button>
        {estadoShare && <p className="vt-serif mt-2 text-center text-xs font-bold">{estadoShare}</p>}
      </div>

      {/* Detalle */}
      <div className="vt-sello mt-4 rounded-3xl p-5">
        <h2 className="vt-titulo text-base">Detalle</h2>
        <ul className="mt-2 space-y-2 text-sm">
          {empanadas.map((e, i) => (
            <li key={i} className="rounded-2xl border-2 border-[#4a2c17]/15 bg-[#f7ecd4]/70 p-3">
              <p className="vt-serif font-bold">{e.nombre} ×{e.cantidad}</p>
              <p className="vt-cuerpo italic opacity-70">{[e.proteina, e.queso].filter(Boolean).join(' + ')}</p>
              <p className="vt-cuerpo italic opacity-70">{(e.acompanamientos || []).join(', ')}</p>
            </li>
          ))}
          {bebidas.map((b, i) => (
            <li key={i} className="flex items-center gap-2 rounded-2xl border-2 border-[#4a2c17]/15 bg-[#f7ecd4]/70 p-3">
              <IconoIngrediente ing={{ id: b.id, categoria: 'bebida', color: b.color }} size={18} />
              <span className="vt-serif font-bold">{b.nombre} ×{b.cantidad}</span>
            </li>
          ))}
        </ul>
        <div className="vt-separador mt-3" aria-hidden />
        <div className="mt-2 space-y-1 text-sm">
          <div className="flex justify-between"><span className="vt-cuerpo opacity-70">Subtotal</span><span className="vt-serif">{fmtCLP(pedido.totales?.subtotal || 0)}</span></div>
          {(pedido.totales?.ahorro || 0) > 0 && (
            <div className="flex justify-between text-[#3b7a3e]"><span className="vt-serif">Ahorro</span><span className="vt-serif font-bold">−{fmtCLP(pedido.totales.ahorro)}</span></div>
          )}
          <div className="flex justify-between"><span className="vt-cuerpo opacity-70">Delivery</span><span className="vt-serif">{pedido.totales?.delivery === 0 ? 'GRATIS' : fmtCLP(pedido.totales?.delivery || 0)}</span></div>
          <div className="flex justify-between"><span className="vt-titulo text-lg">Total</span><span className="vt-titulo text-lg">{fmtCLP(pedido.totales?.total || 0)}</span></div>
        </div>
        <p className="vt-cuerpo mt-3 text-xs italic opacity-70">
          {pedido.cliente?.direccion}, {pedido.cliente?.comuna}
          <br />Entrega: {pedido.entrega?.fecha} a las {pedido.entrega?.hora}
        </p>
      </div>

      {insigniasNuevas.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="vt-sello mt-4 rounded-3xl p-4"
        >
          <p className="vt-titulo text-base">¡Insignias desbloqueadas!</p>
          {insigniasNuevas.map((i) => (
            <p key={i.id} className="vt-cuerpo mt-1 text-sm">
              <span aria-hidden>{i.icono}</span> <b className="vt-serif not-italic">{i.nombre}</b> — {i.descripcion}
            </p>
          ))}
        </motion.div>
      )}

      <div className="mt-5 space-y-2">
        <button
          type="button"
          onClick={enviarWsp}
          disabled={enviandoWsp}
          className="btn-tap vt-serif flex w-full items-center justify-center gap-2 rounded-full border-2 border-[#1f7a3d] bg-[#25D366] py-4 text-sm font-bold uppercase tracking-wide text-white shadow-puff disabled:opacity-50"
        >
          {enviandoWsp ? 'Enviando…' : pedido.comprobante ? 'Enviar ticket + comprobante' : 'Enviar ticket por WhatsApp'}
        </button>
        {avisoWsp && (
          <p className="vt-cuerpo rounded-xl border-2 border-[#3b7a3e]/35 bg-[#3b7a3e]/10 px-3 py-2 text-center text-xs italic font-bold text-[#3b7a3e]">
            {avisoWsp}
          </p>
        )}
        <Link to="/">
          <Boton variante="secundario">Armar otra empanada</Boton>
        </Link>
        <Link to="/inicio" className="vt-cuerpo block text-center text-sm italic font-bold opacity-70">
          Ver promociones y ranking
        </Link>
      </div>
    </div>
  );
}
