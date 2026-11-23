/** Minimal structural types for the browser surfaces this plugin uses. */

import type { ComponentType } from 'react'

/** Options accepted by `ctx.slots.register`. */
export interface ClientSlotOptions {
  name: string
  id?: string
  order?: number
  label?: () => string
  locale?: string
}

/** Slot registry exposed by the renderer plugin. */
export interface ClientSlotRegistry {
  inject(name: string, register: () => () => void): void
  register(options: ClientSlotOptions, component: ComponentType<{ close: () => void }>): () => void
}

/** Locale service exposed by the locale plugin. */
export interface ClientLocale {
  register(namespace: string, dictionaries: Record<string, Record<string, string>>): () => void
  bind(namespace: string): (key: string) => string
}

/** Browser-side Cordis context surface consumed here. */
export interface ClientContext {
  readonly slots: ClientSlotRegistry
  readonly locale: ClientLocale
  effect(callback: () => void | (() => void), label?: string): void
}
