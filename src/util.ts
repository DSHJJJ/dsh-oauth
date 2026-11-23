/** Small HTTP/cookie/crypto helpers shared by the host plugin. */

import { createHmac, timingSafeEqual } from 'node:crypto'

/** Request timeout for every outbound OAuth call. */
export const FETCH_TIMEOUT_MS = 15_000

/** @returns URL-safe base64 for a string or buffer. */
export function b64url(value: string | Buffer): string {
  return Buffer.from(value).toString('base64url')
}

/** @returns HMAC-SHA256 signature text. */
export function sign(text: string, secret: Buffer): string {
  return createHmac('sha256', secret).update(text).digest('base64url')
}

/** @returns whether the trailing signature matches the signed body. */
export function signatureValid(text: string, secret: Buffer): boolean {
  const dot = text.lastIndexOf('.')
  if (dot < 0) return false
  const expected = Buffer.from(sign(text.slice(0, dot), secret), 'utf8')
  const actual = Buffer.from(text.slice(dot + 1), 'utf8')
  return expected.length === actual.length && timingSafeEqual(expected, actual)
}

/** Serialize a signed cookie payload as `v1.<b64>.<sig>`. */
export function encodeSigned(payload: Record<string, unknown>, secret: Buffer): string {
  const body = `v1.${b64url(JSON.stringify(payload))}`
  return `${body}.${sign(body, secret)}`
}

/** Decode a signed cookie value, rejecting tampering and expiry. */
export function decodeSigned<T>(value: string, secret: Buffer): T | undefined {
  if (!value.startsWith('v1.') || !signatureValid(value, secret)) return undefined
  const dot = value.lastIndexOf('.')
  try {
    const parsed = JSON.parse(Buffer.from(value.slice(3, dot), 'base64url').toString('utf8')) as T & { exp?: number }
    if (typeof parsed.exp !== 'number' || parsed.exp <= Date.now()) return undefined
    return parsed
  } catch {
    return undefined
  }
}

/** Read one header from a `Headers` instance or a plain record. */
export function headerValue(headers: unknown, key: string): string | undefined {
  if (headers === undefined || headers === null) return undefined
  const candidate = headers as { get?: (name: string) => string | null }
  if (typeof candidate.get === 'function') return candidate.get(key) ?? undefined
  const record = headers as Record<string, string | string[] | undefined>
  const direct = record[key] ?? record[key.toLowerCase()]
  if (Array.isArray(direct)) return direct.join(', ')
  return typeof direct === 'string' ? direct : undefined
}

/** Read one cookie value out of a Cookie header. */
export function readCookie(header: string | undefined, name: string): string | undefined {
  if (typeof header !== 'string') return undefined
  for (const part of header.split(';')) {
    const index = part.indexOf('=')
    if (index < 0 || part.slice(0, index).trim() !== name) continue
    try {
      return decodeURIComponent(part.slice(index + 1).trim())
    } catch {
      return undefined
    }
  }
  return undefined
}

/** Cookie attributes shared by every Set-Cookie this plugin emits. */
export interface CookieOptions {
  path: string
  maxAgeSeconds?: number
  secure: boolean
}

/** Build a Set-Cookie header value. */
export function cookie(name: string, value: string, options: CookieOptions): string {
  const parts = [`${name}=${encodeURIComponent(value)}`, `Path=${options.path}`, 'HttpOnly', 'SameSite=Lax']
  if (options.maxAgeSeconds !== undefined) parts.push(`Max-Age=${Math.floor(options.maxAgeSeconds)}`)
  if (options.secure) parts.push('Secure')
  return parts.join('; ')
}

/** Escape a value for HTML text and attribute contexts. */
export function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

/** Fetch with an abort deadline so a hung IdP cannot pin a request. */
export async function fetchWithTimeout(url: string, init: RequestInit = {}): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  try {
    return await fetch(url, { ...init, signal: controller.signal })
  } finally {
    clearTimeout(timer)
  }
}
