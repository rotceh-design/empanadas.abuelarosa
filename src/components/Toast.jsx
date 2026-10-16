import { AnimatePresence, motion } from 'framer-motion';
import { useCart } from '../contexts/CartContext';

export default function Toast() {
  const { toast } = useCart();
  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          key={toast.id}
          initial={{ opacity: 0, y: 40, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex justify-center px-4"
          role="status"
          aria-live="polite"
        >
          <div className="flex items-center gap-2 rounded-2xl bg-tierra-800 px-5 py-3 text-sm font-bold text-crema-100 shadow-lift dark:bg-crema-200 dark:text-tierra-900">
            <span aria-hidden>{toast.emoji}</span>
            {toast.mensaje}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
