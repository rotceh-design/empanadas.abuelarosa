import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useCatalog } from '../contexts/CatalogContext';
import { usePlayer } from '../contexts/PlayerContext';
import { crearPedido, diasProduccion } from '../lib/pedidos';
import { enviarPedidoWhatsApp } from '../lib/ticket';
import { comprimirImagen } from '../lib/fotos';
import { COMUNAS_SANTIAGO } from '../data/catalogoSeed';
import { fmtCLP } from '../lib/formato';
import { Boton, Titulo } from '../components/ui';
import { SeparadorOrnamental } from '../components/vintage/Ornamentos';

const CAMPOS = [
  { id: 'nombre', label: 'Tu nombre', tipo: 'text', placeholder: 'Ej: Camila Rojas', requerido: true },
  { id: 'telefono', label: 'Teléfono (WhatsApp)', tipo: 'tel', placeholder: '+56 9 1234 5678', requerido: true },
  { id: 'direccion', label: 'Dirección', tipo: 'text', placeholder: 'Av. Matta 1234, depto 5', requerido: true },
];

export default function Checkout() {
  const navigate = useNavigate();
  const { empanadas, bebidas, resumen, vaciar } = useCart();
  const { settings, whatsapp } = useCatalog();
  const { registrarPedido } = usePlayer();

  const [form, setForm] = useState({
    nombre: '', telefono: '', direccion: '', comuna: 'Maipú', referencias: '',
  });
  const [errores, setErrores] = useState({});
  const [enviando, setEnviando] = useState(false);
  const [comprobante, setComprobante] = useState(null);
  const [procesandoFoto, setProcesandoFoto] = useState(false);
  const fileRef = useRef(null);

  const tomarComprobante = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setProcesandoFoto(true);
    try {
      const c = await comprimirImagen(file, { maxLado: 900, calidad: 0.72 });
      setComprobante({ dataUrl: c.dataUrl, bytes: c.bytes });
    } catch {
      setComprobante(null);
    } finally {
      setProcesandoFoto(false);
    }
  };

  const dias = useMemo(() => diasProduccion(settings?.produccion?.diasHabilitados), [settings]);
  const [fechaSel, setFechaSel] = useState(dias[0]?.fecha || '');
  const [horaSel, setHoraSel] = useState(settings?.produccion?.horas?.[0] || '13:00');

  const comunasGratis = settings?.delivery?.comunasGratis || [];
  const gratisDesde = settings?.delivery?.gratisDesdeEmpanadas ?? 2;
  const enZona = comunasGratis.includes(form.comuna);
  const cumpleMinimo = resumen.totalEmpanadas >= gratisDesde;
  const delivery = enZona && cumpleMinimo ? 0 : (settings?.delivery?.costo ?? 1000);
  const total = resumen.total + delivery;

  if (resumen.vacio) {
    navigate('/carrito', { replace: true });
    return null;
  }

  const validar = () => {
    const e = {};
    CAMPOS.forEach((c) => { if (c.requerido && !form[c.id].trim()) e[c.id] = 'Obligatorio'; });
    if (form.telefono && form.telefono.replace(/\D/g, '').length < 8) e.telefono = 'Teléfono inválido';
    if (!fechaSel) e.fecha = 'Elige un día';
    setErrores(e);
    return Object.keys(e).length === 0;
  };

  const confirmar = async () => {
    if (!validar()) return;
    setEnviando(true);
    const items = [
      ...empanadas.map((e) => ({ ...e, tipo: 'empanada' })),
      ...bebidas.map((b) => ({
        tipo: 'bebida', id: b.id, nombre: b.nombre, emoji: b.emoji,
        cantidad: b.cantidad, precio: b.precio,
      })),
    ];
    const pedido = {
      items,
      cliente: { ...form },
      entrega: { fecha: fechaSel, hora: horaSel },
      totales: { subtotal: resumen.total + resumen.ahorro, ahorro: resumen.ahorro, delivery, total },
      oferta: { ahorro: resumen.ahorro, detalle: resumen.detalle || [] },
      etiquetas: [...new Set(empanadas.flatMap((e) => e.etiquetas || []))],
      comprobante: comprobante?.dataUrl || null,
      fuente: 'web',
    };
    const creado = await crearPedido(pedido);
    const completo = { ...pedido, numero: creado.numero, id: creado.id };
    registrarPedido(pedido);
    let resultado = 'texto';
    try {
      resultado = await enviarPedidoWhatsApp({ pedido: completo, comprobanteDataUrl: comprobante?.dataUrl || null, numero: whatsapp });
    } catch { /* el ticket queda igual en la página siguiente */ }
    vaciar();
    navigate('/ticket', { state: { pedido: completo, envio: resultado }, replace: true });
    setEnviando(false);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 pb-44 pt-6">
      <Titulo sub="Completa tus datos para confirmar">Finaliza tu pedido</Titulo>
      <SeparadorOrnamental className="mt-3 w-48" />

      <div className="mt-5 space-y-4">
        {CAMPOS.map((c) => (
          <Campo key={c.id} {...c} valor={form[c.id]} error={errores[c.id]}
            onChange={(v) => setForm((f) => ({ ...f, [c.id]: v }))} />
        ))}

        <div>
          <label htmlFor="comuna" className="vt-serif mb-1 block text-sm font-bold uppercase tracking-wide">Comuna</label>
          <select id="comuna" value={form.comuna} onChange={(e) => setForm((f) => ({ ...f, comuna: e.target.value }))}
            className="vt-input w-full px-4 py-3 text-base">
            {COMUNAS_SANTIAGO.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          {enZona ? (
            <p className="vt-cuerpo mt-1 text-xs font-bold text-[#3b7a3e]">
              Delivery gratis desde {gratisDesde} empanadas
            </p>
          ) : (
            <p className="vt-cuerpo mt-1 text-xs opacity-60">Delivery con costo: {fmtCLP(delivery)}</p>
          )}
        </div>

        <Campo id="referencias" label="Referencias (opcional)" tipo="text"
          placeholder="Ej: portón negro, timbre 3" valor={form.referencias}
          onChange={(v) => setForm((f) => ({ ...f, referencias: v }))} />

        <div>
          <p className="vt-serif mb-1 text-sm font-bold uppercase tracking-wide">Día de entrega</p>
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {dias.map((d) => (
              <button key={d.fecha} onClick={() => setFechaSel(d.fecha)}
                className={`btn-tap flex-shrink-0 rounded-full border-2 px-4 py-2 text-sm font-bold capitalize ${
                  fechaSel === d.fecha ? 'vt-pestana-activa' : 'border-[#4a2c17]/20'
                }`}>
                {d.etiqueta}
              </button>
            ))}
          </div>
          {errores.fecha && <p className="vt-serif mt-1 text-xs font-bold text-[#a33]">{errores.fecha}</p>}
          <p className="vt-cuerpo mt-1 text-xs opacity-60">
            Producimos solo {settings?.produccion?.diasHabilitados?.join(', ')}.
          </p>
        </div>

        <div>
          <p className="vt-serif mb-1 text-sm font-bold uppercase tracking-wide">Hora aproximada</p>
          <div className="flex flex-wrap gap-2">
            {(settings?.produccion?.horas || []).map((h) => (
              <button key={h} onClick={() => setHoraSel(h)}
                className={`btn-tap rounded-full border-2 px-3 py-1.5 text-sm font-bold ${
                  horaSel === h ? 'vt-pestana-activa' : 'border-[#4a2c17]/20'
                }`}>
                {h}
              </button>
            ))}
          </div>
        </div>

        <div className="vt-sello rounded-2xl p-4">
          <p className="vt-titulo text-sm uppercase tracking-wide">
            Comprobante de pago <span className="vt-cuerpo font-normal normal-case italic opacity-60">(opcional)</span>
          </p>
          <p className="vt-cuerpo mt-1 text-xs italic opacity-60">Sube la foto del depósito o transferencia. El admin la verá en tu pedido.</p>
          <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={tomarComprobante} />
          {comprobante ? (
            <div className="mt-3 flex items-center gap-3">
              <img src={comprobante.dataUrl} alt="Comprobante de pago" className="vt-sello h-16 w-16 rounded-lg object-cover" />
              <div className="vt-cuerpo flex-1 text-xs italic opacity-70">Comprobante adjunto ({Math.round(comprobante.bytes / 1024)} KB)</div>
              <button onClick={() => setComprobante(null)} className="btn-tap vt-serif text-sm font-bold text-[#a33]" type="button">Quitar</button>
            </div>
          ) : (
            <button type="button" onClick={() => fileRef.current?.click()} disabled={procesandoFoto}
              className="btn-tap vt-btn-fantasma mt-3 w-full rounded-xl border-dashed px-4 py-3 text-sm">
              {procesandoFoto ? 'Procesando…' : 'Tomar o subir foto'}
            </button>
          )}
        </div>

        <div className="vt-sello rounded-3xl p-4">
          <p className="vt-titulo text-base">Resumen</p>
          <div className="mt-2 space-y-1 text-sm">
            <Row label="Subtotal" value={fmtCLP(resumen.total + resumen.ahorro)} />
            {resumen.ahorro > 0 && <Row label="Ahorro ofertas" value={`−${fmtCLP(resumen.ahorro)}`} verde />}
            <Row label="Delivery" value={delivery === 0 ? 'GRATIS' : fmtCLP(delivery)} verde={delivery === 0} />
            <div className="mt-2 flex items-center justify-between border-t-2 border-[#4a2c17]/25 pt-2">
              <span className="vt-titulo text-lg">Total</span>
              <span className="vt-titulo text-2xl">{fmtCLP(total)}</span>
            </div>
          </div>
          <p className="vt-cuerpo mt-3 text-xs italic opacity-60">{settings?.pago?.mensaje}</p>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-12 z-40 border-t-2 border-[#4a2c17]/30 bg-[#f3e6c8]/95 p-4 backdrop-blur h-safe-b">
        <div className="mx-auto max-w-3xl">
          <Boton onClick={confirmar} disabled={enviando}>
            {enviando ? 'Enviando…' : `Enviar pedido por WhatsApp · ${fmtCLP(total)}`}
          </Boton>
          <p className="vt-cuerpo mt-1.5 text-center text-[11px] italic opacity-60">
            Se enviará el ticket como imagen y tu comprobante al WhatsApp de la cocina
          </p>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, verde }) {
  return (
    <div className="flex justify-between">
      <span className="vt-cuerpo opacity-70">{label}</span>
      <span className={`vt-serif font-bold ${verde ? 'text-[#3b7a3e]' : ''}`}>{value}</span>
    </div>
  );
}

function Campo({ id, label, tipo, placeholder, valor, onChange, error, requerido }) {
  return (
    <div>
      <label htmlFor={id} className="vt-serif mb-1 block text-sm font-bold uppercase tracking-wide">
        {label} {requerido && <span className="text-[#8b4513]">*</span>}
      </label>
      <input id={id} type={tipo} value={valor} placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)} aria-invalid={Boolean(error)}
        className={`vt-input w-full px-4 py-3 text-base ${error ? 'border-[#a33]' : ''}`}
        style={error ? { borderColor: '#a33' } : undefined} />
      {error && <p className="vt-serif mt-1 text-xs font-bold text-[#a33]">{error}</p>}
    </div>
  );
}
