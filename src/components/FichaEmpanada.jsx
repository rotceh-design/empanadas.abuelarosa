import { fmtCLP } from '../lib/formato';
import { SeparadorOrnamental } from './vintage/Ornamentos';

export function FilaPrecio({ emoji, nombre, etiqueta, aporte, sangria = false }) {
  return (
    <div className={`flex items-baseline gap-2 ${sangria ? 'pl-6' : ''}`}>
      <span className="vt-cuerpo min-w-0 flex-1 truncate text-sm">
        {etiqueta && (
          <span className="vt-serif mr-1.5 text-[10px] font-bold uppercase tracking-widest opacity-45">
            {etiqueta}
          </span>
        )}
        {emoji} {nombre}
      </span>
      <span className="vt-serif shrink-0 text-sm font-bold tabular-nums">
        {aporte > 0 ? `+${fmtCLP(aporte)}` : 'incluido'}
      </span>
    </div>
  );
}

function Titulo({ children }) {
  return (
    <p className="vt-serif mt-3 text-[10px] font-bold uppercase tracking-[0.2em] opacity-50">{children}</p>
  );
}

// Ficha del pedido: concepto + qué lleva + precio detallado. El desglose
// siempre cierra con `desglose.total`.
export default function FichaEmpanada({
  nombre, desglose, esDulce = false,
  etiquetaTotal = 'Total', etiquetaAjuste = null, className = '',
}) {
  const ings = desglose.ingredientes || [];
  const base = ings.filter((i) => i.tipo === 'proteina' || i.tipo === 'relleno');
  const quesos = ings.filter((i) => i.tipo === 'queso');
  const acomps = ings.filter((i) => i.tipo === 'acompanamiento' || i.tipo === 'extra');
  const extras = desglose.extras || [];
  const sumaAcomps = acomps.reduce((s, a) => s + a.aporte, 0);

  return (
    <div className={className}>
      {nombre && (
        <div className="border-b-2 border-[#4a2c17]/15 bg-[#4a2c17]/6 px-4 py-3">
          <p className="vt-serif text-[10px] font-bold uppercase tracking-[0.2em] opacity-50">Tu concepto</p>
          <p className="vt-titulo mt-0.5 text-lg leading-tight">{nombre}</p>
        </div>
      )}

      <div className="px-4 pb-1">
        <Titulo>Qué lleva</Titulo>
        <div className="vt-cuerpo mt-2 space-y-1.5">
          {base.map((i) => (
            <FilaPrecio key={i.id} emoji={i.emoji} nombre={i.nombre} etiqueta={esDulce ? 'Relleno' : 'Proteína'} aporte={i.aporte} />
          ))}
          {quesos.map((i) => (
            <FilaPrecio key={i.id} emoji={i.emoji} nombre={i.nombre} etiqueta="Queso" aporte={i.aporte} />
          ))}
          {acomps.length > 0 && (
            <>
              <div className="flex items-baseline gap-2 pt-1">
                <span className="vt-serif min-w-0 flex-1 text-[10px] font-bold uppercase tracking-widest opacity-45">
                  {esDulce ? 'Extras' : 'Acompañamientos'} ({acomps.length})
                </span>
                <span className="vt-serif shrink-0 text-[11px] font-bold tabular-nums opacity-55">
                  {fmtCLP(sumaAcomps)}
                </span>
              </div>
              {acomps.map((i) => (
                <FilaPrecio key={i.id} emoji={i.emoji} nombre={i.nombre} aporte={i.aporte} sangria />
              ))}
            </>
          )}
        </div>

        {extras.length > 0 && (
          <>
            <Titulo>Extras</Titulo>
            <div className="vt-cuerpo mt-1.5 space-y-1.5">
              {extras.map((x, i) => (
                <FilaPrecio key={`${x.nombre}-${i}`} emoji="➕" nombre={x.nombre} aporte={x.aporte} />
              ))}
            </div>
          </>
        )}

        {desglose.reservaFaltantes > 0 && (
          <div className="mt-1.5">
            <FilaPrecio emoji="⏳" nombre="Acompañamientos por elegir" aporte={desglose.reservaFaltantes} />
          </div>
        )}
      </div>

      <SeparadorOrnamental className="mx-auto mt-3 w-24" />

      <div className="px-4 pb-4 pt-2">
        <div className="vt-cuerpo flex items-baseline justify-between text-sm opacity-70">
          <span>Subtotal</span>
          <span className="vt-serif font-bold tabular-nums">{fmtCLP(desglose.bruto)}</span>
        </div>
        {desglose.ajuste !== 0 && (
          <div className="vt-cuerpo mt-1 flex items-baseline justify-between text-xs italic opacity-60">
            <span>
              {etiquetaAjuste || (desglose.ajusteTipo === 'minimo' ? 'Ajuste al precio mínimo' : 'Ajuste al precio máximo')}
            </span>
            <span className="vt-serif font-bold tabular-nums">
              {desglose.ajuste > 0 ? '+' : '−'}{fmtCLP(Math.abs(desglose.ajuste))}
            </span>
          </div>
        )}
        <div className="mt-2 flex items-baseline justify-between border-t-2 border-[#4a2c17]/20 pt-2">
          <span className="vt-serif text-xs font-extrabold uppercase tracking-wide">{etiquetaTotal}</span>
          <span className="vt-titulo text-2xl">{fmtCLP(desglose.total)}</span>
        </div>
      </div>
    </div>
  );
}
