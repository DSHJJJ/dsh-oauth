/**
 * Minimal structural types for the DeepSeek Harness surfaces this plugin
 * consumes. They are declared locally so the bundle stays dependency-free:
 * the official packages are runtime-resolved by the harness, while this plugin
 * only needs the exact call shapes documented in the DSH 0.2.3 API reference.
 */

import type { IncomingMessage, ServerResponse } from 'node:http'

/** Structured logger exposed by a Cordis context. */
export interface Logger {
  info(message: string): void
  warn(message: string): void
}

/** Identity attached to every admitted request. */
export interface Principal {
  readonly kind: 'owner'
}

/** Connection-layer peer created by the authentication plugin. */
export interface PeerScope {
  readonly id: string
  dispose(): Promise<void>
}

/** Credential verifier registered through `connection.authentication`. */
export interface AuthenticationProvider {
  authenticate(request: ConnectionTrustRequest): PeerScope | undefined
}

/** Request facts handed to credential verifiers. */
export interface ConnectionTrustRequest {
  readonly headers: unknown
  readonly method?: string | undefined
  readonly url?: URL | undefined
}

/** Result of `connection.authentication.authenticate`. */
export type PeerAdmission = { readonly peer: PeerScope } | { readonly rejection: 401 | 403 | 503 }

/** Sub-service owning the ordered credential verifiers. */
export interface ConnectionAuthentication {
  register(provider: AuthenticationProvider): () => Promise<void>
  authenticate(request: ConnectionTrustRequest): PeerAdmission
}

/** Connection service members used by this plugin. */
export interface HostConnection {
  readonly authentication: ConnectionAuthentication
  createPeer(options: { readonly principal: Principal }): PeerScope
}

/** Route policy: anonymous routes skip credential checks. */
export type WebAuthPolicy = 'anonymous' | 'required' | 'deny'

/** Exact or prefix route registration. */
export interface WebRouteRegistration {
  kind: 'exact' | 'prefix'
  path: string
  auth?: WebAuthPolicy
  handler?: (request: IncomingMessage, response: ServerResponse, peer?: PeerScope) => void | Promise<void>
  resource?: (request: Request, peer?: PeerScope) => Promise<Response>
}

/** HTTP carrier service members used by this plugin. */
export interface HostWebServer {
  readonly protocol: string
  getOrigin(): string
  register(route: WebRouteRegistration): () => void
}

/** Web application service members used by this plugin. */
export interface HostWebApp {
  getAdvertisedUrl(): string
}

/** Host-side Cordis context surface consumed here. */
export interface HostContext {
  readonly connection: HostConnection
  readonly webServer: HostWebServer
  readonly webApp: HostWebApp
  readonly logger?: Logger
  effect(callback: () => void | (() => void | Promise<void>), label?: string): void
  on(
    event: 'webserver/request',
    listener: (request: IncomingMessage, response: ServerResponse, next: () => Promise<void>) => Promise<void>,
  ): () => void
}

/** Profile row configuration (legacy single-provider fields included). */
export interface PluginConfig {
  /** Absolute Remote cookie lifetime in days; default 30. */
  cookieMaxAgeDays?: number
  /** Explicit HMAC key for session cookies (>= 32 bytes). */
  cookieSecret?: string
  /** Legacy GitHub OAuth App id. */
  clientId?: string
  /** Legacy GitHub OAuth App secret. */
  clientSecret?: string
  /** Legacy GitHub allowlist. */
  allowedLogins?: string[]
}

/** One field rendered by the settings form. */
export interface ProviderField {
  key: string
  label: string
  type: 'text' | 'url' | 'select'
  required?: boolean
  default?: string
  placeholder?: string
  help?: string
  options?: Array<{ value: string; label: string }>
}

/** Endpoints resolved for one provider instance. */
export interface Endpoints {
  authorizeUrl: string
  tokenUrl: string
  userInfoUrl: string
  scope?: string
}

/** Identity mapped from a provider's userinfo response. */
export interface Profile {
  id: string
  name: string
  identifiers: string[]
}

/** Declarative provider definition (NextAuth/Passport style). */
export interface CatalogEntry {
  label: string
  description: string
  docsUrl?: string
  scope: string
  fields: ProviderField[]
  /** Resolve endpoints from issuer discovery instead of `endpoints()`. */
  discover?: boolean
  /** Hide from the "add provider" list (legacy compatibility only). */
  hidden?: boolean
  token: { body: 'json' | 'form' }
  endpoints(config: Record<string, string>): Endpoints
  profile(user: Record<string, unknown>): Profile
}

/** One configured provider instance, persisted in providers.json. */
export interface ProviderInstance {
  id: string
  provider: string
  label: string
  enabled: boolean
  clientId: string
  clientSecret: string
  config: Record<string, string>
  allowedSubjects: string[]
  scope: string
}

/** Checklist item returned by the Feishu preflight endpoint. */
export interface PreflightCheck {
  id: string
  label: string
  status: 'ok' | 'missing' | 'pending' | 'fail' | 'skipped' | 'unknown'
  detail: string
}
