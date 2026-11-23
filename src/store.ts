/** Persistence: the cookie-signing secret and `providers.json`. */

import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { randomBytes } from 'node:crypto'
import { legacyInstance, normalizeInstance } from './catalog.js'
import type { PluginConfig, ProviderInstance } from './types.js'

/** Directory holding this plugin's state inside the harness home. */
const STATE_DIR = 'oauth-github'

/** @returns the harness home, honoring `DSH_HOME`. */
export function harnessHome(): string {
  return process.env.DSH_HOME?.trim() || join(homedir(), '.dsh')
}

/** @returns absolute path of `providers.json`. */
export function providersPath(): string {
  return join(harnessHome(), STATE_DIR, 'providers.json')
}

/** @returns absolute path of the cookie-signing secret. */
function secretPath(): string {
  return join(harnessHome(), STATE_DIR, 'secret')
}

/** Load the HMAC key, generating and persisting one on first use. */
export function loadSecret(configured: string | undefined): Buffer {
  if (typeof configured === 'string' && configured.length >= 32) return Buffer.from(configured, 'utf8')
  try {
    const stored = readFileSync(secretPath(), 'utf8').trim()
    if (stored.length >= 32) return Buffer.from(stored, 'utf8')
  } catch {
    // Fall through to generation.
  }
  mkdirSync(join(harnessHome(), STATE_DIR), { recursive: true, mode: 0o700 })
  const generated = randomBytes(48).toString('base64url')
  writeFileSync(secretPath(), `${generated}\n`, { mode: 0o600 })
  return Buffer.from(generated, 'utf8')
}

/** Read `providers.json`, converting legacy v1 rows, with the row config as fallback. */
export function loadInstances(config: PluginConfig | undefined): ProviderInstance[] {
  try {
    const parsed = JSON.parse(readFileSync(providersPath(), 'utf8')) as {
      providers?: Array<Record<string, unknown>>
    }
    const list = Array.isArray(parsed.providers) ? parsed.providers : []
    const migrated = list.map((entry) => {
      // v1 stored `type` plus explicit endpoints; map to the hidden custom provider.
      if (entry.provider === undefined && entry.type === 'oidc') {
        return {
          ...entry,
          provider: 'custom',
          config: {
            authorizeUrl: entry.authorizeUrl,
            tokenUrl: entry.tokenUrl,
            userInfoUrl: entry.userInfoUrl,
          },
        }
      }
      if (entry.provider === undefined && entry.type !== undefined) return { ...entry, provider: entry.type }
      return entry
    })
    return migrated.map((entry) => normalizeInstance(entry))
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code
    if (code !== 'ENOENT') {
      console.warn(`dsh-oauth-github: ignoring unreadable providers.json: ${String(error)}`)
    }
  }
  const legacy = legacyInstance(config)
  return legacy === null ? [] : [legacy]
}

/** Persist instances atomically with owner-only permissions. */
export function persistInstances(instances: ProviderInstance[]): void {
  mkdirSync(join(harnessHome(), STATE_DIR), { recursive: true, mode: 0o700 })
  const target = providersPath()
  const temp = `${target}.${process.pid}.tmp`
  writeFileSync(temp, `${JSON.stringify({ version: 2, providers: instances }, null, 2)}\n`, { mode: 0o600 })
  renameSync(temp, target)
}
