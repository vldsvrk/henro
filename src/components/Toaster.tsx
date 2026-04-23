import { AnimatePresence, motion } from 'framer-motion'
import { useToastStore } from '../lib/toast'

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts)
  const dismiss = useToastStore((s) => s.dismiss)

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] flex flex-col gap-[8px] items-center pointer-events-none">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className={`pointer-events-auto px-[14px] py-[9px] rounded-[10px] text-[13px] font-medium shadow-[0_4px_16px_rgba(0,0,0,0.08)] border ${
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
