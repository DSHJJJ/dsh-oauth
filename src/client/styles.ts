/** Inline styles shared by the settings section. */

import type { CSSProperties } from 'react'

export const styles: Record<string, CSSProperties> = {
  wrap: { display: 'flex', flexDirection: 'column', gap: 16, padding: '4px 0', fontSize: 13, lineHeight: 1.5 },
  card: {
    border: '0.5px solid color-mix(in srgb, currentColor 16%, transparent)',
    borderRadius: 10,
    padding: 14,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  row: { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  grow: { flex: 1, minWidth: 0 },
  input: {
    boxSizing: 'border-box',
    width: '100%',
    minHeight: 32,
    padding: '4px 8px',
    fontSize: 13,
    borderRadius: 6,
    color: 'inherit',
    background: 'transparent',
    border: '0.5px solid color-mix(in srgb, currentColor 22%, transparent)',
  },
  button: {
    minHeight: 30,
    padding: '4px 12px',
    fontSize: 13,
    borderRadius: 6,
    cursor: 'pointer',
    color: 'inherit',
    background: 'color-mix(in srgb, currentColor 8%, transparent)',
    border: '0.5px solid color-mix(in srgb, currentColor 22%, transparent)',
  },
  primary: {
    minHeight: 30,
    padding: '4px 14px',
    fontSize: 13,
    borderRadius: 6,
    cursor: 'pointer',
    color: 'light-dark(#fff, #222)',
    background: 'light-dark(#222, #eee)',
    border: 0,
  },
  muted: { opacity: 0.65 },
  error: { color: 'light-dark(#a10c0c, #ffb3b3)' },
  label: { display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 160 },
}
