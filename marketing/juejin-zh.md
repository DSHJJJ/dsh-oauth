# 掘金 / 公众号长文

**标题**

`把登录墙搬进应用：给 DeepSeek Harness 写一个 OAuth 插件`

**摘要**

DSH 0.2.3 把认证开放给了插件。这篇文章讲为什么要把 oauth2-proxy 拿掉、一个 catalog 驱动的 OAuth 引擎长什么样、
无状态会话怎么设计，以及飞书 `20029` 和反向代理 `Sec-Fetch-Site` 这两个坑。

---

## 一、起因：登录墙站错了位置

我自建的 DeepSeek Harness（DSH）是一个 agent 界面，只给自己用，但要能从公网访问。第一版部署很典型：

```
公网 :8888 → Caddy :8443 → oauth2-proxy :4180 → DSH :3080
```

这套东西的好处是通用：任何服务都能挂上去，应用完全不用改。坏处也很明确：

1. **多一个进程**，多一份 client id/secret，多一份需要对齐的 cookie 配置；
2. **白名单在应用外面**。改白名单要改文件、热重载代理，然后思考「已经登录的会话要不要踢」；
3. **应用不知道你是谁**。代理塞一个 header 过来，应用只能信。

第 3 点最难受。DSH 的多用户概念目前就是「owner / 匿名」，所以认证对它就只有一个问题：**这个请求是不是 owner 发出的**。
这个问题最该由应用自己回答。

DSH 0.2.3 恰好开了这个口子：`connection.authentication` 是一个有序的凭证校验器注册表，插件注册进去，
校验通过就能拿到一个 owner 连接。于是有了 `@dshj/dsh-oauth`。

## 二、整体形状

```
浏览器 ──GET /oauth/github/start──▶ 插件：生成 state，302 到 provider
浏览器 ──回调 /oauth/github/callback?code&state──▶ 插件
插件 ──POST token──▶ provider
插件 ──GET userinfo──▶ provider
插件：校验 state → 匹配白名单 → 签发 HMAC cookie → 302 /
之后每个请求：验 cookie → 回查实时白名单 → connection.authentication 放行
```

三件事值得展开：provider 描述、会话、热更新。

## 三、provider 是一张表，不是一个适配器

NextAuth 的 catalog 思路很适合这里：绝大多数 OAuth provider 的差异只有三处——端点、token 请求的编码方式、
以及 userinfo 到「身份」的映射。所以一个 provider 就是一个对象：

```ts
export const CATALOG = {
  github: {
    label: 'GitHub',
    scope: 'read:user user:email',
    token: { body: 'form' },
    endpoints: () => ({
      authorizeUrl: 'https://github.com/login/oauth/authorize',
      tokenUrl: 'https://github.com/login/oauth/access_token',
      userInfoUrl: 'https://api.github.com/user',
    }),
    profile: (user) => ({
      id: String(user.id),
      name: String(user.name ?? user.login),
      identifiers: [user.login, user.email].filter(Boolean).map(String),
    }),
  },
}
```

有自己参数的就加 `fields`：GitLab 要 base URL，Microsoft 要 tenant，Keycloak 要 issuer（走 discovery），
飞书要版本和 scope。设置页不写死任何表单，它读 `fields` 渲染，所以加 provider 不用碰 UI 代码。

这一层抽象的直接收益：九个内置 provider 之外，用户自己加一个大约二十行。

## 四、会话：无状态，但能即时失效

会话不是存在服务端的表，而是 cookie 本身：

```
dsh_oauth_session = v1.<base64url payload>.<HMAC-SHA256>
payload = { p: providerId, s: subject, n: name, ids: [...], exp }
```

签名密钥在 `$DSH_HOME/oauth-github/secret`（0600，首次启动生成）。cookie 是 `HttpOnly`、`SameSite=Lax`、
按公网地址决定 `Secure`，带绝对过期（默认 30 天，可配）。

无状态会话的经典问题是「怎么让已登录的人立刻下线」。这里的答案很朴素：**每个请求都把 payload 拿去和实时配置
对一遍**——provider 还在吗？它启用的白名单里还有这个 subject 吗？只要有一个不满足，就当作未登录。

于是：

| 改了什么 | 什么时候生效 |
| --- | --- |
| 新增 provider | 下一个请求，登录页就能看到 |
| 改白名单 | 被移出的人下一个请求就被拒 |
| 删除 / 禁用 provider | 它的会话立刻失效 |
| 轮换 `secret` | 所有 OAuth 会话失效 |

没有 session 表的好处是省掉了一整套过期清理和并发写入，坏处是 cookie 会大一点（身份标识列表）。对单用户场景，取舍很明显。

## 五、飞书：把「配置不对」变成可诊断的错误

飞书是我每天在用的，所以这部分做得比通用流程多。

**① 扫码建应用。** 用飞书官方的 App Registration device flow（RFC 8628）：`POST accounts.feishu.cn/oauth/v1/app/registration`，
带 `action=begin`、`archetype=PersonalAgent`、`auth_method=client_secret`，拿回二维码，然后轮询。扫完应用就有了，
不用先去开放平台点一遍。

**② 自检。** 飞书最气人的错误码是 `20029 Invalid redirect URL`：地址没登记，但错误只在授权页出现，日志里啥也看不到。
现在的检查顺序是：

1. 用 `client_id` / `client_secret` 拿 `tenant_access_token`，确认凭据本身是好的；
2. 探测授权页会不会接受这个回调地址（也就是主动撞 `20029`）；
3. 如果不行，试着用 `PATCH /open-apis/application/v7/applications/:app_id/config` 写 `security.add.redirect_urls`；
4. 写成功要**重新探测**（我第一版这里撒谎了：PATCH 成功但页面仍然 20029，因为我没复检）；
5. 没权限（缺 `application:application:patch`，报 `99991672`）或应用不是在开放平台控制台建的（`210043` / `210035`），
   就打出手动步骤，而不是假装成功。

## 六、反向代理后面那个 403

把 oauth2-proxy 拿掉之后，Caddy 只剩 `reverse_proxy`。登录能进去，但 GitHub 回跳时直接 403。

原因：GitHub 的回跳是一次跨站重定向，浏览器发出的 `Sec-Fetch-Site` 是 `cross-site`，而 DSH 的写入防护
（对状态变更请求的跨站防护）把它当成了恶意跨站请求。

解法不是全局放宽，而是只对**顶层导航**归一化：

```caddyfile
@navigation {
    method GET
    header Sec-Fetch-Mode navigate
}
request_header @navigation Sec-Fetch-Site same-origin
```

只有「用户点链接/被重定向，浏览器要换文档」的请求会被改写；XHR / fetch 的跨站写请求仍然是 `cross-site`，
照样被拒。这个区分很重要，否则就是把防护拆了。

## 七、现在长什么样

登录页（中英双语，按 `Accept-Language` 出）：

> 图：`docs/login.zh.png`

设置页（provider 列表 + 可添加的 catalog）：

> 图：`docs/settings.zh.png`

添加 provider 的表单（每行提示都来自 catalog，回调地址直接给你复制）：

> 图：`docs/provider-form.zh.png`

## 八、装一个试试

```bash
dsh plugin --profile web add @dshj/dsh-oauth
```

需要 DSH 0.2.3+（`connection.authentication` 是这个版本才开放的）和 Node 24。

- 仓库：https://github.com/DSHJJJ/dsh-oauth
- npm：https://www.npmjs.com/package/@dshj/dsh-oauth
- 许可：MIT

如果你也在自建 DSH，或者想加某个 provider（企业微信、Authentik、Casdoor……），issue 里说一声。
