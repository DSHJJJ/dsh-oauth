# v0.1.2 — plugin-market presentation and a screenshot-led README

This release is about how the plugin presents itself; the OAuth engine is unchanged.

## Added

- `icon.svg` — a plugin icon that renders in Plugin Manager rows and bundle details.
- `locale/en.json` and `locale/zh.json` — `meta.title` and `meta.description`, so the bundle shows up as
  **OAuth sign-in / OAuth 登录** with a real description instead of a bare package name.
- Real screenshots under `docs/`: the sign-in page, Settings → OAuth with two providers configured, and the
  add-provider form (English and Chinese).
- `engines.dsh: ^0.2.3-alpha.2` — older hosts refuse the bundle with `incompatible-version` instead of failing at
  runtime when `connection.authentication` is missing.

## Changed

- README rewritten as an overview: what it is, why it exists next to oauth2-proxy, install, adding a provider, the
  catalog, how the session works, and the Feishu extras.

## Fixed

- Chinese sign-in buttons read `使用以下方式登录： GitHub`; they now read `使用 GitHub 登录`
  (`Continue with GitHub` in English).

## Install

```bash
dsh plugin --profile web add @dshj/dsh-oauth
```

Requires DSH `^0.2.3-alpha.2` and Node 24.
