import { AnimatePresence, motion } from 'framer-motion'
import { useToastStore, type Toast, type ToastAction } from '../lib/toast'
import { useBrainstormStore } from '../store'
import { TRANSITION } from '../lib/motion'

function runAction(intent: ToastAction['intent']) {
  if (intent === 'open-settings') {
    const s = useBrainstormStore.getState()
    s.selectNode(null)
    s.setSettingsAIOpen(true)
  }
}

function renderMessage(t: Toast, dismiss: (id: string) => void) {
  if (!t.action) return t.message
  const i = t.message.indexOf(t.action.label)
  if (i === -1) return t.message
  const before = t.message.slice(0, i)
  const after = t.message.slice(i + t.action.label.length)
  return (
    <>
      {before}
      <button
        onClick={(e) => {
          e.stopPropagation()
          runAction(t.action!.intent)
          dismiss(t.id)
        }}
        className="underline underline-offset-2 font-medium hover:opacity-80 transition-opacity"
      >
        {t.action.label}
      </button>
      {after}
    </>
  )
}

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
            className={`pointer-events-auto px-3.5 py-2.25 rounded-control text-ui shadow-toast border ${
              t.kind === 'error'
                ? 'bg-danger-soft text-danger border-danger/20'
                : 'bg-surface-soft text-ink/60 border-line-neutral/60'
            }`}
            role={t.kind === 'error' ? 'alert' : 'status'}
            onClick={() => dismiss(t.id)}
          >
            {renderMessage(t, dismiss)}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
