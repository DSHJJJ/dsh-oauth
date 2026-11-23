# X thread — English

Attach `docs/login.png` to tweet 1 and `docs/settings.png` to tweet 3.

---

**1/6**

DSH 0.2.3 quietly opened a door: plugins can now own authentication. So I wrote one.

`@dshj/dsh-oauth` — OAuth sign-in for the self-hosted DeepSeek Harness Web UI. GitHub, Google, GitLab, Gitee,
Entra, Discord, Slack, Keycloak/OIDC, Feishu.

---

**2/6**

Before this, the login wall lived in front of the app: an oauth2-proxy container, a Caddy `import protected`,
a cookie secret shared between two processes, and an allowlist you edited in a config file.

Now it's part of the app. TLS termination stays wherever it is.

---

**3/6**

Everything is configured in **Settings → OAuth**: pick a provider, paste Client ID + Secret, list who is allowed.

- Applies on the next request — no restart
- Delete a provider or an account → those sessions stop working immediately
- The local token / device-pairing login keeps working as a fallback

---

**4/6**

The engine is catalog-driven, NextAuth-ish: a provider declares endpoints, token encoding and a profile→identity
mapping. The engine owns state, the token exchange, userinfo, allowlists and the session cookie.

Adding the tenth provider is ~20 lines in `src/catalog.ts`. PRs welcome.

---

**5/6**

Feishu/Lark gets two extras because it's what I actually use daily:

- scan a QR code → the app is created via the RFC 8628 device flow
- a preflight that catches the classic `20029 Invalid redirect URL` and tries to register the URL through the
  Open Platform API; when it can't, it prints the exact manual steps

---

**6/6**

Sessions are stateless: HMAC-SHA256 signed cookie, absolute expiry, no server-side session table. The host half
imports only Node builtins — zero runtime dependencies.

MIT. Needs DSH 0.2.3+ and Node 24.

```bash
dsh plugin --profile web add @dshj/dsh-oauth
```

github.com/DSHJJJ/dsh-oauth
