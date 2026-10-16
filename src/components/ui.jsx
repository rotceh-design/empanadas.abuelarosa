import { motion } from 'framer-motion';
import { IconoCarrito, IconoEmpanada } from './Iconos';

// Componentes base con estética vintage "Abuela Rosa".
// Compartidos por Armar, Carrito, Checkout y Ticket.

export function Tarjeta({ children, className = '', ...props }) {
  return (
    <div className={`vt-sello rounded-2xl p-4 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function Boton({
  children, onClick, variante = 'principal', className = '', disabled, tipo = 'button', ...props
}) {
  const base = 'btn-tap inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-4 text-base uppercase tracking-wide disabled:opacity-40';
  const variantes = {
    principal: 'vt-btn',
    secundario: 'vt-btn-fantasma',
    suave: 'vt-btn-fantasma',
    peligro: 'vt-btn-fantasma border-[#a33] text-[#a33] hover:bg-[#a33]',
    exito: 'vt-btn-fantasma border-[#3b7a3e] text-[#3b7a3e] hover:bg-[#3b7a3e]',
  };
  return (
    <motion.button
      type={tipo}
      whileTap={disabled ? undefined : { scale: 0.96 }}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${variantes[variante]} ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
}

export function Etiqueta({ children, color = '#8b4513', emoji, className = '' }) {
  return (
    <span
      className={`vt-serif inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-bold ${className}`}
      style={{ background: `${color}14`, color, borderColor: `${color}66` }}
    >
      {emoji && <span aria-hidden>{emoji}</span>}
      {children}
    </span>
  );
}

export function Titulo({ children, sub, className = '' }) {
  return (
    <div className={className}>
      <h2 className="vt-titulo text-2xl uppercase leading-tight">{children}</h2>
      {sub && <p className="vt-cuerpo mt-1 text-sm italic opacity-70">{sub}</p>}
    </div>
  );
}

export function Vacio({ icono = 'carrito', titulo, texto, accion }) {
  const Icono = icono === 'empanada' ? IconoEmpanada : IconoCarrito;
  return (
    <div className="flex min-h-[55vh] flex-col items-center justify-center px-6 text-center">
      <motion.div
        className="mb-4"
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 2.5, repeat: Infinity }}
      >
        <Icono size={64} color="#8b4513" />
      </motion.div>
      <p className="vt-serif mb-1 text-xs font-bold uppercase tracking-[0.2em] opacity-55">Abuela Rosa</p>
      <h2 className="vt-titulo text-xl uppercase">{titulo}</h2>
      <p className="vt-cuerpo mb-6 mt-1 max-w-xs text-sm italic opacity-70">{texto}</p>
      {accion}
    </div>
  );
}
