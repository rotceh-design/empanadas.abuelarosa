import { motion, AnimatePresence } from 'framer-motion';
import { SeparadorOrnamental } from './Ornamentos';

/* Modal que explica qué va a pasar al pulsar "Pagar":
   redirección a WhatsApp, envío de datos de pago y comprobante de vuelta. */
export default function ModalPago({ abierto, total, onConfirmar, onCancelar, enviando }) {
  return (
    <AnimatePresence>
      {abierto && (
        <motion.div
          className="vt-modal-fondo fixed inset-0 z-[80] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onCancelar}
        >
          <motion.div
            className="vt-modal w-full max-w-sm rounded-2xl px-6 py-7 text-center"
            initial={{ scale: 0.9, y: 16 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.94, y: 10 }}
            transition={{ type: 'spring', stiffness: 220, damping: 22 }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Confirmar pago por WhatsApp"
          >
            <span className="text-4xl" aria-hidden>💬</span>
            <h2 className="vt-titulo mt-2 text-xl leading-tight sm:text-2xl">
              ¿QUÉ VA A PASAR?
            </h2>
            <SeparadorOrnamental className="mx-auto mt-3 w-36" />

            <ol className="vt-cuerpo mx-auto mt-4 max-w-[19rem] space-y-3 text-left text-[0.95rem] leading-snug">
              <li className="flex gap-2.5">
                <span className="vt-serif shrink-0 font-bold">1.</span>
                <span>Se cambiará a <strong>WhatsApp</strong> para mandar el pedido al local.</span>
              </li>
              <li className="flex gap-2.5">
                <span className="vt-serif shrink-0 font-bold">2.</span>
                <span>Se te confirmará el pago y te enviarán los <strong>medios de pago</strong>.</span>
              </li>
              <li className="flex gap-2.5">
                <span className="vt-serif shrink-0 font-bold">3.</span>
                <span>Debes enviar el <strong>comprobante</strong>.</span>
              </li>
              <li className="flex gap-2.5">
                <span className="vt-serif shrink-0 font-bold">4.</span>
                <span>Se <strong>confirmará el pago</strong> y ya.</span>
              </li>
            </ol>

            {total > 0 && (
              <p className="vt-serif mt-4 text-lg font-bold">
                Total: ${total.toLocaleString('es-CL')}
              </p>
            )}

            <div className="mt-5 space-y-2.5">
              <button
                type="button"
                onClick={onConfirmar}
                disabled={enviando}
                className="vt-btn btn-tap w-full rounded-full px-5 py-3.5 text-sm disabled:opacity-50"
              >
                {enviando ? 'Abriendo…' : 'Entendido — Ir a WhatsApp →'}
              </button>
              <button
                type="button"
                onClick={onCancelar}
                className="vt-btn-fantasma btn-tap w-full rounded-full px-5 py-2.5 text-xs"
              >
                Volver
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
