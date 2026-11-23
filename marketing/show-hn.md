# Show HN

**Title**

`Show HN: OAuth sign-in for DeepSeek Harness as an app-layer plugin`

**URL**

`https://github.com/DSHJJJ/dsh-oauth`

**Text**

DeepSeek Harness is a self-hosted agent UI. Until 0.2.3 the only ways in were a local token or a device pairing
code, so people put an oauth2-proxy in front of it and let the reverse proxy do the auth.

0.2.3 added `connection.authentication`: a plugin can register a verifier and, when it admits a credential, get
back an owner connection. This bundle uses that instead of sitting outside the app. The login page, the callback
routes, the allowlist and the session cookie are all served by the harness itself, so there is no second process,
no shared cookie secret, and the settings live in the same app you are logging into.

What is in it:

- Nine providers (GitHub, Google, GitLab, Gitee, Microsoft Entra, Discord, Slack, Keycloak or any OIDC issuer,
  Feishu/Lark) from one table-driven engine — a provider is endpoints + token encoding + a profile→identity
  mapping, so a new one is about 20 lines.
- A settings section that renders each provider's own fields, with changes applied on the next request. Removing a
  provider or an account from an allowlist invalidates existing sessions immediately.
- Feishu-specific work: create the app by scanning a QR code (RFC 8628 device flow), plus a preflight that catches
  `20029 Invalid redirect URL` and can register the redirect URL through the Open Platform API.
- Stateless sessions: HMAC-SHA256 signed cookie with an absolute expiry, no session table; the host half imports
  only Node builtins.

Limits I would rather state up front: it is a single-user owner model (that is what DSH is today), the allowlist is
the only authorization check, and anything that can write `$DSH_HOME/oauth-github/providers.json` can grant itself
access — so keep the harness home `0700`.

Install is `dsh plugin --profile web add @dshj/dsh-oauth`; requires DSH 0.2.3+ and Node 24. MIT.

Happy to answer questions about the plugin/auth API, the Feishu device flow, or why the callback redirect needs
`Sec-Fetch-Site: same-origin` normalization behind a reverse proxy.
