import { create } from 'zustand'
import { uid } from './uid'

export type ToastKind = 'error' | 'info'

/** Inline action rendered as a clickable word inside the toast message.
 * Toaster matches `label` in the message text and replaces it with a button. */
export type ToastAction = {
  label: string
  intent: 'open-settings'
}

export type Toast = {
  id: string
  kind: ToastKind
  message: string
  action?: ToastAction
}

type PushInput = {
  kind: ToastKind
  message: string
  ttl?: number
  action?: ToastAction
}

type ToastStore = {
  toasts: Toast[]
  push: (t: PushInput) => void
  dismiss: (id: string) => void
}

const DEFAULT_TTL: Record<ToastKind, number> = {
  info: 4000,
  error: 6000,
}

export const useToastStore = create<ToastStore>((set, get) => ({
  toasts: [],
  push: ({ kind, message, ttl, action }) => {
    const id = uid()
    set((s) => ({ toasts: [...s.toasts, { id, kind, message, action }] }))
    const timeout = ttl ?? DEFAULT_TTL[kind]
    setTimeout(() => get().dismiss(id), timeout)
  },
  dismiss: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))
