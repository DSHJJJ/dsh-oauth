# X thread + 即刻 — 中文

配图：第 1 条用 `docs/login.zh.png`，第 3 条用 `docs/settings.zh.png`。

## X thread

**1/6**

DSH（DeepSeek Harness）0.2.3 把认证开放给了插件。于是我写了一个。

`@dshj/dsh-oauth`：给自建的 DeepSeek Harness Web 加第三方登录。GitHub、Google、GitLab、Gitee、Microsoft
Entra、Discord、Slack、Keycloak / 任意 OIDC、飞书 / Lark。

---

**2/6**

之前登录墙在应用外面：一个 oauth2-proxy 容器、Caddy 里一行 `import protected`、两个进程共享的 cookie
secret，改白名单要动配置文件、再热重载。

现在它是应用的一部分，TLS 终止留在原来那一层。

---

**3/6**

全部在「设置 → OAuth」里配：选 provider、填 Client ID / Secret、列出允许的账号。

- 保存后下一个请求就生效，不用重启
- 删掉一个 provider，或把账号从白名单里删掉，它的会话立刻失效
- 原来的本机 Token / 设备配对登录继续可用，作为兜底

---

**4/6**

引擎是 catalog 驱动的（NextAuth 那套味道）：provider 只声明端点、token 编码方式、profile → 身份映射，state
校验、换取 token、拉 userinfo、白名单、签名 cookie 全由引擎处理。

加第十个 provider 大概二十行，欢迎 PR。

---

**5/6**

飞书专门多做了两件事，因为我每天在用：

- 扫码一键创建应用（RFC 8628 device flow）
- 配置自检：先探活凭据，再探 `20029 Invalid redirect URL`，能通过 Open Platform API 自动登记就登记；不行就
  把精确的手动步骤打出来，不瞎猜

---

**6/6**

会话是无状态的：HMAC-SHA256 签名 cookie，绝对过期时间，服务端没有 session 表；host 端只依赖 Node 内置模块，
零运行时依赖。

MIT，需要 DSH 0.2.3+ 和 Node 24。

```bash
dsh plugin --profile web add @dshj/dsh-oauth
```

github.com/DSHJJJ/dsh-oauth

## 即刻（单条）

> 给自己那台 DeepSeek Harness 换了登录方式：以前是 Caddy 前面挂 oauth2-proxy，现在登录墙直接长在应用里。
> 九种 provider 都在「设置 → OAuth」里配，填完保存就生效，不重启；把账号从白名单删掉，它的会话当场失效。
> 顺手把飞书的扫码建应用和「20029 重定向 URL 不对」的自检也做进去了。开源了，MIT。
> github.com/DSHJJJ/dsh-oauth
