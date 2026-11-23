/**
 * OAuth settings section (browser half).
 *
 * The server owns the provider catalog and the configuration document; this
 * component renders the catalog's field schema and writes the whole list back.
 * Every write is applied by the host in place, so no restart is involved.
 */

import { createElement, useCallback, useEffect, useState, type ReactNode } from 'react'
import { en, zh, type OAuthLocaleKey } from './locales.js'
import { styles } from './styles.js'
import type { ClientContext } from './context.js'

/** Locale namespace owned by this plugin. */
const NS = 'oauthLogin'

/** Bound translator; replaced by `apply` once the locale service is available. */
let translate: (key: string) => string = (key) => en[key as OAuthLocaleKey] ?? key

/** Translate and interpolate one key. */
function tr(key: OAuthLocaleKey, params?: Record<string, string | number>): string {
  let text = translate(key)
  if (params !== undefined) {
    for (const [name, value] of Object.entries(params)) text = text.replaceAll(`{${name}}`, String(value))
  }
  return text
}

/** One configuration field advertised by the server catalog. */
interface CatalogField {
  key: string
  label: string
  type: 'text' | 'url' | 'select'
  required?: boolean
  default?: string
  placeholder?: string
  help?: string
  options?: Array<{ value: string; label: string }>
}

/** One built-in provider advertised by the server catalog. */
interface CatalogItem {
  id: string
  label: string
  description: string
  docsUrl: string
  scope: string
  fields: CatalogField[]
}

/** One configured provider instance. */
interface ProviderItem {
  id: string
  provider: string
  label: string
  enabled: boolean
  clientId: string
  clientSecret?: string
  config: Record<string, string>
  allowedSubjects: string[]
  scope: string
  hasSecret: boolean
}

/** Current browser session reported by the host. */
interface SessionInfo {
  native?: boolean
  provider?: string
  label?: string
  subject?: string
}

/** Public deployment information. */
interface BaseInfo {
  origin: string
  basePath: string
  callbackTemplate: string
}

/** Editable draft of one provider. */
interface Draft {
  id: string
  provider: string
  label: string
  enabled: boolean
  clientId: string
  clientSecret: string
  config: Record<string, string>
  allowedSubjects: string
  hasSecret: boolean
  editing: boolean
}

/** Feishu preflight checklist item. */
interface PreflightCheck {
  id: string
  label: string
  status: 'ok' | 'missing' | 'pending' | 'fail' | 'skipped' | 'unknown'
  detail: string
}

/** Feishu preflight response. */
interface PreflightResult {
  loading?: boolean
  error?: string
  checks?: PreflightCheck[]
  manual?: string[]
}

/** One in-flight Feishu app registration. */
interface RegistrationState {
  id?: string
  status: 'starting' | 'pending' | 'slow_down' | 'ready' | 'denied' | 'expired' | 'error'
  interval?: number
  verificationUri?: string
  error?: string
}

/** Request JSON from the host, surfacing server errors. */
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, { credentials: 'same-origin', cache: 'no-store', ...init })
  const text = await response.text()
  let body: unknown = null
  try {
    body = text ? JSON.parse(text) : null
  } catch {
    body = null
  }
  if (!response.ok) {
    const message = (body as { error?: string } | null)?.error ?? `HTTP ${response.status}`
    throw new Error(message)
  }
  return body as T
}

/** One labelled form control. */
function Field(props: {
  label: string
  value: string
  onChange: (value: string) => void
  type?: 'text' | 'secret' | 'select'
  options?: Array<{ value: string; label: string }>
  placeholder?: string
  help?: string
  disabled?: boolean
}): ReactNode {
  return (
    <label style={styles.label}>
      <span style={styles.muted}>{props.label}</span>
      {props.type === 'select' ? (
        <select
          style={styles.input}
          value={props.value}
          disabled={props.disabled === true}
          onChange={(event) => props.onChange(event.target.value)}
        >
          {(props.options ?? []).map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          style={styles.input}
          type={props.type === 'secret' ? 'password' : 'text'}
          value={props.value}
          placeholder={props.placeholder ?? ''}
          disabled={props.disabled === true}
          onChange={(event) => props.onChange(event.target.value)}
        />
      )}
      {props.help ? <span style={styles.muted}>{props.help}</span> : null}
    </label>
  )
}

/** Editable provider form, driven by the catalog schema. */
function ProviderForm(props: {
  draft: Draft
  catalog: CatalogItem[]
  base: BaseInfo | null
  onChange: (draft: Draft) => void
  onCancel: () => void
  onSave: (draft: Draft) => void
}): ReactNode {
  const { draft, catalog, base, onChange, onCancel, onSave } = props
  const entry = catalog.find((item) => item.id === draft.provider)
  const [registration, setRegistration] = useState<RegistrationState | null>(null)
  const [preflight, setPreflight] = useState<PreflightResult | null>(null)

  const update = (patch: Partial<Draft>): void => onChange({ ...draft, ...patch })
  const updateConfig = (key: string, value: string): void =>
    onChange({ ...draft, config: { ...draft.config, [key]: value } })

  const callback = base === null ? '' : base.callbackTemplate.replace('<id>', draft.provider)

  /** Run the Feishu checklist; `apply` also tries to register the redirect URL. */
  const runPreflight = useCallback(
    async (apply: boolean, override?: { appId?: string; appSecret?: string; brand?: string }): Promise<void> => {
      setPreflight({ loading: true })
      try {
        const result = await request<PreflightResult & { checks: PreflightCheck[]; manual: string[] }>(
          'oauth/feishu/preflight',
          {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
              id: draft.provider,
              appId: override?.appId ?? draft.clientId,
              appSecret: override?.appSecret ?? draft.clientSecret,
              brand: override?.brand ?? draft.config.brand ?? 'feishu',
              apply,
            }),
          },
        )
        setPreflight(result)
      } catch (cause) {
        setPreflight({ error: cause instanceof Error ? cause.message : String(cause) })
      }
    },
    [draft.provider, draft.clientId, draft.clientSecret, draft.config.brand],
  )

  // Opening an already-configured Feishu entry checks it without a click.
  useEffect(() => {
    if (draft.provider === 'feishu' && draft.editing && draft.hasSecret) void runPreflight(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once per form mount
  }, [])

  /** Start the Feishu device flow and poll until it yields credentials. */
  const startRegistration = async (): Promise<void> => {
    setRegistration({ status: 'starting' })
    try {
      const body = await request<{
        id: string
        verificationUri: string
        interval: number
      }>('oauth/register/start', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ brand: draft.config.brand ?? 'feishu' }),
      })
      setRegistration({ id: body.id, status: 'pending', interval: body.interval, verificationUri: body.verificationUri })
      if (body.verificationUri) globalThis.open(body.verificationUri, '_blank', 'noopener')
    } catch (cause) {
      setRegistration({ status: 'error', error: cause instanceof Error ? cause.message : String(cause) })
    }
  }

  // Poll an in-flight registration; success also triggers the checklist.
  useEffect(() => {
    if (registration === null) return undefined
    if (registration.status !== 'pending' && registration.status !== 'slow_down') return undefined
    const timer = globalThis.setTimeout(async () => {
      try {
        const body = await request<{
          status: RegistrationState['status'] | 'pending' | 'slow_down'
          interval?: number
          clientId?: string
          clientSecret?: string
          brand?: string
          error?: string
        }>(`oauth/register/poll?id=${encodeURIComponent(registration.id ?? '')}`)
        if (body.status === 'ready') {
          update({
            clientId: body.clientId ?? '',
            clientSecret: body.clientSecret ?? '',
            hasSecret: false,
            config: { ...draft.config, ...(body.brand ? { brand: body.brand } : {}) },
          })
          setRegistration({ ...registration, status: 'ready' })
          void runPreflight(true, {
            appId: body.clientId,
            appSecret: body.clientSecret,
            brand: body.brand ?? draft.config.brand,
          })
          return
        }
        if (body.status === 'pending' || body.status === 'slow_down') {
          setRegistration({ ...registration, status: body.status, interval: body.interval ?? registration.interval })
          return
        }
        setRegistration({ ...registration, status: body.status, error: body.error })
      } catch (cause) {
        setRegistration({ ...registration, status: 'error', error: cause instanceof Error ? cause.message : String(cause) })
      }
    }, Math.max(2, registration.interval ?? 5) * 1000)
    return () => globalThis.clearTimeout(timer)
  }, [registration, draft.config, runPreflight])

  const checkMark = (status: PreflightCheck['status']): string =>
    status === 'ok' ? '✅' : status === 'missing' || status === 'fail' ? '❌' : status === 'unknown' ? '⚠️' : 'ℹ️'

  return (
    <div style={styles.card}>
      <div style={styles.row}>
        <strong>{draft.editing ? tr('formEdit', { label: entry?.label ?? draft.provider }) : tr('formAdd', { label: entry?.label ?? 'sign-in' })}</strong>
        <span style={{ ...styles.muted, ...styles.grow }}>{tr('immediate')}</span>
      </div>
      {entry?.description ? <p style={styles.muted}>{entry.description}</p> : null}
      {entry?.docsUrl ? (
        <p style={styles.muted}>
          {tr('applyHint', { url: '' })}
          <a href={entry.docsUrl} target="_blank" rel="noreferrer" style={{ color: 'inherit' }}>
            {entry.docsUrl}
          </a>
        </p>
      ) : null}
      {callback ? <p style={styles.muted}>{tr('redirectHint', { url: callback })}</p> : null}

      {draft.provider === 'feishu' ? (
        <div style={{ ...styles.card, gap: 8, background: 'color-mix(in srgb, currentColor 3%, transparent)' }}>
          <div style={styles.row}>
            <strong>{tr('scanTitle')}</strong>
            <button type="button" style={styles.button} onClick={() => void startRegistration()}>
              {tr('scanStart')}
            </button>
          </div>
          {registration !== null ? (
            <p style={registration.status === 'error' || registration.status === 'denied' ? styles.error : styles.muted}>
              {registration.status === 'starting'
                ? tr('scanStarting')
                : registration.status === 'pending'
                  ? tr('scanPending')
                  : registration.status === 'slow_down'
                    ? tr('scanSlowDown')
                    : registration.status === 'ready'
                      ? tr('scanReady')
                      : registration.status === 'denied'
                        ? tr('scanDenied')
                        : registration.status === 'expired'
                          ? tr('scanExpired')
                          : tr('scanFailed', { reason: registration.error ?? registration.status })}
            </p>
          ) : null}
          {registration?.verificationUri ? (
            <a
              href={registration.verificationUri}
              target="_blank"
              rel="noreferrer"
              style={{ color: 'inherit', fontSize: 12 }}
            >
              {registration.verificationUri}
            </a>
          ) : null}
          <div style={styles.row}>
            <button type="button" style={styles.primary} onClick={() => void runPreflight(true)}>
              {tr('preflightCheck')}
            </button>
            <button type="button" style={styles.button} onClick={() => void runPreflight(false)}>
              {tr('preflightOnly')}
            </button>
          </div>
          {preflight !== null ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {preflight.loading ? <span style={styles.muted}>{tr('preflightChecking')}</span> : null}
              {preflight.error ? <span style={styles.error}>{tr('preflightFailed', { reason: preflight.error })}</span> : null}
              {(preflight.checks ?? []).map((check) => (
                <div key={check.id} style={styles.row}>
                  <span>{checkMark(check.status)}</span>
                  <span style={styles.muted}>
                    {check.label}：{check.detail}
                  </span>
                </div>
              ))}
              {(preflight.manual ?? []).length > 0 ? (
                <div style={{ ...styles.card, gap: 4 }}>
                  <strong>{tr('manualTitle')}</strong>
                  {(preflight.manual ?? []).map((step, index) => (
                    <span key={index} style={styles.muted}>
                      {index + 1}. {step}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      <div style={styles.row}>
        <Field label={tr('displayName')} value={draft.label} onChange={(value) => update({ label: value })} />
        <Field label={tr('clientId')} value={draft.clientId} onChange={(value) => update({ clientId: value })} />
      </div>
      <Field
        label={draft.hasSecret ? tr('clientSecretKeep') : tr('clientSecret')}
        type="secret"
        value={draft.clientSecret}
        onChange={(value) => update({ clientSecret: value })}
      />
      {(entry?.fields ?? []).map((field) => (
        <Field
          key={field.key}
          label={field.required === true ? field.label : `${field.label} (optional)`}
          type={field.type === 'url' ? 'text' : field.type}
          options={field.options}
          placeholder={field.placeholder ?? field.default ?? ''}
          help={field.help}
          value={draft.config[field.key] ?? field.default ?? ''}
          onChange={(value) => updateConfig(field.key, value)}
        />
      ))}
      <Field
        label={tr('allowlistLabel')}
        value={draft.allowedSubjects}
        placeholder={tr('allowlistPlaceholder')}
        onChange={(value) => update({ allowedSubjects: value })}
      />
      <div style={styles.row}>
        <button style={styles.primary} data-oauth-action="save" onClick={() => onSave(draft)}>
          {tr('save')}
        </button>
        <button style={styles.button} data-oauth-action="cancel" onClick={onCancel}>
          {tr('cancel')}
        </button>
      </div>
    </div>
  )
}

/** One configured provider row. */
function ProviderRow(props: {
  provider: ProviderItem
  catalog: CatalogItem[]
  onEdit: (provider: ProviderItem) => void
  onDelete: (provider: ProviderItem) => void
  onToggle: (provider: ProviderItem) => void
}): ReactNode {
  const { provider, catalog, onEdit, onDelete, onToggle } = props
  const entry = catalog.find((item) => item.id === provider.provider)
  return (
    <div style={{ ...styles.card, gap: 6 }}>
      <div style={styles.row}>
        <input
          type="checkbox"
          checked={provider.enabled !== false}
          data-oauth-provider={provider.id}
          onChange={() => onToggle(provider)}
        />
        <strong>{provider.label || entry?.label || provider.provider}</strong>
        <span style={styles.muted}>
          {(entry?.label ?? provider.provider)} · {provider.id}
        </span>
        <span style={styles.grow} />
        <button style={styles.button} onClick={() => onEdit(provider)}>
          {tr('edit')}
        </button>
        <button style={styles.button} onClick={() => onDelete(provider)}>
          {tr('delete')}
        </button>
      </div>
      <div style={styles.muted}>
        {tr('allowlist', {
          accounts: (provider.allowedSubjects ?? []).join(', ') || tr('allowlistEmpty'),
        })}
      </div>
      <div style={styles.muted}>
        Secret：{provider.hasSecret ? tr('secretSaved') : tr('secretMissing')}
      </div>
    </div>
  )
}

/** Catalog picker shown when no draft is open. */
function CatalogPicker(props: {
  catalog: CatalogItem[]
  used: string[]
  onPick: (entry: CatalogItem) => void
}): ReactNode {
  const available = props.catalog.filter((item) => !props.used.includes(item.id))
  if (available.length === 0) return <p style={styles.muted}>{tr('noCatalogLeft')}</p>
  return (
    <div style={styles.card}>
      <strong>{tr('addTitle')}</strong>
      <div style={{ display: 'grid', gap: 8 }}>
        {available.map((item) => (
          <button
            key={item.id}
            data-oauth-catalog={item.id}
            style={{ ...styles.button, textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'flex-start' }}
            onClick={() => props.onPick(item)}
          >
            <strong>{item.label}</strong>
            <span style={styles.muted}>{item.description}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

/** Settings section root. */
function LoginSettings(): ReactNode {
  const [catalog, setCatalog] = useState<CatalogItem[]>([])
  const [providers, setProviders] = useState<ProviderItem[]>([])
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null)
  const [base, setBase] = useState<BaseInfo | null>(null)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async (): Promise<void> => {
    setLoading(true)
    try {
      const body = await request<{ catalog: CatalogItem[]; providers: ProviderItem[] }>('oauth/providers')
      setCatalog(body.catalog ?? [])
      setProviders(body.providers ?? [])
      try {
        setSessionInfo(await request<SessionInfo>('oauth/session'))
      } catch {
        setSessionInfo(null)
      }
      try {
        setBase(await request<BaseInfo>('oauth/base'))
      } catch {
        setBase(null)
      }
      setError('')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  const save = useCallback(
    async (list: Draft[]): Promise<boolean> => {
      setError('')
      setMessage('')
      try {
        await request('oauth/providers', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            providers: list.map((item) => ({
              ...item,
              allowedSubjects: item.allowedSubjects.split(',').map((value) => value.trim()).filter(Boolean),
              clientSecret: item.clientSecret ? item.clientSecret : undefined,
            })),
          }),
        })
        setMessage(tr('savedNotice'))
        await reload()
        return true
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : String(cause))
        return false
      }
    },
    [reload],
  )

  /** Convert an edited draft back into the persisted list. */
  const commitDraft = useCallback(
    async (value: Draft): Promise<void> => {
      const entry = catalog.find((item) => item.id === value.provider)
      if (!value.clientId) {
        setError(tr('errorClientId'))
        return
      }
      if (!value.hasSecret && !value.clientSecret) {
        setError(tr('errorClientSecret'))
        return
      }
      const allowed = value.allowedSubjects.split(',').map((item) => item.trim()).filter(Boolean)
      if (allowed.length === 0) {
        setError(tr('errorAllowlist'))
        return
      }
      if (entry) {
        const missing = entry.fields.find(
          (field) => field.required === true && !(value.config[field.key] || field.default),
        )
        if (missing) {
          setError(tr('fieldRequired', { label: missing.label }))
          return
        }
      }
      const next = providers
        .filter((item) => item.id !== value.id)
        .map((item) => ({ ...item, allowedSubjects: item.allowedSubjects.join(', ') } as unknown as Draft))
      next.push({ ...value, allowedSubjects: allowed.join(', ') })
      const ok = await save(next)
      if (ok) setDraft(null)
    },
    [providers, catalog, save],
  )

  const toggle = useCallback(
    async (provider: ProviderItem): Promise<void> => {
      const next = providers.map((item) =>
        item.id === provider.id ? { ...item, enabled: item.enabled === false } : item,
      )
      setProviders(next)
      const ok = await save(next.map((item) => ({ ...item, allowedSubjects: item.allowedSubjects.join(', ') } as unknown as Draft)))
      if (!ok) await reload()
    },
    [providers, save, reload],
  )

  const remove = useCallback(
    async (provider: ProviderItem): Promise<void> => {
      const next = providers.filter((item) => item.id !== provider.id)
      const ok = await save(next.map((item) => ({ ...item, allowedSubjects: item.allowedSubjects.join(', ') } as unknown as Draft)))
      if (!ok) await reload()
    },
    [providers, save, reload],
  )

  const edit = useCallback((provider: ProviderItem): void => {
    setDraft({
      id: provider.id,
      provider: provider.provider,
      label: provider.label,
      enabled: provider.enabled,
      clientId: provider.clientId,
      clientSecret: '',
      config: { ...provider.config },
      allowedSubjects: provider.allowedSubjects.join(', '),
      hasSecret: provider.hasSecret,
      editing: true,
    })
  }, [])

  const pick = useCallback((entry: CatalogItem): void => {
    setDraft({
      id: entry.id,
      provider: entry.id,
      label: entry.label,
      enabled: true,
      clientId: '',
      clientSecret: '',
      config: Object.fromEntries(entry.fields.map((field) => [field.key, field.default ?? ''])),
      allowedSubjects: '',
      hasSecret: false,
      editing: false,
    })
  }, [])

  const who =
    sessionInfo?.native === true
      ? tr('currentNative')
      : sessionInfo?.provider
        ? tr('currentProvider', {
            provider: sessionInfo.label ?? sessionInfo.provider,
            subject: sessionInfo.subject ?? '',
          })
        : ''

  return (
    <div style={styles.wrap}>
      {who ? (
        <div style={{ ...styles.card, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <span style={styles.grow}>{who}</span>
          {sessionInfo?.provider ? (
            <button style={styles.button} onClick={() => globalThis.location.assign('oauth/logout')}>
              {tr('logout')}
            </button>
          ) : null}
        </div>
      ) : null}
      <p style={styles.muted}>{tr('intro')}</p>
      {message ? <p data-oauth-notice="ok">{message}</p> : null}
      {error ? (
        <p style={styles.error} role="alert" data-oauth-notice="error">
          {error}
        </p>
      ) : null}
      {loading ? <p style={styles.muted}>{tr('loading')}</p> : null}
      {providers.map((provider) => (
        <ProviderRow
          key={provider.id}
          provider={provider}
          catalog={catalog}
          onEdit={edit}
          onDelete={remove}
          onToggle={toggle}
        />
      ))}
      {draft ? (
        <ProviderForm
          draft={draft}
          catalog={catalog}
          base={base}
          onChange={setDraft}
          onCancel={() => setDraft(null)}
          onSave={(value) => void commitDraft(value)}
        />
      ) : (
        <CatalogPicker catalog={catalog} used={providers.map((item) => item.provider)} onPick={pick} />
      )}
    </div>
  )
}

/** Register the settings section with localized copy. */
export function apply(ctx: ClientContext): void {
  ctx.effect(() => ctx.locale.register(NS, { en, zh }), 'dsh-oauth-github: dictionaries')
  translate = ctx.locale.bind(NS)
  ctx.slots.inject('settings.section', () =>
    ctx.slots.register(
      {
        name: 'settings.section',
        id: 'oauth-login',
        order: 60,
        label: () => tr('nav'),
        locale: NS,
      },
      LoginSettings,
    ),
  )
}

/** Cordis plugin name and services for the client half. */
export const name = 'oauth-github'
export const inject = ['slots', 'locale']
