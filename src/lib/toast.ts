import { create } from 'zustand'

export type ToastKind = 'error' | 'info'

export type Toast = {
  id: string
  kind: ToastKind
  message: string
}

type PushInput = { kind: ToastKind; message: string; ttl?: number }

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
  push: ({ kind, message, ttl }) => {
    const id = crypto.randomUUID()
    set((s) => ({ toasts: [...s.toasts, { id, kind, message }] }))
    const timeout = ttl ?? DEFAULT_TTL[kind]
    setTimeout(() => get().dismiss(id), timeout)
  },
  dismiss: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))
