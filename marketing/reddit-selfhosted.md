# Reddit — r/selfhosted, r/homelab

**Title**

`I moved the login wall of my self-hosted AI UI from oauth2-proxy into the app itself (OAuth plugin, MIT)`

**Body**

For a couple of years my pattern for anything on the public internet was: Caddy → oauth2-proxy → app, and the app
gets `X-Auth-Request-Email` for free. It works. It also means every service needs its own container, its own client
ID/secret, and an allowlist that lives in a config file somewhere else.

DeepSeek Harness (a self-hosted agent UI) added a plugin hook for authentication in 0.2.3, so I tried the other
approach: keep the login wall inside the app. This plugin serves the login page, the callback, and the session
cookie from the app process, and stores its configuration in a JSON file the settings UI writes.

What that buys me in practice:

- One less container and one less config file to keep in sync.
- The allowlist is per provider and per account, and it is live: removing an account kills its sessions on the next
  request. No restart, no cookie invalidation dance.
- Nine providers out of the box (GitHub, Google, GitLab, Gitee, Entra, Discord, Slack, Keycloak/OIDC, Feishu), and
  adding another is a catalog entry, not a new service.
- The built-in local token / device pairing login still exists as a fallback, which matters when an IdP is down.

I would not claim it replaces oauth2-proxy everywhere — if I had ten services behind one proxy, one auth layer for
all of them is still the better deal. For a single app that only I use, app-layer auth is less machinery.

Screenshots and the config details are in the repo: https://github.com/DSHJJJ/dsh-oauth

Caveats, since r/selfhosted will ask: single-user owner model (it is a personal agent UI), allowlist is the only
authorization check, secrets sit in `$DSH_HOME/oauth-github/providers.json` with `0600`, and it needs DSH 0.2.3+.
Feedback on the auth flow or on providers I should add is welcome.
