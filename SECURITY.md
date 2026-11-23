# Security

## Reporting

Please report vulnerabilities privately through GitHub Security Advisories
("Report a vulnerability" on the repository) rather than a public issue.

## Threat model

This plugin turns third-party identities into an **owner** peer of a
single-user DeepSeek Harness host. Treat every configured provider as a root
credential:

- The allowlist is the only authorization check. An empty list rejects all
  logins; a compromised or overly broad account at the IdP can sign in.
- Anyone who can write `$DSH_HOME/oauth-github/providers.json` can add a
  provider and therefore grant themselves access. The file is written `0600`
  inside a `0700` directory; keep the harness home private.
- Anyone who can read `$DSH_HOME/oauth-github/secret` can mint session cookies.
  Rotating (deleting) it invalidates all OAuth sessions.
- Session cookies are HttpOnly, SameSite=Lax and HMAC-SHA256 signed. They bind
  the provider id, the subject and every identifier returned by the IdP, plus an
  absolute expiry. There is no server-side revocation list: disabling the
  provider or editing its allowlist is the revocation mechanism.
- The settings API requires an authenticated owner and is additionally
  protected by the harness request-trust fence (Host/Origin/Sec-Fetch).
- Third-party access tokens are used once for the userinfo call and never
  persisted.

## Supported versions

Only the latest release receives security fixes.
