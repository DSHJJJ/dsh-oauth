# One-liners

## Tagline

EN — `OAuth sign-in for DeepSeek Harness, configured in the app instead of in front of it.`

中文 — `把 DeepSeek Harness 的登录墙搬进应用里：九种第三方 OAuth，设置页点几下就生效。`

## 280 characters

EN:

> DSH 0.2.3 lets plugins own authentication, so I wrote one: OAuth sign-in for the self-hosted DeepSeek Harness
> Web UI. GitHub, Google, GitLab, Gitee, Entra, Discord, Slack, Keycloak, Feishu. Settings → OAuth, next request
> takes effect, no restart, no oauth2-proxy.

中文:

> DeepSeek Harness 0.2.3 把认证开放给了插件，于是我写了一个：九种第三方 OAuth 登录，全部在「设置 → OAuth」里配置，
> 保存即生效，不用重启、不用在 Caddy 前面挂 oauth2-proxy。

## Elevator pitch (2 sentences)

EN — `dsh-oauth moves the login wall from the reverse proxy into the app: nine OAuth providers, per-account
allowlists and instant revocation, configured from a settings panel with no restart. It is one DSH bundle, zero
runtime dependencies, and adding a tenth provider is about twenty lines of catalog entry.`

中文 — `dsh-oauth 把登录墙从反向代理搬进应用：九种 OAuth provider、按账号白名单、改动即时生效，配置全在设置页里。
一个 DSH bundle，零运行时依赖，加第十个 provider 大概二十行代码。`

## npm description (≤ 200 chars)

`Third-party OAuth login for DeepSeek Harness Web: GitHub, Google, GitLab, Gitee, Microsoft, Discord, Slack, Feishu/Lark and any OIDC issuer, configured from Settings → OAuth without a restart.`

## GitHub repository description

`OAuth / OIDC sign-in for DeepSeek Harness Web — nine providers, per-account allowlists, live configuration.`

## Topic tags

`deepseek-harness` `dsh` `dsh-plugin` `oauth` `oidc` `self-hosted` `sso` `feishu` `lark`
