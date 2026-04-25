import { AnimatePresence, motion } from 'framer-motion'
import { useToastStore } from '../lib/toast'
import { TRANSITION } from '../lib/motion'

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts)
  const dismiss = useToastStore((s) => s.dismiss)

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-60 flex flex-col gap-2 items-center pointer-events-none">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={TRANSITION.base}
            className={`pointer-events-auto px-3.5 py-2.25 rounded-control text-ui font-medium shadow-toast border ${
              t.kind === 'error'
                ? 'bg-danger-soft text-danger border-danger/20'
                : 'bg-surface-soft text-ink border-line-neutral/60'
            }`}
            role={t.kind === 'error' ? 'alert' : 'status'}
            onClick={() => dismiss(t.id)}
          >
            {t.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
