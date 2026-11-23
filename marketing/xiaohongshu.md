# 小红书

**标题**

`自建 AI 界面别再挂 oauth2-proxy 了，登录墙直接搬进应用`

**正文**

把自己那台 DeepSeek Harness 的登录方式换掉了，记录一下 👇

以前是 `Caddy → oauth2-proxy → 应用`：
多一个容器、多一份 client secret、白名单还要去改配置文件。最烦的是改完白名单，已经登录的会话不知道要不要踢。

DSH 0.2.3 开始，插件可以自己接管登录。于是我写了个 `@dshj/dsh-oauth`：

🔑 九种第三方登录：GitHub / Google / GitLab / Gitee / Microsoft / Discord / Slack / Keycloak / 飞书
⚙️ 全在「设置 → OAuth」里配，填完保存就生效，不用重启
🚪 白名单按账号，删掉之后它已有的会话下一个请求就失效
🍪 会话是签名 cookie，服务端不存 session 表；host 端零运行时依赖
🧩 加新 provider 大概二十行代码

飞书用户有两个额外福利：扫码就能把应用建出来，以及自带「重定向 URL 没登记（20029）」的体检，不行会直接把手动步骤列给你。

原来是 oauth2-proxy 的，也可以试试把这个省掉，少一个进程少一份配置。

MIT 开源，需要 DSH 0.2.3+ / Node 24，装：

```bash
dsh plugin --profile web add @dshj/dsh-oauth
```

仓库：github.com/DSHJJJ/dsh-oauth

**标签**

#自建服务 #Homelab #DeepSeek #OAuth #开源项目 #AI工具 #程序员日常

**配图建议**：`docs/login.zh.png`、`docs/settings.zh.png`、`docs/provider-form.zh.png`（这组正好三张，按顺序发）。
