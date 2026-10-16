import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { COMUNAS_SANTIAGO } from '../data/catalogoSeed';
import { guardarEnvio, getEnvio } from '../lib/envio';
import { MarcoOrnamental, SeparadorOrnamental } from '../components/vintage/Ornamentos';

const CAMPOS = [
  { id: 'nombre', label: 'Tu nombre', tipo: 'text', placeholder: 'Ej: Marjorie Fuentes', requerido: true },
  { id: 'telefono', label: 'Teléfono (WhatsApp)', tipo: 'tel', placeholder: '+56 9 1234 5678', requerido: true },
  { id: 'direccion', label: 'Dirección', tipo: 'text', placeholder: 'Av. pajaritos 1234, depto 5', requerido: true },
];

export default function Envio() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const lineaId = searchParams.get('linea') || 'salada';
  const esDelDia = searchParams.get('delDia') === '1';

  const guardado = getEnvio();
  const [form, setForm] = useState({
    nombre: guardado?.nombre || '',
    telefono: guardado?.telefono || '',
    direccion: guardado?.direccion || '',
    comuna: guardado?.comuna || 'Maipú',
    referencias: guardado?.referencias || '',
  });
  const [errores, setErrores] = useState({});

  const validar = () => {
    const e = {};
    CAMPOS.forEach((c) => { if (c.requerido && !form[c.id].trim()) e[c.id] = 'Obligatorio'; });
    if (form.telefono && form.telefono.replace(/\D/g, '').length < 8) e.telefono = 'Teléfono inválido';
    setErrores(e);
    return Object.keys(e).length === 0;
  };

  const continuar = (ev) => {
    ev.preventDefault();
    if (!validar()) return;
    guardarEnvio(form);
    // Flujo del día: la empanada ya está en el carrito → volver a la portada para pagar.
    navigate(esDelDia ? '/' : `/configurar?linea=${lineaId}`);
  };

  return (
    <div className="vt-papel vt-tinta flex min-h-screen flex-col items-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <MarcoOrnamental className="bg-[#f7ecd4]/50 px-5 py-7 sm:px-8">
          <h1 className="vt-titulo text-center text-2xl leading-tight sm:text-3xl">
            TUS DATOS DE ENTREGA
          </h1>
          <SeparadorOrnamental className="mx-auto mt-3 w-40" />
          <p className="vt-cuerpo mt-3 text-center text-base italic opacity-80">
            Solo esta vez — después ya no te lo preguntamos
          </p>

          <form onSubmit={continuar} className="mt-6 space-y-4" noValidate>
            {CAMPOS.map((c) => (
              <div key={c.id}>
                <label htmlFor={c.id} className="vt-serif mb-1 block text-sm font-bold uppercase tracking-wide">
                  {c.label} {c.requerido && <span className="text-[#8b4513]">*</span>}
                </label>
                <input
                  id={c.id} type={c.tipo} value={form[c.id]} placeholder={c.placeholder}
                  onChange={(e) => setForm((f) => ({ ...f, [c.id]: e.target.value }))}
                  aria-invalid={Boolean(errores[c.id])}
                  className={`vt-input w-full px-4 py-3 text-base ${errores[c.id] ? 'border-[#a33] !important' : ''}`}
                  style={errores[c.id] ? { borderColor: '#a33' } : undefined}
                />
                {errores[c.id] && <p className="mt-1 text-xs font-bold text-[#a33]">{errores[c.id]}</p>}
              </div>
            ))}

            <div>
              <label htmlFor="comuna" className="vt-serif mb-1 block text-sm font-bold uppercase tracking-wide">
                Comuna
              </label>
              <select
                id="comuna" value={form.comuna}
                onChange={(e) => setForm((f) => ({ ...f, comuna: e.target.value }))}
                className="vt-input w-full px-4 py-3 text-base"
              >
                {COMUNAS_SANTIAGO.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label htmlFor="referencias" className="vt-serif mb-1 block text-sm font-bold uppercase tracking-wide">
                Referencias <span className="font-normal normal-case italic opacity-60">(opcional)</span>
              </label>
              <input
                id="referencias" type="text" value={form.referencias}
                placeholder="Ej: portón negro, timbre 3"
                onChange={(e) => setForm((f) => ({ ...f, referencias: e.target.value }))}
                className="vt-input w-full px-4 py-3 text-base"
              />
            </div>

            <button type="submit" className="vt-btn btn-tap mt-2 w-full rounded-full px-6 py-4 text-base">
              {esDelDia ? 'Continuar → Volver a mi pedido' : 'Continuar → Elegir empanadas'}
            </button>
          </form>
        </MarcoOrnamental>

        <p className="vt-cuerpo mt-4 text-center text-sm italic opacity-60">
          Usaremos estos datos solo para tu pedido 🛵
        </p>
      </motion.div>
    </div>
  );
}
