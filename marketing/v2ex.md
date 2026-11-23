# V2EX · 分享创造

**标题**

`给自建的 DeepSeek Harness 写了个 OAuth 登录插件，把登录墙从反向代理搬进了应用`

**节点**：分享创造（或 程序员）

**正文**

之前自己的 DeepSeek Harness Web 是这么暴露出去的：Caddy → oauth2-proxy → 应用。能用，但一直有几个别扭的地方：

- 多一个容器，多一份 client id/secret，多一个「白名单到底在哪改」的问题；
- 改白名单要动文件 + 热重载，改完还得想「已经登录的会话是不是该踢掉」；
- 应用自己不知道你是谁，只能信代理塞过来的 header。

DSH 0.2.3 把认证开放给插件了（`connection.authentication`）：插件注册一个校验器，校验通过就能拿到 owner 连接。
所以我把登录墙挪进了应用：登录页、回调路由、白名单、会话 cookie 现在都由应用进程自己出。

插件叫 `@dshj/dsh-oauth`，开源 MIT：github.com/DSHJJJ/dsh-oauth

**它做什么**

- 内置九个 provider：GitHub、Google、GitLab、Gitee、Microsoft Entra、Discord、Slack、Keycloak / 任意 OIDC、飞书 / Lark。
- 全部在「设置 → OAuth」里配：选 provider、填 Client ID / Secret、填允许的账号；保存后下一个请求生效，不用重启。
- 白名单按账号：用户名、邮箱、sub / open_id 任一命中即可；把账号删掉，它已登录的会话下一个请求就失效。
- 会话是无状态签名 cookie（HMAC-SHA256 + 绝对过期），服务端没有 session 表；host 端零运行时依赖。
- 原来的「本机 Token / 设备配对」登录保留，作为 IdP 挂掉时的兜底。

**引擎怎么组织的**

借鉴 NextAuth 的 catalog 思路：一个 provider 只声明端点、token 编码方式（form / json）、profile → 身份映射，
state 校验、换 token、拉 userinfo、白名单匹配、发 cookie 全部由引擎统一处理。所以加一个 provider 是往
`src/catalog.ts` 里加一条，大概二十行：

```ts
example: {
  label: 'Example',
  fields: [{ key: 'region', label: 'Region', type: 'text', default: 'us' }],
  token: { body: 'form' },
  endpoints: (config) => ({ authorizeUrl: …, tokenUrl: …, userInfoUrl: … }),
  profile: (user) => ({ id: String(user.sub), name: String(user.name), identifiers: [user.sub, user.email] }),
},
```

设置页会自动按 `fields` 渲染表单，登录页自动列出它。

**踩过的两个坑，写下来给后来人**

1. 反向代理后面回调会 403。GitHub 回跳时 `Sec-Fetch-Site` 是 `cross-site`，而 DSH 的写入防护把它当跨站请求。
   解法是在 Caddy 里只对「顶层导航」归一化：`@navigation` 匹配 `method GET` + `Sec-Fetch-Mode: navigate`，
   然后 `request_header @navigation Sec-Fetch-Site same-origin`。别全局改，容易放过真正的跨站写请求。
2. 飞书的 `20029 Invalid redirect URL`。重定向地址没登记到应用里就报这个，但错误只出现在授权页。插件现在会
   先探活凭据，再去探测授权页是否接受这个回调地址，能通过 Open Platform API（`application:application:patch`）
   自动登记就登记；没权限或者应用不是在开放平台控制台创建的，就把精确的手动步骤打出来，不猜。
   另外顺手做了扫码建应用（RFC 8628 device flow），省得先去后台点一遍。

**截图**

- 登录页：github.com/DSHJJJ/dsh-oauth/blob/main/docs/login.zh.png
- 设置页：github.com/DSHJJJ/dsh-oauth/blob/main/docs/settings.zh.png
- 添加 provider 的表单（含回调地址提示）：github.com/DSHJJJ/dsh-oauth/blob/main/docs/provider-form.zh.png

**安装**

```bash
dsh plugin --profile web add @dshj/dsh-oauth
```

需要 DSH 0.2.3+（认证插件 API 是这个版本才有的）和 Node 24。

有什么想加的 provider、或者觉得认证流程哪里可以更稳，欢迎在 issue 里说，我自己每天在用，会跟。
