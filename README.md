# dsh-oauth

[![npm](https://img.shields.io/npm/v/@dshj/dsh-oauth)](https://www.npmjs.com/package/@dshj/dsh-oauth)
[![CI](https://github.com/DSHJJJ/dsh-oauth/actions/workflows/ci.yml/badge.svg)](https://github.com/DSHJJJ/dsh-oauth/actions/workflows/ci.yml)

Third-party OAuth / OIDC sign-in for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) Web, built as a DSH bundle (host + client halves).

Configure providers from **Settings → OAuth** — every change applies on the next request, no restart. Built-in providers: **GitHub, Google, GitLab, Gitee, Microsoft Entra, Discord, Slack, Keycloak/any OIDC issuer, and Feishu/Lark** (with one-click app creation by QR code).

## Features

- **Catalog-driven** (NextAuth / Passport style): a provider declares its endpoints, token encoding and profile mapping; the engine owns the authorization-code flow.
- **Schema-rendered settings page**: pick a provider, fill Client ID / Secret / allowed accounts plus that provider's own fields (GitLab base URL, Microsoft tenant, OIDC issuer, Feishu edition).
- **Hot configuration**: writes replace the in-memory list immediately; disabling or deleting a provider invalidates its existing sessions on the next request.
- **Feishu / Lark extras**: RFC 8628 device flow to create an app by QR code, plus a preflight that checks credentials, redirect URL and whether the redirect URL can be registered through the Open Platform API.
- **Zero dependencies at runtime**: the host half imports only Node builtins; the client half uses the React baseline already shared by the harness.
- **i18n**: English and Simplified Chinese for the settings UI and the server-rendered login/error pages (picked from `Accept-Language`).
- **Localized allowlists**: a login matches when *any* returned identifier (username, email, subject, open_id…) is listed, case-insensitively.

## Install

```bash
# in a DSH profile
dsh plugin --profile web add @dshj/dsh-oauth
```

or, from a checkout:

```bash
cd your-profile-dir
pnpm add link:../path/to/dsh-oauth
# then add "@dshj/dsh-oauth" to dsh.profile.bundles in package.json
```

The bundle inserts one row (`oauth-github`). Its settings page appears automatically.

## Configure

1. Create an OAuth client at the provider (redirect URL shown in the form).
2. Open **Settings → OAuth → Add an OAuth provider**, pick the provider and fill:
   - **Client ID / Client Secret**
   - **Allowed accounts** — comma-separated usernames, emails or subjects
   - provider fields (GitLab base URL, Microsoft tenant, Feishu edition/scope, OIDC issuer)
3. Save. The login page now offers the provider.

Optional profile-row config (`cordis.patch.yml`):

```yaml
- id: oauth-github
  name: dsh-oauth-github
  config:
    cookieMaxAgeDays: 30        # absolute session lifetime
    cookieSecret: "…"           # 32+ bytes; otherwise generated under $DSH_HOME
    clientId: cli_xxx           # legacy single-provider GitHub config
    allowedLogins: [octocat]
```

## Providers and identifiers

| Provider | Extra fields | Identity candidates |
| --- | --- | --- |
| GitHub | – | login, numeric id, email |
| Google | – | sub, email |
| GitLab | base URL | username, id, email |
| Gitee | – | login, id, email |
| Microsoft | tenant | sub, email, preferred_username |
| Discord | – | username, id, email |
| Slack | – | sub, email |
| Feishu / Lark | edition, scope | open_id, union_id, user_id, email, enterprise_email |
| Keycloak / OIDC | issuer (discovery) | sub, email, preferred_username |

Allowlists are fail-closed: an empty list rejects everyone.

## Storage

| What | Where | Notes |
| --- | --- | --- |
| Provider configuration | `$DSH_HOME/oauth-github/providers.json` | `0600`, atomic write, secrets included |
| Cookie signing key | `$DSH_HOME/oauth-github/secret` | `0600`, generated once |
| Session | browser cookie `dsh_oauth_session` | `HttpOnly`, `SameSite=Lax`, HMAC-SHA256, absolute expiry |

There is no server-side session table: the cookie carries provider id, subject, all identifiers and expiry, and every request re-checks the live provider list and allowlist. Third-party access tokens are used for the userinfo call and then discarded.

## Security

- `state` is 256-bit, single-use, bound to the provider and expires after 10 minutes.
- Cookies are signed with HMAC-SHA256; `Secure` follows the advertised URL scheme, so TLS-terminating proxies work.
- Disabling a provider or removing an account from its allowlist invalidates matching sessions immediately.
- The settings API requires an authenticated owner; cross-site writes are rejected by the harness fence.
- Secrets never reach the browser: the provider list only reports `hasSecret`, and a write that omits `clientSecret` keeps the stored one.
- See [SECURITY.md](SECURITY.md) for reporting and the threat model.

## Feishu / Lark notes

- Creating the app by QR uses the App Registration device flow used by the official Feishu CLI/SDK. The created app still needs its redirect URL registered.
- The preflight checks that automatically: credentials (`tenant_access_token`), whether the authorize page accepts the redirect URL (Feishu error `20029`), and whether `application:application:patch` lets the plugin register it. When the API cannot configure the app (missing permission, or app created outside the developer console), the checklist prints the exact manual steps.
- Redirect URLs take effect without review; other app configuration may require publishing a version.

## Adding a provider

Append one entry to `CATALOG` in `src/catalog.ts`:

```ts
example: {
  label: 'Example',
  description: 'Example OAuth service.',
  docsUrl: 'https://example.com/apps',
  scope: 'openid profile',
  fields: [{ key: 'region', label: 'Region', type: 'text', default: 'us' }],
  token: { body: 'form' },
  endpoints: (config) => ({
    authorizeUrl: `https://${config.region}.example.com/oauth/authorize`,
    tokenUrl: `https://${config.region}.example.com/oauth/token`,
    userInfoUrl: `https://${config.region}.example.com/oauth/userinfo`,
  }),
  profile: (user) => ({
    id: String(user.sub),
    name: String(user.name ?? user.sub),
    identifiers: [user.sub, user.email].filter(Boolean).map(String),
  }),
},
```

No other change is required: the settings page renders `fields`, the login page lists it, and the engine handles state, token exchange, userinfo, allowlist and cookies.

## Development

```bash
npm install
npm run typecheck   # tsc --noEmit
npm run build       # esbuild -> lib/index.js (ESM) + lib/client.js (harness bundle)
```

Source layout:

```
src/
  index.ts        host plugin: engine, routes, Feishu extras
  catalog.ts      provider catalog, normalization, OIDC discovery
  copy.ts         host-rendered login/error copy + provider localization
  store.ts        providers.json and cookie secret
  types.ts        structural types for the DSH surfaces used
  util.ts         crypto/cookie/http helpers
  client/
    index.tsx     settings section (React, schema driven)
    locales.ts    en / zh dictionaries
    styles.ts     inline styles
    context.ts    client-side DSH surface types
```

`lib/` is built output and is committed so the plugin can be linked without a build step.

## Releasing

1. Bump `version` in `package.json` and update `CHANGELOG.md`.
2. Commit, then tag: `git tag vX.Y.Z && git push origin vX.Y.Z`.
3. The `Publish` workflow builds, verifies the committed bundle, and **stages** the version with provenance (`npm stage publish`).

Staged publishing is deliberate: the trusted publisher only has the *stage* permission, so a maintainer
must approve each release on npmjs.com with 2FA before it becomes installable.

## License

MIT © jokcy

---

## 中文说明

DeepSeek Harness Web 的第三方 OAuth / OIDC 登录插件，host + client 双端 bundle。

- **内置**：GitHub、Google、GitLab、Gitee、Microsoft、Discord、Slack、Keycloak（任意 OIDC issuer）、飞书/Lark。
- **设置页「OAuth」**：按 provider 的 schema 渲染表单，填写 Client ID / Secret / 允许账号即可；保存立即生效，无需重启。
- **飞书**：支持扫码一键创建应用（device flow），并自带配置自检：凭据、网页应用/重定向 URL、能否通过 API 自动登记；失败会给出精确的手动步骤。
- **白名单**：可填用户名、邮箱或 sub/open_id，任一命中即可；留空拒绝所有。
- **安全**：state 单次校验、HMAC 签名 cookie、禁用 provider 即失效旧会话、secret 不下发浏览器。
- **存储**：`$DSH_HOME/oauth-github/providers.json`（0600）、`secret`（0600）；无服务端 session 表。

开发：`npm install && npm run typecheck && npm run build`，产物在 `lib/`。
