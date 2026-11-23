/**
 * Built-in provider catalog and instance normalization.
 *
 * Each entry declares only what differs between providers: endpoints, token
 * request encoding, userinfo profile mapping and the extra configuration fields
 * the settings page must render. The OAuth engine in `index.ts` handles the
 * rest (state, code exchange, allowlist, session cookie).
 */

import type { CatalogEntry, Endpoints, Profile, ProviderInstance } from './types.js'
import type { ProviderCopy } from './copy.js'

/** Provider definitions keyed by stable provider id. */
export const CATALOG: Record<string, CatalogEntry> = {
  github: {
    label: 'GitHub',
    description: 'GitHub OAuth App. Identity matches login, numeric id or email.',
    docsUrl: 'https://github.com/settings/developers',
    scope: 'read:user',
    fields: [],
    token: { body: 'json' },
    endpoints: () => ({
      authorizeUrl: 'https://github.com/login/oauth/authorize',
      tokenUrl: 'https://github.com/login/oauth/access_token',
      userInfoUrl: 'https://api.github.com/user',
    }),
    profile: (user) => {
      const login = String(user.login ?? user.id ?? '')
      return {
        id: login,
        name: String(user.name ?? login),
        identifiers: [login, user.id === undefined ? '' : String(user.id), String(user.email ?? '')].filter(Boolean),
      }
    },
  },

  google: {
    label: 'Google',
    description: 'Google OAuth client. Identity matches sub or email.',
    docsUrl: 'https://console.cloud.google.com/apis/credentials',
    scope: 'openid email profile',
    fields: [],
    token: { body: 'form' },
    endpoints: () => ({
      authorizeUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenUrl: 'https://oauth2.googleapis.com/token',
      userInfoUrl: 'https://openidconnect.googleapis.com/v1/userinfo',
    }),
    profile: (user) => ({
      id: String(user.sub ?? ''),
      name: String(user.email ?? user.name ?? user.sub ?? ''),
      identifiers: [user.sub, user.email, user.name].filter(Boolean).map(String),
    }),
  },

  gitlab: {
    label: 'GitLab',
    description: 'GitLab.com or a self-hosted instance. Identity matches username, id or email.',
    docsUrl: 'https://gitlab.com/-/user_settings/applications',
    scope: 'read_user',
    fields: [
      {
        key: 'baseUrl',
        label: 'GitLab base URL',
        type: 'url',
        required: true,
        default: 'https://gitlab.com',
        help: 'Use your own domain for a self-hosted instance.',
      },
    ],
    token: { body: 'form' },
    endpoints: (config) => {
      const base = (config.baseUrl || 'https://gitlab.com').replace(/\/$/, '')
      return {
        authorizeUrl: `${base}/oauth/authorize`,
        tokenUrl: `${base}/oauth/token`,
        userInfoUrl: `${base}/api/v4/user`,
      }
    },
    profile: (user) => {
      const login = String(user.username ?? user.id ?? '')
      return {
        id: login,
        name: String(user.name ?? login),
        identifiers: [login, user.id === undefined ? '' : String(user.id), String(user.email ?? '')].filter(Boolean),
      }
    },
  },

  gitee: {
    label: 'Gitee',
    description: 'Gitee (码云). Identity matches login, id or email.',
    docsUrl: 'https://gitee.com/oauth/applications',
    scope: 'user_info',
    fields: [],
    token: { body: 'form' },
    endpoints: () => ({
      authorizeUrl: 'https://gitee.com/oauth/authorize',
      tokenUrl: 'https://gitee.com/oauth/token',
      userInfoUrl: 'https://gitee.com/api/v5/user',
    }),
    profile: (user) => {
      const login = String(user.login ?? user.id ?? '')
      return {
        id: login,
        name: String(user.name ?? login),
        identifiers: [login, user.id === undefined ? '' : String(user.id), String(user.email ?? '')].filter(Boolean),
      }
    },
  },

  microsoft: {
    label: 'Microsoft',
    description: 'Microsoft Entra ID (Azure AD). Identity matches sub, email or user principal name.',
    docsUrl: 'https://entra.microsoft.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade',
    scope: 'openid email profile',
    fields: [
      {
        key: 'tenant',
        label: 'Tenant',
        type: 'text',
        required: true,
        default: 'common',
        help: 'common, organizations, consumers, or a tenant id.',
      },
    ],
    token: { body: 'form' },
    endpoints: (config) => {
      const tenant = encodeURIComponent(config.tenant || 'common')
      return {
        authorizeUrl: `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/authorize`,
        tokenUrl: `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`,
        userInfoUrl: 'https://graph.microsoft.com/oidc/userinfo',
      }
    },
    profile: (user) => ({
      id: String(user.sub ?? ''),
      name: String(user.email ?? user.preferred_username ?? user.name ?? user.sub ?? ''),
      identifiers: [user.sub, user.email, user.preferred_username].filter(Boolean).map(String),
    }),
  },

  discord: {
    label: 'Discord',
    description: 'Discord OAuth2. Identity matches username or id.',
    docsUrl: 'https://discord.com/developers/applications',
    scope: 'identify email',
    fields: [],
    token: { body: 'form' },
    endpoints: () => ({
      authorizeUrl: 'https://discord.com/oauth2/authorize',
      tokenUrl: 'https://discord.com/api/oauth2/token',
      userInfoUrl: 'https://discord.com/api/users/@me',
    }),
    profile: (user) => {
      const login = String(user.username ?? user.id ?? '')
      return {
        id: login,
        name: String(user.global_name ?? login),
        identifiers: [login, user.id === undefined ? '' : String(user.id), String(user.email ?? '')].filter(Boolean),
      }
    },
  },

  slack: {
    label: 'Slack',
    description: 'Slack OpenID Connect. Identity matches sub or email.',
    docsUrl: 'https://api.slack.com/apps',
    scope: 'openid email profile',
    fields: [],
    token: { body: 'form' },
    endpoints: () => ({
      authorizeUrl: 'https://slack.com/openid/connect/authorize',
      tokenUrl: 'https://slack.com/api/openid.connect.token',
      userInfoUrl: 'https://slack.com/api/openid.connect.userInfo',
    }),
    profile: (user) => ({
      id: String(user.sub ?? ''),
      name: String(user.email ?? user.name ?? user.sub ?? ''),
      identifiers: [user.sub, user.email].filter(Boolean).map(String),
    }),
  },

  feishu: {
    label: '飞书 / Lark',
    description: 'Feishu / Lark web sign-in. Supports one-click app creation by QR code.',
    docsUrl: 'https://open.feishu.cn/app',
    scope: '',
    fields: [
      {
        key: 'brand',
        label: 'Edition',
        type: 'select',
        default: 'feishu',
        options: [
          { value: 'feishu', label: 'Feishu (feishu.cn)' },
          { value: 'lark', label: 'Lark (larksuite.com)' },
        ],
      },
      {
        key: 'scope',
        label: 'Scope (optional)',
        type: 'text',
        placeholder: 'contact:contact.base:readonly',
        help: 'Add a scope after granting the matching permission in the developer console.',
      },
    ],
    token: { body: 'json' },
    endpoints: (config) =>
      config.brand === 'lark'
        ? {
            authorizeUrl: 'https://accounts.larksuite.com/open-apis/authen/v1/authorize',
            tokenUrl: 'https://open.larksuite.com/open-apis/authen/v2/oauth/token',
            userInfoUrl: 'https://open.larksuite.com/open-apis/authen/v1/user_info',
          }
        : {
            authorizeUrl: 'https://accounts.feishu.cn/open-apis/authen/v1/authorize',
            tokenUrl: 'https://open.feishu.cn/open-apis/authen/v2/oauth/token',
            userInfoUrl: 'https://open.feishu.cn/open-apis/authen/v1/user_info',
          },
    profile: (user) => {
      const data = (user.data ?? user) as Record<string, unknown>
      const id = String(data.open_id ?? data.sub ?? data.union_id ?? data.user_id ?? '')
      return {
        id,
        name: String(data.name ?? data.en_name ?? data.email ?? id),
        identifiers: [data.open_id, data.sub, data.union_id, data.user_id, data.email, data.enterprise_email]
          .filter(Boolean)
          .map(String),
      }
    },
  },

  keycloak: {
    label: 'Keycloak / OIDC',
    description: 'Any standard OIDC issuer (Keycloak, Auth0, Okta…). Endpoints are discovered from the issuer.',
    scope: 'openid email profile',
    discover: true,
    fields: [
      {
        key: 'issuer',
        label: 'Issuer',
        type: 'url',
        required: true,
        placeholder: 'https://keycloak.example.com/realms/main',
        help: 'Reads <issuer>/.well-known/openid-configuration.',
      },
    ],
    token: { body: 'form' },
    endpoints: () => ({ authorizeUrl: '', tokenUrl: '', userInfoUrl: '' }),
    profile: (user) => ({
      id: String(user.sub ?? ''),
      name: String(user.email ?? user.preferred_username ?? user.name ?? user.sub ?? ''),
      identifiers: [user.sub, user.email, user.preferred_username].filter(Boolean).map(String),
    }),
  },

  custom: {
    hidden: true,
    label: 'Custom OIDC (legacy)',
    description: 'Legacy hand-written endpoints, kept only for configuration compatibility.',
    scope: 'openid email profile',
    fields: [
      { key: 'authorizeUrl', label: 'Authorization URL', type: 'url', required: true },
      { key: 'tokenUrl', label: 'Token URL', type: 'url', required: true },
      { key: 'userInfoUrl', label: 'UserInfo URL', type: 'url', required: true },
    ],
    token: { body: 'form' },
    endpoints: (config) => ({
      authorizeUrl: config.authorizeUrl,
      tokenUrl: config.tokenUrl,
      userInfoUrl: config.userInfoUrl,
    }),
    profile: (user) => ({
      id: String(user.sub ?? user.login ?? user.id ?? ''),
      name: String(user.email ?? user.login ?? user.preferred_username ?? user.sub ?? ''),
      identifiers: [user.sub, user.login, user.email, user.preferred_username].filter(Boolean).map(String),
    }),
  },
}

const ID_PATTERN = /^[a-z0-9][a-z0-9-]{0,31}$/

/** Validate one URL config value (https, or http for a loopback mock). */
export function requireUrl(value: string, label: string): string {
  let parsed: URL
  try {
    parsed = new URL(value)
  } catch {
    throw new Error(`${label} is not a valid URL`)
  }
  if (parsed.protocol !== 'https:' && !(parsed.protocol === 'http:' && parsed.hostname === '127.0.0.1')) {
    throw new Error(`${label} must use https (http is accepted only for 127.0.0.1 mocks)`)
  }
  return parsed.href
}

/** Resolve a provider's client secret from its row or `OAUTH_<ID>_CLIENT_SECRET`. */
export function resolveSecret(provider: ProviderInstance): string {
  if (provider.clientSecret) return provider.clientSecret
  const envName = `OAUTH_${provider.id.toUpperCase().replace(/[^A-Z0-9]/g, '_')}_CLIENT_SECRET`
  return process.env[envName] ?? ''
}

/**
 * Normalize one instance from disk or a settings write.
 * @param raw - untrusted instance object.
 * @param previous - stored instance with the same id, used to keep a secret the write omitted.
 */
export function normalizeInstance(raw: Record<string, unknown>, previous?: ProviderInstance): ProviderInstance {
  const provider = String(raw.provider ?? raw.type ?? '').trim()
  const entry = CATALOG[provider]
  if (entry === undefined) throw new Error(`unknown provider ${JSON.stringify(provider)}`)

  const config: Record<string, string> = {}
  const rawConfig = (raw.config ?? {}) as Record<string, unknown>
  for (const field of entry.fields) {
    let value = rawConfig[field.key]
    if (value === undefined || value === null || value === '') value = field.default ?? ''
    let text = String(value).trim()
    if (field.required && !text) throw new Error(`${entry.label}: ${field.label} is required`)
    if (text && field.type === 'url') text = requireUrl(text, `${entry.label} ${field.label}`)
    config[field.key] = text
  }

  const clientId = String(raw.clientId ?? '').trim()
  if (!clientId) throw new Error(`${entry.label}: Client ID is required`)
  const clientSecret = String(raw.clientSecret ?? '').trim() || (previous?.clientSecret ?? '')
  if (!clientSecret) throw new Error(`${entry.label}: Client Secret is required`)

  const allowedSubjects = Array.isArray(raw.allowedSubjects)
    ? raw.allowedSubjects.map((value) => String(value).trim()).filter(Boolean)
    : []
  if (allowedSubjects.length === 0) throw new Error(`${entry.label}: at least one allowed account is required`)

  const id = provider
  if (!ID_PATTERN.test(id)) throw new Error(`invalid provider id ${JSON.stringify(id)}`)

  return {
    id,
    provider,
    label: String(raw.label ?? '').trim() || entry.label,
    enabled: raw.enabled !== false,
    clientId,
    clientSecret,
    config,
    allowedSubjects,
    scope: String(rawScope(raw, config) ?? '').trim() || entry.scope,
  }
}

/** Scope may be supplied as `config.scope` (form field) or `scope`. */
function rawScope(raw: Record<string, unknown>, config: Record<string, string>): string | undefined {
  const value = config.scope ?? raw.scope
  return value === undefined ? undefined : String(value)
}

/** Instance synthesized from the legacy single-provider profile row. */
export function legacyInstance(rawConfig: {
  clientId?: string
  clientSecret?: string
  allowedLogins?: string[]
} | undefined): ProviderInstance | null {
  const clientId = typeof rawConfig?.clientId === 'string' ? rawConfig.clientId.trim() : ''
  if (!clientId) return null
  return {
    id: 'github',
    provider: 'github',
    label: 'GitHub',
    enabled: true,
    clientId,
    clientSecret:
      typeof rawConfig?.clientSecret === 'string' && rawConfig.clientSecret
        ? rawConfig.clientSecret
        : (process.env.OAUTH_GITHUB_CLIENT_SECRET ?? ''),
    config: {},
    allowedSubjects: Array.isArray(rawConfig?.allowedLogins)
      ? rawConfig.allowedLogins.map((entry) => String(entry).trim()).filter(Boolean)
      : [],
    scope: 'read:user',
  }
}

/** Public catalog for the settings page (hidden entries omitted). */
export function publicCatalog(overrides: Record<string, ProviderCopy> = {}): Array<{
  id: string
  label: string
  description: string
  docsUrl: string
  scope: string
  fields: CatalogEntry['fields']
}> {
  return Object.entries(CATALOG)
    .filter(([, entry]) => entry.hidden !== true)
    .map(([id, entry]) => {
      const copy = overrides[id]
      return {
        id,
        label: copy?.label ?? entry.label,
        description: copy?.description ?? entry.description,
        docsUrl: entry.docsUrl ?? '',
        scope: entry.scope,
        fields: entry.fields.map((field) => ({
          ...field,
          label: copy?.fields?.[field.key]?.label ?? field.label,
          help: copy?.fields?.[field.key]?.help ?? field.help,
        })),
      }
    })
}

/** Endpoints resolved for one instance, including OIDC discovery. */
export async function resolveEndpoints(instance: ProviderInstance): Promise<Endpoints> {
  const entry = CATALOG[instance.provider]
  if (entry === undefined) throw new Error(`unknown provider ${instance.provider}`)
  if (entry.discover === true) {
    const endpoints = await discoverEndpoints(instance.config.issuer)
    return { ...endpoints, scope: instance.scope }
  }
  return { ...entry.endpoints(instance.config), scope: instance.scope }
}

interface DiscoveryCacheEntry {
  at: number
  endpoints: Omit<Endpoints, 'scope'>
}

const DISCOVERY_TTL_MS = 10 * 60 * 1000
const discoveryCache = new Map<string, DiscoveryCacheEntry>()

/** Resolve an OIDC issuer's endpoints through its discovery document. */
export async function discoverEndpoints(issuer: string): Promise<Omit<Endpoints, 'scope'>> {
  const cached = discoveryCache.get(issuer)
  if (cached !== undefined && Date.now() - cached.at < DISCOVERY_TTL_MS) return cached.endpoints
  const base = issuer.endsWith('/') ? issuer : `${issuer}/`
  const response = await fetch(`${base}.well-known/openid-configuration`, {
    headers: { accept: 'application/json', 'user-agent': 'dsh-oauth-github' },
  })
  if (!response.ok) throw new Error(`discovery returned HTTP ${response.status}`)
  const document = (await response.json()) as Record<string, unknown>
  if (typeof document.authorization_endpoint !== 'string' || typeof document.token_endpoint !== 'string') {
    throw new Error('discovery document lacks authorization_endpoint or token_endpoint')
  }
  const endpoints = {
    authorizeUrl: document.authorization_endpoint,
    tokenUrl: document.token_endpoint,
    userInfoUrl: typeof document.userinfo_endpoint === 'string' ? document.userinfo_endpoint : '',
  }
  discoveryCache.set(issuer, { at: Date.now(), endpoints })
  return endpoints
}

/** Map a userinfo payload through the provider's profile function. */
export function profileOf(instance: ProviderInstance, user: Record<string, unknown>): Profile {
  const entry = CATALOG[instance.provider]
  if (entry === undefined) throw new Error(`unknown provider ${instance.provider}`)
  return entry.profile(user)
}
