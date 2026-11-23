/**
 * dsh-oauth-github — third-party OAuth login for DeepSeek Harness Web.
 *
 * A catalog-driven engine (NextAuth/Passport style): every built-in provider
 * declares its endpoints, token encoding, userinfo mapping and the extra
 * configuration fields; this module owns the generic authorization-code flow,
 * allowlist matching and the signed session cookie. Feishu additionally gets
 * one-click app creation (RFC 8628 device flow) and a configuration preflight.
 *
 * Host routes (mount-relative):
 *   GET  /oauth/login                 public sign-in page
 *   GET  /oauth/<id>/start            state cookie + redirect to the IdP
 *   GET  /oauth/<id>/callback         code exchange -> session cookie -> app
 *   GET  /oauth/logout                clears the session cookie
 *   GET  /oauth/base                  public base URL info
 *   GET  /oauth/session               authenticated session banner data
 *   GET  /oauth/providers             authenticated catalog + provider list
 *   POST /oauth/providers             authenticated replace-all write (live)
 *   POST /oauth/register/start        Feishu app registration (device flow)
 *   GET  /oauth/register/poll         Feishu registration poll
 *   POST /oauth/feishu/preflight      Feishu configuration checklist / auto-config
 *
 * @module dsh-oauth-github
 */

import { randomBytes, timingSafeEqual } from 'node:crypto'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { CATALOG, normalizeInstance, profileOf, publicCatalog, resolveEndpoints, resolveSecret } from './catalog.js'
import { hostLocale, hostText, providerCopy } from './copy.js'
import { loadInstances, loadSecret, persistInstances } from './store.js'
import {
  cookie,
  decodeSigned,
  encodeSigned,
  escapeHtml,
  fetchWithTimeout,
  headerValue,
  readCookie,
} from './util.js'
import type {
  HostContext,
  PluginConfig,
  PreflightCheck,
  ProviderInstance,
  ProviderField,
} from './types.js'

/** Stable Cordis plugin name. */
export const name = 'oauth-github'

/** Services required before `apply` runs. */
export const inject = ['connection', 'connection.authentication', 'webServer', 'webApp']

const SESSION_COOKIE = 'dsh_oauth_session'
const STATE_COOKIE = 'dsh_oauth_state'
const STATE_TTL_MS = 10 * 60 * 1000
const LOG_PREFIX = 'oauth-github'
const MAX_BODY_BYTES = 64 * 1024

/** Signed session payload. */
interface SessionPayload {
  p: string
  s: string
  n?: string
  ids: string[]
  exp: number
}

/** One in-flight Feishu app registration. */
interface RegistrationState {
  deviceCode: string
  brand: 'feishu' | 'lark'
  interval: number
  expiresAt: number
}

const PAGE_STYLE = `
:root{color-scheme:light dark;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC','Hiragino Sans GB','Microsoft YaHei','Helvetica Neue',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;background:light-dark(#fafafa,#171717);color:light-dark(#222,#eee)}
body{margin:0;min-height:100dvh;display:flex;align-items:center;justify-content:center;padding:24px 16px;box-sizing:border-box}
main{box-sizing:border-box;width:100%;max-width:360px;padding:24px;border:.5px solid color-mix(in srgb,currentColor 16%,transparent);border-radius:12px;background:light-dark(#fff,#232324);display:flex;flex-direction:column;gap:14px}
h1{margin:0;font-size:20px;line-height:1.3;font-weight:500}
p{margin:0;font-size:14px;line-height:1.5;overflow-wrap:anywhere;color:color-mix(in srgb,currentColor 72%,transparent)}
a.button{display:block;box-sizing:border-box;min-height:44px;padding:10px 12px;border-radius:8px;text-align:center;text-decoration:none;font-size:14px;font-weight:500;color:light-dark(#fff,#222);background:light-dark(#222,#eee)}
a.secondary{font-size:13px;color:inherit;text-underline-offset:3px}
`

/** @returns JSON response helper (kept local so the type surface stays small). */
function jsonResponse(status: number, payload: unknown, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...extra },
  })
}

/**
 * Render the sign-in page.
 * @param basePath - mount path ending in `/`.
 * @param instances - enabled provider instances.
 * @param message - optional error text.
 * @param acceptLanguage - request Accept-Language header.
 */
function loginPage(
  basePath: string,
  instances: ProviderInstance[],
  message: string,
  acceptLanguage: string | undefined,
): string {
  const t = hostText(hostLocale(acceptLanguage))
  const notice = message ? `<p style="color:light-dark(#a10c0c,#ffb3b3)" role="alert">${escapeHtml(message)}</p>` : ''
  const buttons = instances
    .map(
      (instance) =>
        `<a class="button" href="${escapeHtml(`${basePath}oauth/${instance.id}/start`)}">${escapeHtml(`${t.loginWith} ${instance.label}`)}</a>`,
    )
    .join('')
  const none = instances.length === 0 ? `<p>${t.noneConfigured}</p>` : ''
  return `<!doctype html><html lang="${hostLocale(acceptLanguage)}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="referrer" content="no-referrer"><meta name="robots" content="noindex"><title>${t.loginTitle}</title><style>${PAGE_STYLE}</style></head><body><main><h1>${t.loginTitle}</h1><p>${t.loginIntro}</p>${notice}${buttons}${none}<p>${t.otherMethods} <a class="secondary" href="${escapeHtml(basePath)}?login=page">${t.nativeLogin}</a></p></main></body></html>`
}

/**
 * Render a terminal error page.
 * @param status - HTTP status.
 * @param title - heading text.
 * @param detail - detail text.
 * @param basePath - mount path.
 * @param acceptLanguage - request Accept-Language header.
 */
function errorPage(
  status: number,
  title: string,
  detail: string,
  basePath: string,
  acceptLanguage: string | undefined,
): Response {
  const t = hostText(hostLocale(acceptLanguage))
  const html = `<!doctype html><html lang="${hostLocale(acceptLanguage)}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="referrer" content="no-referrer"><meta name="robots" content="noindex"><title>${escapeHtml(title)}</title><style>${PAGE_STYLE}</style></head><body><main><h1>${escapeHtml(title)}</h1><p>${escapeHtml(detail)}</p><a class="secondary" href="${escapeHtml(basePath)}oauth/login">${t.retryLogin}</a></main></body></html>`
  return new Response(html, {
    status,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
    },
  })
}

/** Read a request body with a hard size cap. */
async function readBody(request: IncomingMessage): Promise<string> {
  let size = 0
  const chunks: Buffer[] = []
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as string)
    size += buffer.length
    if (size > MAX_BODY_BYTES) throw new Error('body too large')
    chunks.push(buffer)
  }
  return Buffer.concat(chunks).toString('utf8')
}

/** Send a JSON response through a raw server response. */
function sendJson(response: ServerResponse, status: number, payload: unknown): void {
  response.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' })
  response.end(JSON.stringify(payload))
}

/**
 * Register the OAuth providers, login routes, and settings API.
 * @param ctx - plugin scope.
 * @param config - profile row config (legacy single-provider fields included).
 */
export function apply(ctx: HostContext, config: PluginConfig = {}): void {
  const secret = loadSecret(config.cookieSecret)
  const peer = ctx.connection.createPeer({ principal: { kind: 'owner' } })
  const advertised = new URL(ctx.webApp.getAdvertisedUrl() || ctx.webServer.getOrigin())
  const basePath = advertised.pathname.endsWith('/') ? advertised.pathname : `${advertised.pathname}/`
  const secure = ctx.webServer.protocol === 'https:' || advertised.protocol === 'https:'
  const maxAgeDays = Number.isFinite(Number(config.cookieMaxAgeDays)) && Number(config.cookieMaxAgeDays) > 0
    ? Number(config.cookieMaxAgeDays)
    : 30
  const maxAgeSeconds = Math.floor(maxAgeDays * 24 * 60 * 60)

  let instances: ProviderInstance[] = (() => {
    try {
      return loadInstances(config)
    } catch (error) {
      console.warn(`${LOG_PREFIX}: bad providers config: ${String(error)}`)
      return []
    }
  })()

  const enabled = (): ProviderInstance[] => instances.filter((instance) => instance.enabled)
  const byId = (id: string): ProviderInstance | undefined => instances.find((instance) => instance.id === id)
  const callbackUrl = (id: string): string => new URL(`${basePath}oauth/${id}/callback`, advertised.origin).href

  /** Request Accept-Language header. */
  const language = (headers: unknown): string | undefined => headerValue(headers, 'accept-language')

  /** Live session for a request, after re-checking the allowlist. */
  const session = (headers: unknown): SessionPayload | undefined => {
    const raw = readCookie(headerValue(headers, 'cookie'), SESSION_COOKIE)
    if (raw === undefined) return undefined
    const parsed = decodeSigned<SessionPayload>(raw, secret)
    if (parsed === undefined || typeof parsed.p !== 'string') return undefined
    const instance = byId(parsed.p)
    if (instance === undefined || !instance.enabled) return undefined
    const allowed = new Set(instance.allowedSubjects.map((value) => value.toLowerCase()))
    const identifiers = Array.isArray(parsed.ids) ? parsed.ids : [String(parsed.s ?? '')]
    return identifiers.some((value) => allowed.has(String(value).toLowerCase())) ? parsed : undefined
  }

  ctx.effect(
    () =>
      ctx.connection.authentication.register({
        authenticate(request) {
          return session(request.headers) === undefined ? undefined : peer
        },
      }),
    `${LOG_PREFIX}: authentication provider`,
  )

  // Unauthenticated entry: redirect only while a provider is enabled.
  ctx.on('webserver/request', async (request, response, next) => {
    const url = new URL(request.url ?? '/', 'http://dsh.invalid')
    if (url.pathname !== '/' || (request.method !== 'GET' && request.method !== 'HEAD')) return next()
    if (url.searchParams.has('token') || url.searchParams.has('login')) return next()
    if (enabled().length === 0) return next()
    let admitted = false
    try {
      admitted = 'peer' in ctx.connection.authentication.authenticate({
        headers: request.headers,
        method: request.method,
        url,
      })
    } catch {
      admitted = false
    }
    if (admitted) return next()
    response.writeHead(302, { location: `${basePath}oauth/login`, 'cache-control': 'no-store' })
    response.end()
  })

  // Authenticated settings API.
  ctx.effect(
    () =>
      ctx.webServer.register({
        kind: 'exact',
        path: '/oauth/providers',
        auth: 'required',
        handler: async (request: IncomingMessage, response: ServerResponse) => {
          if (request.method === 'GET') {
            const locale = hostLocale(language(request.headers))
            sendJson(response, 200, {
              catalog: publicCatalog(providerCopy(locale)),
              providers: instances.map((instance) => {
                const { clientSecret, ...rest } = instance
                return { ...rest, hasSecret: Boolean(clientSecret) }
              }),
            })
            return
          }
          if (request.method !== 'POST') {
            sendJson(response, 405, { error: 'method not allowed' })
            return
          }
          let body: { providers?: unknown }
          try {
            body = JSON.parse(await readBody(request)) as { providers?: unknown }
          } catch (error) {
            sendJson(response, 400, { error: error instanceof Error ? error.message : 'invalid JSON' })
            return
          }
          if (!Array.isArray(body.providers)) {
            sendJson(response, 400, { error: 'providers must be an array' })
            return
          }
          try {
            const seen = new Set<string>()
            const next = (body.providers as Array<Record<string, unknown>>).map((entry) => {
              const previous = typeof entry.id === 'string' ? byId(entry.id) : undefined
              const normalized = normalizeInstance(entry, previous)
              if (seen.has(normalized.id)) throw new Error(`duplicate provider ${normalized.id}`)
              seen.add(normalized.id)
              return normalized
            })
            persistInstances(next)
            instances = next
            console.info(
              `${LOG_PREFIX}: providers updated (${next.map((item) => `${item.id}:${item.enabled ? 'on' : 'off'}`).join(', ') || 'none'})`,
            )
            sendJson(response, 200, { ok: true, enabled: next.filter((item) => item.enabled).map((item) => item.id) })
          } catch (error) {
            sendJson(response, 400, { error: error instanceof Error ? error.message : 'invalid providers' })
          }
        },
      }),
    `${LOG_PREFIX}: providers API`,
  )

  // Current session, for the settings banner.
  ctx.effect(
    () =>
      ctx.webServer.register({
        kind: 'exact',
        path: '/oauth/session',
        auth: 'required',
        resource: async (request) => {
          const current = session(request.headers)
          if (current === undefined) return jsonResponse(200, { native: true })
          const instance = byId(current.p)
          return jsonResponse(200, {
            provider: current.p,
            label: instance ? instance.label : current.p,
            subject: current.s,
            name: current.n ?? current.s,
            expiresAt: current.exp,
          })
        },
      }),
    `${LOG_PREFIX}: session route`,
  )

  // ---- Feishu / Lark one-click app creation (RFC 8628 device flow) ----
  const REGISTRATION = {
    feishu: process.env.OAUTH_FEISHU_REGISTRATION_URL || 'https://accounts.feishu.cn/oauth/v1/app/registration',
    lark: process.env.OAUTH_LARK_REGISTRATION_URL || 'https://accounts.larksuite.com/oauth/v1/app/registration',
  }
  const OPEN_BASE = {
    feishu: process.env.OAUTH_FEISHU_OPEN_BASE || 'https://open.feishu.cn',
    lark: process.env.OAUTH_LARK_OPEN_BASE || 'https://open.larksuite.com',
  }
  const registrations = new Map<string, RegistrationState>()

  const registrationCall = async (brand: 'feishu' | 'lark', form: Record<string, string>) => {
    const response = await fetchWithTimeout(REGISTRATION[brand], {
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        accept: 'application/json',
        'user-agent': LOG_PREFIX,
      },
      body: new URLSearchParams(form).toString(),
    })
    const body = (await response.json().catch(() => ({}))) as Record<string, unknown>
    return { ok: response.ok, body }
  }

  ctx.effect(
    () =>
      ctx.webServer.register({
        kind: 'exact',
        path: '/oauth/register/start',
        auth: 'required',
        handler: async (request: IncomingMessage, response: ServerResponse) => {
          if (request.method !== 'POST') {
            sendJson(response, 405, { error: 'method not allowed' })
            return
          }
          let brand: 'feishu' | 'lark' = 'feishu'
          try {
            const body = JSON.parse((await readBody(request)) || '{}') as { brand?: string }
            brand = body.brand === 'lark' ? 'lark' : 'feishu'
          } catch {
            brand = 'feishu'
          }
          try {
            const { ok, body } = await registrationCall(brand, {
              action: 'begin',
              archetype: 'PersonalAgent',
              auth_method: 'client_secret',
              request_user_info: 'open_id tenant_brand',
            })
            if (!ok || typeof body.device_code !== 'string') {
              sendJson(response, 502, {
                error: String(body.error_description ?? body.error ?? 'registration begin failed'),
              })
              return
            }
            const id = randomBytes(18).toString('base64url')
            const interval = Number(body.interval) > 0 ? Number(body.interval) : 5
            const expiresIn = Number(body.expires_in) > 0 ? Number(body.expires_in) : 300
            registrations.set(id, {
              deviceCode: body.device_code,
              brand,
              interval,
              expiresAt: Date.now() + expiresIn * 1000,
            })
            sendJson(response, 200, {
              id,
              brand,
              userCode: body.user_code ?? '',
              verificationUri: body.verification_uri_complete ?? body.verification_uri ?? '',
              expiresIn,
              interval,
            })
          } catch (error) {
            sendJson(response, 502, {
              error: `registration begin failed: ${error instanceof Error ? error.message : String(error)}`,
            })
          }
        },
      }),
    `${LOG_PREFIX}: register start`,
  )

  ctx.effect(
    () =>
      ctx.webServer.register({
        kind: 'exact',
        path: '/oauth/register/poll',
        auth: 'required',
        resource: async (request) => {
          const id = new URL(request.url).searchParams.get('id') ?? ''
          const state = registrations.get(id)
          if (state === undefined) return jsonResponse(200, { status: 'expired' })
          if (Date.now() > state.expiresAt) {
            registrations.delete(id)
            return jsonResponse(200, { status: 'expired' })
          }
          try {
            const { body } = await registrationCall(state.brand, { action: 'poll', device_code: state.deviceCode })
            if (typeof body.client_id === 'string' && typeof body.client_secret === 'string' && body.client_secret) {
              registrations.delete(id)
              const info = (body.user_info ?? {}) as Record<string, unknown>
              const brand = info.tenant_brand === 'lark' ? 'lark' : state.brand
              return jsonResponse(200, {
                status: 'ready',
                clientId: body.client_id,
                clientSecret: body.client_secret,
                brand,
              })
            }
            const code = body.error ?? body.code
            if (code === 'authorization_pending' || code === 'pending') {
              return jsonResponse(200, { status: 'pending', interval: state.interval })
            }
            if (code === 'slow_down') {
              state.interval = Math.min(60, state.interval + 5)
              return jsonResponse(200, { status: 'slow_down', interval: state.interval })
            }
            if (code === 'access_denied') {
              registrations.delete(id)
              return jsonResponse(200, { status: 'denied' })
            }
            if (code === 'expired_token') {
              registrations.delete(id)
              return jsonResponse(200, { status: 'expired' })
            }
            const info = (body.user_info ?? {}) as Record<string, unknown>
            if (info.tenant_brand === 'lark' && state.brand === 'feishu') {
              state.brand = 'lark'
              return jsonResponse(200, { status: 'pending', interval: state.interval, brand: 'lark' })
            }
            return jsonResponse(200, {
              status: 'error',
              error: String(body.error_description ?? body.msg ?? 'registration poll failed'),
            })
          } catch (error) {
            return jsonResponse(200, {
              status: 'error',
              error: `registration poll failed: ${error instanceof Error ? error.message : String(error)}`,
            })
          }
        },
      }),
    `${LOG_PREFIX}: register poll`,
  )

  /** Probe the authorize page to learn whether redirect_uri is accepted. */
  const probeRedirect = async (brand: 'feishu' | 'lark', appId: string, redirectUrl: string) => {
    const endpoints = CATALOG.feishu.endpoints({ brand })
    const target = new URL(endpoints.authorizeUrl)
    target.searchParams.set('client_id', appId)
    target.searchParams.set('redirect_uri', redirectUrl)
    target.searchParams.set('state', 'preflight')
    target.searchParams.set('response_type', 'code')
    const response = await fetchWithTimeout(target.href, {
      headers: { 'user-agent': LOG_PREFIX, accept: 'text/html' },
    })
    const text = await response.text().catch(() => '')
    return { ok: !/20029/.test(text) && !/Invalid redirect URL/i.test(text), status: response.status }
  }

  ctx.effect(
    () =>
      ctx.webServer.register({
        kind: 'exact',
        path: '/oauth/feishu/preflight',
        auth: 'required',
        handler: async (request: IncomingMessage, response: ServerResponse) => {
          if (request.method !== 'POST') {
            sendJson(response, 405, { error: 'method not allowed' })
            return
          }
          let body: { id?: string; appId?: string; appSecret?: string; brand?: string; apply?: boolean }
          try {
            body = JSON.parse((await readBody(request)) || '{}') as typeof body
          } catch {
            sendJson(response, 400, { error: 'invalid JSON' })
            return
          }
          const instance = typeof body.id === 'string' ? byId(body.id) : undefined
          const appId = String(body.appId ?? instance?.clientId ?? '').trim()
          const brand: 'feishu' | 'lark' = (body.brand ?? instance?.config.brand) === 'lark' ? 'lark' : 'feishu'
          const apply = body.apply === true
          const redirectUrl = callbackUrl(instance ? instance.id : 'feishu')
          const checks: PreflightCheck[] = []
          let token = ''

          try {
            const appSecret = String(body.appSecret || (instance ? instance.clientSecret : '') || '').trim()
            if (!appId || !appSecret) throw new Error('missing App ID / App Secret')
            const tokenResponse = await fetchWithTimeout(
              `${OPEN_BASE[brand]}/open-apis/auth/v3/tenant_access_token/internal`,
              {
                method: 'POST',
                headers: { 'content-type': 'application/json', accept: 'application/json', 'user-agent': LOG_PREFIX },
                body: JSON.stringify({ app_id: appId, app_secret: appSecret }),
              },
            )
            const tokenBody = (await tokenResponse.json().catch(() => ({}))) as Record<string, unknown>
            if (tokenBody.code === 0 && typeof tokenBody.tenant_access_token === 'string') {
              token = tokenBody.tenant_access_token
              checks.push({
                id: 'credentials',
                label: 'App ID / Secret',
                status: 'ok',
                detail: 'tenant_access_token acquired',
              })
            } else {
              checks.push({
                id: 'credentials',
                label: 'App ID / Secret',
                status: 'fail',
                detail: `token exchange failed (${String(tokenBody.code)}): ${String(tokenBody.msg ?? 'unknown')}`,
              })
            }
          } catch (error) {
            checks.push({
              id: 'credentials',
              label: 'App ID / Secret',
              status: 'fail',
              detail: error instanceof Error ? error.message : String(error),
            })
          }

          let redirectOk = false
          try {
            const probe = await probeRedirect(brand, appId, redirectUrl)
            redirectOk = probe.ok
            checks.push(
              redirectOk
                ? {
                    id: 'redirect',
                    label: 'Web app / redirect URL',
                    status: 'ok',
                    detail: 'the authorize page accepts this redirect_uri',
                  }
                : {
                    id: 'redirect',
                    label: 'Web app / redirect URL',
                    status: 'missing',
                    detail: 'Feishu returned 20029: redirect_uri is not registered, or the web app capability is off',
                  },
            )
          } catch (error) {
            checks.push({
              id: 'redirect',
              label: 'Web app / redirect URL',
              status: 'unknown',
              detail: `probe failed: ${error instanceof Error ? error.message : String(error)}`,
            })
          }

          if (!apply) {
            checks.push({
              id: 'autoConfig',
              label: 'Register redirect URL automatically',
              status: 'skipped',
              detail: token ? 'available' : 'credentials unavailable',
            })
          } else if (!token) {
            checks.push({
              id: 'autoConfig',
              label: 'Register redirect URL automatically',
              status: 'fail',
              detail: 'credentials unavailable; not attempted',
            })
          } else if (redirectOk) {
            checks.push({
              id: 'autoConfig',
              label: 'Register redirect URL automatically',
              status: 'ok',
              detail: 'not needed; configuration already takes effect',
            })
          } else {
            try {
              const patchResponse = await fetchWithTimeout(
                `${OPEN_BASE[brand]}/open-apis/application/v7/applications/${encodeURIComponent(appId)}/config`,
                {
                  method: 'PATCH',
                  headers: {
                    'content-type': 'application/json; charset=utf-8',
                    accept: 'application/json',
                    authorization: `Bearer ${token}`,
                    'user-agent': LOG_PREFIX,
                  },
                  body: JSON.stringify({ security: { add: { redirect_urls: [redirectUrl] } } }),
                },
              )
              const patchBody = (await patchResponse.json().catch(() => ({}))) as Record<string, unknown>
              if (patchBody.code === 0) {
                let rechecked = false
                for (let attempt = 0; attempt < 3 && !rechecked; attempt += 1) {
                  rechecked = (await probeRedirect(brand, appId, redirectUrl).catch(() => ({ ok: false }))).ok
                  if (!rechecked) await new Promise((resolve) => setTimeout(resolve, 1200))
                }
                const redirectCheck = checks.find((check) => check.id === 'redirect')
                if (redirectCheck !== undefined) {
                  redirectCheck.status = rechecked ? 'ok' : 'pending'
                  redirectCheck.detail = rechecked
                    ? 'the authorize page accepts this redirect_uri (written through the API and re-checked)'
                    : 'redirect_urls written through the API; the authorize page has not accepted it yet (usually a few seconds; check the web app capability)'
                }
                checks.push({
                  id: 'autoConfig',
                  label: 'Register redirect URL automatically',
                  status: 'ok',
                  detail: rechecked ? 'added through the API and verified' : 'added through the API; verification pending',
                })
              } else {
                const hints: Record<string, string> = {
                  '210035': 'this app was not created in the developer console, so the API cannot modify it',
                  '210043': 'this app was not created in the developer console, so the API cannot modify it',
                  '210036': 'an app can only modify itself; use its own credentials',
                  '99991672': 'the app lacks the application:application:patch permission',
                  '99991679': 'the app lacks the application:application:patch permission',
                }
                const code = String(patchBody.code)
                checks.push({
                  id: 'autoConfig',
                  label: 'Register redirect URL automatically',
                  status: 'fail',
                  detail: `${hints[code] ?? String(patchBody.msg ?? 'API call failed')} (${code})`,
                })
              }
            } catch (error) {
              checks.push({
                id: 'autoConfig',
                label: 'Register redirect URL automatically',
                status: 'fail',
                detail: error instanceof Error ? error.message : String(error),
              })
            }
          }

          const manual: string[] = []
          if (!redirectOk) {
            manual.push('Developer console → App capabilities → make sure "Web app" is added')
            manual.push(`Developer console → Development config → Security settings → Redirect URLs: add ${redirectUrl}`)
            manual.push('Save; redirect URLs take effect without review (publish only if the console asks)')
          }
          sendJson(response, 200, { appId, brand, redirectUrl, checks, manual })
        },
      }),
    `${LOG_PREFIX}: feishu preflight`,
  )

  // Public login surface.
  ctx.effect(
    () =>
      ctx.webServer.register({
        kind: 'prefix',
        path: '/oauth',
        auth: 'anonymous',
        resource: async (request) => {
          const url = new URL(request.url)
          const languageHeader = language(request.headers)

          if (url.pathname === '/oauth/login') {
            const t = hostText(hostLocale(languageHeader))
            const error = url.searchParams.get('error')
            const message = error === 'denied' ? t.loginCancelled : error ? t.loginFailed : ''
            return new Response(loginPage(basePath, enabled(), message, languageHeader), {
              status: 200,
              headers: {
                'content-type': 'text/html; charset=utf-8',
                'cache-control': 'no-store',
                'referrer-policy': 'no-referrer',
                'x-content-type-options': 'nosniff',
                'content-security-policy':
                  "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'",
              },
            })
          }

          if (url.pathname === '/oauth/base') {
            return jsonResponse(200, {
              origin: advertised.origin,
              basePath,
              callbackTemplate: `${advertised.origin}${basePath}oauth/<id>/callback`,
            })
          }

          if (url.pathname === '/oauth/logout') {
            return new Response(null, {
              status: 302,
              headers: {
                location: `${basePath}oauth/login`,
                'cache-control': 'no-store',
                'set-cookie': cookie(SESSION_COOKIE, '', { path: basePath, maxAgeSeconds: 0, secure }),
              },
            })
          }

          const parts = url.pathname.split('/').filter(Boolean)

          if (parts.length === 3 && parts[2] === 'start') {
            const instance = byId(parts[1])
            if (instance === undefined || !instance.enabled) {
              const t = hostText(hostLocale(languageHeader))
              return errorPage(404, t.providerUnavailableTitle, t.providerUnavailableDetail, basePath, languageHeader)
            }
            let endpoints
            try {
              endpoints = await resolveEndpoints(instance)
            } catch (error) {
              console.warn(`${LOG_PREFIX}: ${instance.id} endpoint resolution failed: ${String(error)}`)
              const t = hostText(hostLocale(languageHeader))
              return errorPage(502, t.misconfiguredTitle, t.misconfiguredDetail, basePath, languageHeader)
            }
            const nonce = randomBytes(32).toString('base64url')
            const target = new URL(endpoints.authorizeUrl)
            target.searchParams.set('client_id', instance.clientId)
            target.searchParams.set('redirect_uri', callbackUrl(instance.id))
            if (endpoints.scope) target.searchParams.set('scope', endpoints.scope)
            target.searchParams.set('state', nonce)
            target.searchParams.set('response_type', 'code')
            if (instance.provider === 'github') target.searchParams.set('allow_signup', 'false')
            const headers = new Headers({ location: target.href, 'cache-control': 'no-store' })
            headers.append(
              'set-cookie',
              cookie(STATE_COOKIE, `${instance.id}:${nonce}`, {
                path: basePath,
                maxAgeSeconds: Math.floor(STATE_TTL_MS / 1000),
                secure,
              }),
            )
            return new Response(null, { status: 302, headers })
          }

          if (parts.length === 3 && parts[2] === 'callback') {
            const instance = byId(parts[1])
            const t = hostText(hostLocale(languageHeader))
            if (instance === undefined || !instance.enabled) {
              return errorPage(404, t.providerUnavailableTitle, t.providerUnavailableDetail, basePath, languageHeader)
            }
            const error = url.searchParams.get('error')
            if (error !== null) {
              console.info(`${LOG_PREFIX}: authorization denied by ${instance.id} (${error})`)
              return new Response(null, {
                status: 302,
                headers: {
                  location: `${basePath}oauth/login?error=denied`,
                  'cache-control': 'no-store',
                  'set-cookie': cookie(STATE_COOKIE, '', { path: basePath, maxAgeSeconds: 0, secure }),
                },
              })
            }
            const code = url.searchParams.get('code')
            const state = url.searchParams.get('state')
            const expected = readCookie(headerValue(request.headers, 'cookie'), STATE_COOKIE) ?? ''
            const expectedState = expected.startsWith(`${instance.id}:`) ? expected.slice(instance.id.length + 1) : ''
            if (
              !code ||
              !state ||
              !expectedState ||
              state.length !== expectedState.length ||
              !timingSafeEqual(Buffer.from(state, 'utf8'), Buffer.from(expectedState, 'utf8'))
            ) {
              return errorPage(403, t.stateFailedTitle, t.stateFailedDetail, basePath, languageHeader)
            }
            const entry = CATALOG[instance.provider]
            let mapped
            try {
              const endpoints = await resolveEndpoints(instance)
              const payload: Record<string, string> = {
                client_id: instance.clientId,
                client_secret: instance.clientSecret,
                code,
                redirect_uri: callbackUrl(instance.id),
                grant_type: 'authorization_code',
              }
              const tokenResponse = await fetchWithTimeout(endpoints.tokenUrl, {
                method: 'POST',
                headers:
                  entry.token.body === 'json'
                    ? { 'content-type': 'application/json', accept: 'application/json', 'user-agent': LOG_PREFIX }
                    : {
                        'content-type': 'application/x-www-form-urlencoded',
                        accept: 'application/json',
                        'user-agent': LOG_PREFIX,
                      },
                body:
                  entry.token.body === 'json'
                    ? JSON.stringify(payload)
                    : new URLSearchParams(payload).toString(),
              })
              const tokenBody = (await tokenResponse.json()) as Record<string, unknown>
              const data = (tokenBody.data ?? {}) as Record<string, unknown>
              const accessToken = tokenBody.access_token ?? data.access_token
              if (!tokenResponse.ok || typeof accessToken !== 'string') {
                throw new Error(`token exchange rejected with HTTP ${tokenResponse.status}`)
              }
              const userResponse = await fetchWithTimeout(endpoints.userInfoUrl, {
                headers: {
                  authorization: `Bearer ${accessToken}`,
                  accept: 'application/json',
                  'user-agent': LOG_PREFIX,
                },
              })
              const userBody = (await userResponse.json()) as Record<string, unknown>
              if (!userResponse.ok || typeof userBody !== 'object' || userBody === null) {
                throw new Error(`userinfo rejected with HTTP ${userResponse.status}`)
              }
              mapped = profileOf(instance, userBody)
            } catch (cause) {
              console.warn(`${LOG_PREFIX}: ${instance.id} exchange failed: ${String(cause)}`)
              return errorPage(502, t.exchangeFailedTitle, t.exchangeFailedDetail, basePath, languageHeader)
            }
            if (!mapped.id) {
              return errorPage(502, t.noIdentityTitle, t.noIdentityDetail, basePath, languageHeader)
            }
            const allowed = new Set(instance.allowedSubjects.map((value) => value.toLowerCase()))
            const identifiers = mapped.identifiers.length > 0 ? mapped.identifiers : [mapped.id]
            if (!identifiers.some((value) => allowed.has(String(value).toLowerCase()))) {
              console.warn(
                `${LOG_PREFIX}: rejected ${instance.id} identity ${JSON.stringify(mapped.id)} (not in allowlist)`,
              )
              return errorPage(
                403,
                t.deniedTitle,
                t.deniedDetail(instance.label, mapped.id),
                basePath,
                languageHeader,
              )
            }
            const headers = new Headers({ location: basePath, 'cache-control': 'no-store' })
            headers.append(
              'set-cookie',
              cookie(
                SESSION_COOKIE,
                encodeSigned(
                  {
                    p: instance.id,
                    s: mapped.id,
                    n: mapped.name || mapped.id,
                    ids: identifiers,
                    exp: Date.now() + maxAgeSeconds * 1000,
                  },
                  secret,
                ),
                { path: basePath, maxAgeSeconds, secure },
              ),
            )
            headers.append('set-cookie', cookie(STATE_COOKIE, '', { path: basePath, maxAgeSeconds: 0, secure }))
            console.info(`${LOG_PREFIX}: signed in ${instance.id} as ${JSON.stringify(mapped.id)}`)
            return new Response(null, { status: 302, headers })
          }

          return new Response('not found', { status: 404, headers: { 'cache-control': 'no-store' } })
        },
      }),
    `${LOG_PREFIX}: login routes`,
  )

  ctx.logger?.info?.(`${LOG_PREFIX}: ${enabled().length} provider(s) enabled`)
}

/** Re-exported for tests and documentation tooling. */
export type { ProviderField }
