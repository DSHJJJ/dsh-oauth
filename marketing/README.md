# Launch kit

Copy for shipping `@dshj/dsh-oauth` v0.1.2. Everything here is source material — pick the file that matches the
channel, adjust the first line, publish.

| File | For |
| --- | --- |
| [one-liners.md](one-liners.md) | Taglines, bios, npm description, elevator pitch (EN / 中文) |
| [x-thread-en.md](x-thread-en.md) | X / Twitter thread, English |
| [x-thread-zh.md](x-thread-zh.md) | X thread + 即刻文案，中文 |
| [show-hn.md](show-hn.md) | Hacker News "Show HN" |
| [reddit-selfhosted.md](reddit-selfhosted.md) | r/selfhosted, r/homelab |
| [v2ex.md](v2ex.md) | V2EX 分享创造 |
| [juejin-zh.md](juejin-zh.md) | 掘金 / 公众号长文 |
| [xiaohongshu.md](xiaohongshu.md) | 小红书短笔记 |
| [release-notes-v0.1.2.md](release-notes-v0.1.2.md) | GitHub Release body |

## Facts to keep straight

- Package `@dshj/dsh-oauth`, repo `github.com/DSHJJJ/dsh-oauth`, MIT, by jokcy.
- Requires DSH `^0.2.3-alpha.2` (the release that opened `connection.authentication` to plugins) and Node 24.
- Nine built-in providers plus a custom OIDC entry: GitHub, Google, GitLab, Gitee, Microsoft Entra, Discord,
  Slack, Keycloak/any OIDC issuer, Feishu/Lark.
- Configured in **Settings → OAuth**; changes apply on the next request; deleting a provider or an account from
  an allowlist revokes existing sessions immediately.
- Sessions are stateless HMAC-signed cookies; no server-side session table. Host half has zero runtime deps.
- The native local-token / device-pairing login keeps working as an alternative.
- Do not claim features that are not in the README; if something is unverified, leave it out.
