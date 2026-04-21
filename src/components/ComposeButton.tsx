import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import { useBrainstormStore } from '../store'

export function ComposeButton() {
  const compose = useBrainstormStore((s) => s.compose)
  const composeResult = useBrainstormStore((s) => s.composeResult)
  const composeOpen = useBrainstormStore((s) => s.composeOpen)
  const openCompose = useBrainstormStore((s) => s.openCompose)
  const closeCompose = useBrainstormStore((s) => s.closeCompose)
  const isLoading = useBrainstormStore((s) => s.isLoading)
  const nodeCount = useBrainstormStore(
    (s) => Object.values(s.nodes).filter((n) => n.status === 'active').length,
  )
  const hasSelection = useBrainstormStore((s) => s.selectedNodeId !== null)

  const [hiddenByPanel, setHiddenByPanel] = useState(hasSelection)
  useEffect(() => {
    if (hasSelection) {
      setHiddenByPanel(true)
      return
    }
    const t = setTimeout(() => setHiddenByPanel(false), 200)
    return () => clearTimeout(t)
  }, [hasSelection])

  const [copied, setCopied] = useState<'text' | 'md' | null>(null)
  useEffect(() => {
    if (!copied) return
    const t = setTimeout(() => setCopied(null), 1400)
    return () => clearTimeout(t)
  }, [copied])

  useEffect(() => {
    if (!composeOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeCompose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [composeOpen, closeCompose])

  const composing = isLoading === 'compose'
  const canCompose = nodeCount >= 2
  const showFab =
    !composeOpen && !hiddenByPanel && (canCompose || !!composeResult)

  const stripMd = (md: string) =>
    md
      .replace(/^#{1,6}\s+/gm, '')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/^>\s?/gm, '')
      .replace(/^[-*+]\s+/gm, '• ')
      .replace(/^\d+\.\s+/gm, '')

  const copyPlain = async () => {
    if (!composeResult) return
    await navigator.clipboard.writeText(stripMd(composeResult))
    setCopied('text')
  }
  const copyMd = async () => {
    if (!composeResult) return
    await navigator.clipboard.writeText(composeResult)
    setCopied('md')
  }

  return (
    <>
      {showFab && (
        <button
          onClick={composeResult ? openCompose : compose}
          disabled={composing}
          className="fixed bottom-6 right-6 z-40 px-[16px] py-[8px] rounded-[8px] bg-ink hover:opacity-90 text-[14px] font-medium text-white disabled:opacity-50 transition-opacity"
        >
          {composing ? 'Composing...' : composeResult ? 'View Summary' : 'Compose'}
        </button>
      )}

      <AnimatePresence>
        {composeOpen && composeResult && (
          <motion.div
            key="compose-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 flex items-center justify-center bg-black/20 z-50 p-4"
            onClick={closeCompose}
          >
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-[13px] w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden"
            >
              <div className="flex items-center justify-between px-[20px] py-[15px] border-b border-[var(--color-line-neutral)]/60">
                <span className="text-sm text-ink/60">Composition</span>
                <button
                  onClick={closeCompose}
                  aria-label="Close"
                  className="w-[28px] h-[28px] rounded-[8px] flex items-center justify-center text-ink/60 hover:text-ink hover:bg-chip transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                  </svg>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-[24px] py-[20px]">
                <div className="prose-compose text-[15px] text-ink leading-[1.6]">
                  <ReactMarkdown>{composeResult}</ReactMarkdown>
                </div>
              </div>

              <div className="flex items-center gap-[8px] px-[16px] py-[12px] border-t border-[var(--color-line-neutral)]/60 bg-surface-soft">
                <button
                  onClick={copyPlain}
                  className="px-[14px] py-[7px] rounded-[8px] bg-chip hover:bg-[#eee] text-[13px] font-medium text-ink transition-colors"
                >
                  {copied === 'text' ? 'Copied' : 'Copy'}
                </button>
                <button
                  onClick={copyMd}
                  className="px-[14px] py-[7px] rounded-[8px] bg-chip hover:bg-[#eee] text-[13px] font-medium text-ink transition-colors"
                >
                  {copied === 'md' ? 'Copied' : 'Copy as Markdown'}
                </button>
                <div className="flex-1" />
                <button
                  onClick={compose}
                  disabled={composing}
                  className="px-[14px] py-[7px] rounded-[8px] bg-ink hover:opacity-90 text-[13px] font-medium text-white disabled:opacity-50 transition-opacity"
                >
                  {composing ? 'Regenerating...' : 'Regenerate'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
