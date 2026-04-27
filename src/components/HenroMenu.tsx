import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { TRANSITION } from '../lib/motion'
import { LogoMarkIcon } from './icons'

const VERSION = '0.1.0'
const LAST_UPDATED = 'Apr 25, 2026'
const DOMAIN = 'henro.space'
const GITHUB_URL = 'https://github.com/vldsvrk/henro'
const TWITTER_URL = 'https://x.com/vldsvrk'

type Row = { label: string; value: React.ReactNode }

const ROWS: Row[] = [
  { label: 'Version', value: VERSION },
  { label: 'Last updated', value: LAST_UPDATED },
  { label: 'Domain', value: DOMAIN },
  {
    label: 'Github',
    value: (
      <a
        href={GITHUB_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="underline underline-offset-2 decoration-current/40 hover:opacity-100"
      >
        henro
      </a>
    ),
  },
]

export function HenroMenu() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="About henro"
        title="About henro"
        className={`w-7 h-7 flex items-center justify-center rounded-control transition-colors ${
          open ? 'bg-ink text-white' : 'bg-white text-ink hover:bg-chip'
        }`}
      >
        <LogoMarkIcon className="w-4 h-4" />
      </button>

      {/* Pre-warm the backdrop-filter compositor layer. The first frame that
       * applies backdrop-blur otherwise stalls while the GPU allocates a
       * buffer and compiles the blur shader — visible as a hitch on the
       * very first modal open. A 1px hidden element keeps the layer alive. */}
      <div
        aria-hidden
        className="fixed top-0 left-0 w-px h-px backdrop-blur-sm pointer-events-none"
        style={{ opacity: 0 }}
      />

      {createPortal(
        <AnimatePresence>
          {open && (
            <motion.div
              key="henro-menu-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={TRANSITION.fast}
              className="fixed inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm z-50 p-4"
              onClick={() => setOpen(false)}
            >
            <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                transition={TRANSITION.base}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-[20px] w-[321px] flex flex-col items-center pt-9 pb-7"
              >
              <div className="flex flex-col items-center gap-3">
                <img
                  src="/logo-color.svg"
                  alt="henro"
                  width={122}
                  height={132}
                  className="w-[100px]"
                />
                <p className="text-body opacity-60 text-center max-w-[159px] leading-[1.4]">
                  Opensource infinite canvas for thinking with AI.
                </p>
              </div>

              <dl className="grid grid-cols-[auto_auto] gap-x-3 gap-y-1 mt-10 leading-[1.4]">
                {ROWS.map(({ label, value }) => (
                  <div key={label} className="contents">
                    <dt className="text-right text-body font-medium">{label}</dt>
                    <dd className="text-body opacity-60 m-0">{value}</dd>
                  </div>
                ))}
              </dl>

              <p className="text-[10px] opacity-40 text-center mt-11 leading-[1.4]">
                Designed and Developed
                <br />
                by{' '}
                <a
                  href={TWITTER_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2 decoration-current/40"
                >
                  Vlad Savruk
                </a>
              </p>
            </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  )
}
