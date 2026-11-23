# Changelog

## 0.1.2

- Plugin-market presentation: `icon.svg`, localized `meta.title` / `meta.description` for English and Chinese.
- README rewritten as an overview with real screenshots of the sign-in page and Settings → OAuth.
- Declare `engines.dsh` (`^0.2.3-alpha.2`) so older hosts refuse the bundle instead of failing at runtime.
- Fix the Chinese sign-in button reading `使用以下方式登录： GitHub`; provider buttons are now
  `使用 GitHub 登录` / `Continue with GitHub`.

## 0.1.1

- Document the release flow and verify publishing through the GitHub Actions workflow.

## 0.1.0

- Initial release.
- Catalog-driven OAuth engine with GitHub, Google, GitLab, Gitee, Microsoft Entra,
  Discord, Slack, Keycloak/OIDC and Feishu/Lark providers.
- Schema-rendered settings section with hot configuration.
- Signed session cookies with live allowlist checks.
- Feishu: QR app creation (device flow) and configuration preflight.
- English and Simplified Chinese UI and host copy.
