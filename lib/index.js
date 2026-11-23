// src/index.ts
import { randomBytes as randomBytes2, timingSafeEqual as timingSafeEqual2 } from "node:crypto";

// src/catalog.ts
var CATALOG = {
  github: {
    label: "GitHub",
    description: "GitHub OAuth App. Identity matches login, numeric id or email.",
    docsUrl: "https://github.com/settings/developers",
    scope: "read:user",
    fields: [],
    token: { body: "json" },
    endpoints: () => ({
      authorizeUrl: "https://github.com/login/oauth/authorize",
      tokenUrl: "https://github.com/login/oauth/access_token",
      userInfoUrl: "https://api.github.com/user"
    }),
    profile: (user) => {
      const login = String(user.login ?? user.id ?? "");
      return {
        id: login,
        name: String(user.name ?? login),
        identifiers: [login, user.id === void 0 ? "" : String(user.id), String(user.email ?? "")].filter(Boolean)
      };
    }
  },
  google: {
    label: "Google",
    description: "Google OAuth client. Identity matches sub or email.",
    docsUrl: "https://console.cloud.google.com/apis/credentials",
    scope: "openid email profile",
    fields: [],
    token: { body: "form" },
    endpoints: () => ({
      authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth",
      tokenUrl: "https://oauth2.googleapis.com/token",
      userInfoUrl: "https://openidconnect.googleapis.com/v1/userinfo"
    }),
    profile: (user) => ({
      id: String(user.sub ?? ""),
      name: String(user.email ?? user.name ?? user.sub ?? ""),
      identifiers: [user.sub, user.email, user.name].filter(Boolean).map(String)
    })
  },
  gitlab: {
    label: "GitLab",
    description: "GitLab.com or a self-hosted instance. Identity matches username, id or email.",
    docsUrl: "https://gitlab.com/-/user_settings/applications",
    scope: "read_user",
    fields: [
      {
        key: "baseUrl",
        label: "GitLab base URL",
        type: "url",
        required: true,
        default: "https://gitlab.com",
        help: "Use your own domain for a self-hosted instance."
      }
    ],
    token: { body: "form" },
    endpoints: (config) => {
      const base = (config.baseUrl || "https://gitlab.com").replace(/\/$/, "");
      return {
        authorizeUrl: `${base}/oauth/authorize`,
        tokenUrl: `${base}/oauth/token`,
        userInfoUrl: `${base}/api/v4/user`
      };
    },
    profile: (user) => {
      const login = String(user.username ?? user.id ?? "");
      return {
        id: login,
        name: String(user.name ?? login),
        identifiers: [login, user.id === void 0 ? "" : String(user.id), String(user.email ?? "")].filter(Boolean)
      };
    }
  },
  gitee: {
    label: "Gitee",
    description: "Gitee (码云). Identity matches login, id or email.",
    docsUrl: "https://gitee.com/oauth/applications",
    scope: "user_info",
    fields: [],
    token: { body: "form" },
    endpoints: () => ({
      authorizeUrl: "https://gitee.com/oauth/authorize",
      tokenUrl: "https://gitee.com/oauth/token",
      userInfoUrl: "https://gitee.com/api/v5/user"
    }),
    profile: (user) => {
      const login = String(user.login ?? user.id ?? "");
      return {
        id: login,
        name: String(user.name ?? login),
        identifiers: [login, user.id === void 0 ? "" : String(user.id), String(user.email ?? "")].filter(Boolean)
      };
    }
  },
  microsoft: {
    label: "Microsoft",
    description: "Microsoft Entra ID (Azure AD). Identity matches sub, email or user principal name.",
    docsUrl: "https://entra.microsoft.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade",
    scope: "openid email profile",
    fields: [
      {
        key: "tenant",
        label: "Tenant",
        type: "text",
        required: true,
        default: "common",
        help: "common, organizations, consumers, or a tenant id."
      }
    ],
    token: { body: "form" },
    endpoints: (config) => {
      const tenant = encodeURIComponent(config.tenant || "common");
      return {
        authorizeUrl: `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/authorize`,
        tokenUrl: `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`,
        userInfoUrl: "https://graph.microsoft.com/oidc/userinfo"
      };
    },
    profile: (user) => ({
      id: String(user.sub ?? ""),
      name: String(user.email ?? user.preferred_username ?? user.name ?? user.sub ?? ""),
      identifiers: [user.sub, user.email, user.preferred_username].filter(Boolean).map(String)
    })
  },
  discord: {
    label: "Discord",
    description: "Discord OAuth2. Identity matches username or id.",
    docsUrl: "https://discord.com/developers/applications",
    scope: "identify email",
    fields: [],
    token: { body: "form" },
    endpoints: () => ({
      authorizeUrl: "https://discord.com/oauth2/authorize",
      tokenUrl: "https://discord.com/api/oauth2/token",
      userInfoUrl: "https://discord.com/api/users/@me"
    }),
    profile: (user) => {
      const login = String(user.username ?? user.id ?? "");
      return {
        id: login,
        name: String(user.global_name ?? login),
        identifiers: [login, user.id === void 0 ? "" : String(user.id), String(user.email ?? "")].filter(Boolean)
      };
    }
  },
  slack: {
    label: "Slack",
    description: "Slack OpenID Connect. Identity matches sub or email.",
    docsUrl: "https://api.slack.com/apps",
    scope: "openid email profile",
    fields: [],
    token: { body: "form" },
    endpoints: () => ({
      authorizeUrl: "https://slack.com/openid/connect/authorize",
      tokenUrl: "https://slack.com/api/openid.connect.token",
      userInfoUrl: "https://slack.com/api/openid.connect.userInfo"
    }),
    profile: (user) => ({
      id: String(user.sub ?? ""),
      name: String(user.email ?? user.name ?? user.sub ?? ""),
      identifiers: [user.sub, user.email].filter(Boolean).map(String)
    })
  },
  feishu: {
    label: "飞书 / Lark",
    description: "Feishu / Lark web sign-in. Supports one-click app creation by QR code.",
    docsUrl: "https://open.feishu.cn/app",
    scope: "",
    fields: [
      {
        key: "brand",
        label: "Edition",
        type: "select",
        default: "feishu",
        options: [
          { value: "feishu", label: "Feishu (feishu.cn)" },
          { value: "lark", label: "Lark (larksuite.com)" }
        ]
      },
      {
        key: "scope",
        label: "Scope (optional)",
        type: "text",
        placeholder: "contact:contact.base:readonly",
        help: "Add a scope after granting the matching permission in the developer console."
      }
    ],
    token: { body: "json" },
    endpoints: (config) => config.brand === "lark" ? {
      authorizeUrl: "https://accounts.larksuite.com/open-apis/authen/v1/authorize",
      tokenUrl: "https://open.larksuite.com/open-apis/authen/v2/oauth/token",
      userInfoUrl: "https://open.larksuite.com/open-apis/authen/v1/user_info"
    } : {
      authorizeUrl: "https://accounts.feishu.cn/open-apis/authen/v1/authorize",
      tokenUrl: "https://open.feishu.cn/open-apis/authen/v2/oauth/token",
      userInfoUrl: "https://open.feishu.cn/open-apis/authen/v1/user_info"
    },
    profile: (user) => {
      const data = user.data ?? user;
      const id = String(data.open_id ?? data.sub ?? data.union_id ?? data.user_id ?? "");
      return {
        id,
        name: String(data.name ?? data.en_name ?? data.email ?? id),
        identifiers: [data.open_id, data.sub, data.union_id, data.user_id, data.email, data.enterprise_email].filter(Boolean).map(String)
      };
    }
  },
  keycloak: {
    label: "Keycloak / OIDC",
    description: "Any standard OIDC issuer (Keycloak, Auth0, Okta…). Endpoints are discovered from the issuer.",
    scope: "openid email profile",
    discover: true,
    fields: [
      {
        key: "issuer",
        label: "Issuer",
        type: "url",
        required: true,
        placeholder: "https://keycloak.example.com/realms/main",
        help: "Reads <issuer>/.well-known/openid-configuration."
      }
    ],
    token: { body: "form" },
    endpoints: () => ({ authorizeUrl: "", tokenUrl: "", userInfoUrl: "" }),
    profile: (user) => ({
      id: String(user.sub ?? ""),
      name: String(user.email ?? user.preferred_username ?? user.name ?? user.sub ?? ""),
      identifiers: [user.sub, user.email, user.preferred_username].filter(Boolean).map(String)
    })
  },
  custom: {
    hidden: true,
    label: "Custom OIDC (legacy)",
    description: "Legacy hand-written endpoints, kept only for configuration compatibility.",
    scope: "openid email profile",
    fields: [
      { key: "authorizeUrl", label: "Authorization URL", type: "url", required: true },
      { key: "tokenUrl", label: "Token URL", type: "url", required: true },
      { key: "userInfoUrl", label: "UserInfo URL", type: "url", required: true }
    ],
    token: { body: "form" },
    endpoints: (config) => ({
      authorizeUrl: config.authorizeUrl,
      tokenUrl: config.tokenUrl,
      userInfoUrl: config.userInfoUrl
    }),
    profile: (user) => ({
      id: String(user.sub ?? user.login ?? user.id ?? ""),
      name: String(user.email ?? user.login ?? user.preferred_username ?? user.sub ?? ""),
      identifiers: [user.sub, user.login, user.email, user.preferred_username].filter(Boolean).map(String)
    })
  }
};
var ID_PATTERN = /^[a-z0-9][a-z0-9-]{0,31}$/;
function requireUrl(value, label) {
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`${label} is not a valid URL`);
  }
  if (parsed.protocol !== "https:" && !(parsed.protocol === "http:" && parsed.hostname === "127.0.0.1")) {
    throw new Error(`${label} must use https (http is accepted only for 127.0.0.1 mocks)`);
  }
  return parsed.href;
}
function normalizeInstance(raw, previous) {
  const provider = String(raw.provider ?? raw.type ?? "").trim();
  const entry = CATALOG[provider];
  if (entry === void 0) throw new Error(`unknown provider ${JSON.stringify(provider)}`);
  const config = {};
  const rawConfig = raw.config ?? {};
  for (const field of entry.fields) {
    let value = rawConfig[field.key];
    if (value === void 0 || value === null || value === "") value = field.default ?? "";
    let text = String(value).trim();
    if (field.required && !text) throw new Error(`${entry.label}: ${field.label} is required`);
    if (text && field.type === "url") text = requireUrl(text, `${entry.label} ${field.label}`);
    config[field.key] = text;
  }
  const clientId = String(raw.clientId ?? "").trim();
  if (!clientId) throw new Error(`${entry.label}: Client ID is required`);
  const clientSecret = String(raw.clientSecret ?? "").trim() || (previous?.clientSecret ?? "");
  if (!clientSecret) throw new Error(`${entry.label}: Client Secret is required`);
  const allowedSubjects = Array.isArray(raw.allowedSubjects) ? raw.allowedSubjects.map((value) => String(value).trim()).filter(Boolean) : [];
  if (allowedSubjects.length === 0) throw new Error(`${entry.label}: at least one allowed account is required`);
  const id = provider;
  if (!ID_PATTERN.test(id)) throw new Error(`invalid provider id ${JSON.stringify(id)}`);
  return {
    id,
    provider,
    label: String(raw.label ?? "").trim() || entry.label,
    enabled: raw.enabled !== false,
    clientId,
    clientSecret,
    config,
    allowedSubjects,
    scope: String(rawScope(raw, config) ?? "").trim() || entry.scope
  };
}
function rawScope(raw, config) {
  const value = config.scope ?? raw.scope;
  return value === void 0 ? void 0 : String(value);
}
function legacyInstance(rawConfig) {
  const clientId = typeof rawConfig?.clientId === "string" ? rawConfig.clientId.trim() : "";
  if (!clientId) return null;
  return {
    id: "github",
    provider: "github",
    label: "GitHub",
    enabled: true,
    clientId,
    clientSecret: typeof rawConfig?.clientSecret === "string" && rawConfig.clientSecret ? rawConfig.clientSecret : process.env.OAUTH_GITHUB_CLIENT_SECRET ?? "",
    config: {},
    allowedSubjects: Array.isArray(rawConfig?.allowedLogins) ? rawConfig.allowedLogins.map((entry) => String(entry).trim()).filter(Boolean) : [],
    scope: "read:user"
  };
}
function publicCatalog(overrides = {}) {
  return Object.entries(CATALOG).filter(([, entry]) => entry.hidden !== true).map(([id, entry]) => {
    const copy = overrides[id];
    return {
      id,
      label: copy?.label ?? entry.label,
      description: copy?.description ?? entry.description,
      docsUrl: entry.docsUrl ?? "",
      scope: entry.scope,
      fields: entry.fields.map((field) => ({
        ...field,
        label: copy?.fields?.[field.key]?.label ?? field.label,
        help: copy?.fields?.[field.key]?.help ?? field.help
      }))
    };
  });
}
async function resolveEndpoints(instance) {
  const entry = CATALOG[instance.provider];
  if (entry === void 0) throw new Error(`unknown provider ${instance.provider}`);
  if (entry.discover === true) {
    const endpoints = await discoverEndpoints(instance.config.issuer);
    return { ...endpoints, scope: instance.scope };
  }
  return { ...entry.endpoints(instance.config), scope: instance.scope };
}
var DISCOVERY_TTL_MS = 10 * 60 * 1e3;
var discoveryCache = /* @__PURE__ */ new Map();
async function discoverEndpoints(issuer) {
  const cached = discoveryCache.get(issuer);
  if (cached !== void 0 && Date.now() - cached.at < DISCOVERY_TTL_MS) return cached.endpoints;
  const base = issuer.endsWith("/") ? issuer : `${issuer}/`;
  const response = await fetch(`${base}.well-known/openid-configuration`, {
    headers: { accept: "application/json", "user-agent": "dsh-oauth-github" }
  });
  if (!response.ok) throw new Error(`discovery returned HTTP ${response.status}`);
  const document = await response.json();
  if (typeof document.authorization_endpoint !== "string" || typeof document.token_endpoint !== "string") {
    throw new Error("discovery document lacks authorization_endpoint or token_endpoint");
  }
  const endpoints = {
    authorizeUrl: document.authorization_endpoint,
    tokenUrl: document.token_endpoint,
    userInfoUrl: typeof document.userinfo_endpoint === "string" ? document.userinfo_endpoint : ""
  };
  discoveryCache.set(issuer, { at: Date.now(), endpoints });
  return endpoints;
}
function profileOf(instance, user) {
  const entry = CATALOG[instance.provider];
  if (entry === void 0) throw new Error(`unknown provider ${instance.provider}`);
  return entry.profile(user);
}

// src/copy.ts
var EN = {
  loginTitle: "Sign in to DeepSeek Harness",
  loginIntro: "Continue with a third-party account.",
  loginWith: "Continue with",
  noneConfigured: "No third-party sign-in method is enabled.",
  otherMethods: "Other methods:",
  nativeLogin: "Local token / device pairing",
  loginCancelled: "Sign-in was cancelled.",
  loginFailed: "Sign-in failed. Try again.",
  retryLogin: "Sign in again",
  providerUnavailableTitle: "Sign-in method unavailable",
  providerUnavailableDetail: "This sign-in method is not enabled.",
  stateFailedTitle: "Sign-in state check failed",
  stateFailedDetail: "This sign-in request expired or did not start here. Please sign in again.",
  exchangeFailedTitle: "Third-party verification failed",
  exchangeFailedDetail: "The third-party authorization could not be completed. Try again later.",
  noIdentityTitle: "Third-party verification failed",
  noIdentityDetail: "The third-party account returned no usable identity.",
  deniedTitle: "Account not allowed",
  deniedDetail: (provider, subject) => `The ${provider} account ${subject} is not in the allowlist.`,
  misconfiguredTitle: "Sign-in method misconfigured",
  misconfiguredDetail: "The endpoints for this sign-in method could not be resolved. Check its configuration."
};
var ZH = {
  loginTitle: "登录 DeepSeek Harness",
  loginIntro: "使用第三方账号验证身份后进入。",
  loginWith: "使用以下方式登录：",
  noneConfigured: "尚未启用第三方登录方式。",
  otherMethods: "其他方式：",
  nativeLogin: "本机 Token / 设备配对",
  loginCancelled: "登录已取消。",
  loginFailed: "登录失败，请重试。",
  retryLogin: "重新登录",
  providerUnavailableTitle: "登录方式不可用",
  providerUnavailableDetail: "该登录方式未启用。",
  stateFailedTitle: "登录状态校验失败",
  stateFailedDetail: "这次登录请求已过期或不是从本站发起的，请重新登录。",
  exchangeFailedTitle: "第三方验证失败",
  exchangeFailedDetail: "无法完成第三方授权，请稍后重试。",
  noIdentityTitle: "第三方验证失败",
  noIdentityDetail: "第三方账号没有返回可用的身份标识。",
  deniedTitle: "账号不允许登录",
  deniedDetail: (provider, subject) => `${provider} 账号 ${subject} 不在允许列表中。`,
  misconfiguredTitle: "登录方式配置有误",
  misconfiguredDetail: "无法解析该登录方式的端点，请检查配置。"
};
var EN_PROVIDERS = {};
var ZH_PROVIDERS = {
  github: {
    label: "GitHub",
    description: "GitHub OAuth App；身份取 login、id 或 email，任一匹配白名单即可。"
  },
  google: {
    label: "Google",
    description: "Google OAuth 客户端；身份取 sub 或 email。"
  },
  gitlab: {
    label: "GitLab",
    description: "GitLab.com 或自建实例；身份取 username、id 或 email。",
    fields: { baseUrl: { label: "GitLab 地址", help: "自建实例填自己的域名。" } }
  },
  gitee: {
    label: "Gitee",
    description: "Gitee 码云；身份取 login、id 或 email。"
  },
  microsoft: {
    label: "Microsoft",
    description: "Microsoft Entra ID（Azure AD）；身份取 sub、email 或 UPN。",
    fields: { tenant: { label: "Tenant", help: "common、organizations、consumers 或具体 tenant id。" } }
  },
  discord: {
    label: "Discord",
    description: "Discord OAuth2；身份取 username 或 id。"
  },
  slack: {
    label: "Slack",
    description: "Slack OpenID Connect；身份取 sub 或 email。"
  },
  feishu: {
    label: "飞书 / Lark",
    description: "飞书 / Lark 网页登录，支持扫码一键创建应用。",
    fields: {
      brand: { label: "版本" },
      scope: { label: "Scope（可选）", help: "需要邮箱等字段时，先在开放平台申请对应权限再填 scope。" }
    }
  },
  keycloak: {
    label: "Keycloak / OIDC",
    description: "任意标准 OIDC（Keycloak、Auth0、Okta…），填 issuer 自动发现端点。",
    fields: { issuer: { label: "Issuer", help: "读取 <issuer>/.well-known/openid-configuration。" } }
  }
};
function providerCopy(locale) {
  return locale === "zh" ? ZH_PROVIDERS : EN_PROVIDERS;
}
function hostLocale(acceptLanguage) {
  return acceptLanguage?.toLowerCase().startsWith("zh") === true ? "zh" : "en";
}
function hostText(locale) {
  return locale === "zh" ? ZH : EN;
}

// src/store.ts
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { randomBytes } from "node:crypto";
var STATE_DIR = "oauth-github";
function harnessHome() {
  return process.env.DSH_HOME?.trim() || join(homedir(), ".dsh");
}
function providersPath() {
  return join(harnessHome(), STATE_DIR, "providers.json");
}
function secretPath() {
  return join(harnessHome(), STATE_DIR, "secret");
}
function loadSecret(configured) {
  if (typeof configured === "string" && configured.length >= 32) return Buffer.from(configured, "utf8");
  try {
    const stored = readFileSync(secretPath(), "utf8").trim();
    if (stored.length >= 32) return Buffer.from(stored, "utf8");
  } catch {
  }
  mkdirSync(join(harnessHome(), STATE_DIR), { recursive: true, mode: 448 });
  const generated = randomBytes(48).toString("base64url");
  writeFileSync(secretPath(), `${generated}
`, { mode: 384 });
  return Buffer.from(generated, "utf8");
}
function loadInstances(config) {
  try {
    const parsed = JSON.parse(readFileSync(providersPath(), "utf8"));
    const list = Array.isArray(parsed.providers) ? parsed.providers : [];
    const migrated = list.map((entry) => {
      if (entry.provider === void 0 && entry.type === "oidc") {
        return {
          ...entry,
          provider: "custom",
          config: {
            authorizeUrl: entry.authorizeUrl,
            tokenUrl: entry.tokenUrl,
            userInfoUrl: entry.userInfoUrl
          }
        };
      }
      if (entry.provider === void 0 && entry.type !== void 0) return { ...entry, provider: entry.type };
      return entry;
    });
    return migrated.map((entry) => normalizeInstance(entry));
  } catch (error) {
    const code = error.code;
    if (code !== "ENOENT") {
      console.warn(`dsh-oauth-github: ignoring unreadable providers.json: ${String(error)}`);
    }
  }
  const legacy = legacyInstance(config);
  return legacy === null ? [] : [legacy];
}
function persistInstances(instances) {
  mkdirSync(join(harnessHome(), STATE_DIR), { recursive: true, mode: 448 });
  const target = providersPath();
  const temp = `${target}.${process.pid}.tmp`;
  writeFileSync(temp, `${JSON.stringify({ version: 2, providers: instances }, null, 2)}
`, { mode: 384 });
  renameSync(temp, target);
}

// src/util.ts
import { createHmac, timingSafeEqual } from "node:crypto";
var FETCH_TIMEOUT_MS = 15e3;
function b64url(value) {
  return Buffer.from(value).toString("base64url");
}
function sign(text, secret) {
  return createHmac("sha256", secret).update(text).digest("base64url");
}
function signatureValid(text, secret) {
  const dot = text.lastIndexOf(".");
  if (dot < 0) return false;
  const expected = Buffer.from(sign(text.slice(0, dot), secret), "utf8");
  const actual = Buffer.from(text.slice(dot + 1), "utf8");
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
function encodeSigned(payload, secret) {
  const body = `v1.${b64url(JSON.stringify(payload))}`;
  return `${body}.${sign(body, secret)}`;
}
function decodeSigned(value, secret) {
  if (!value.startsWith("v1.") || !signatureValid(value, secret)) return void 0;
  const dot = value.lastIndexOf(".");
  try {
    const parsed = JSON.parse(Buffer.from(value.slice(3, dot), "base64url").toString("utf8"));
    if (typeof parsed.exp !== "number" || parsed.exp <= Date.now()) return void 0;
    return parsed;
  } catch {
    return void 0;
  }
}
function headerValue(headers, key) {
  if (headers === void 0 || headers === null) return void 0;
  const candidate = headers;
  if (typeof candidate.get === "function") return candidate.get(key) ?? void 0;
  const record = headers;
  const direct = record[key] ?? record[key.toLowerCase()];
  if (Array.isArray(direct)) return direct.join(", ");
  return typeof direct === "string" ? direct : void 0;
}
function readCookie(header, name2) {
  if (typeof header !== "string") return void 0;
  for (const part of header.split(";")) {
    const index = part.indexOf("=");
    if (index < 0 || part.slice(0, index).trim() !== name2) continue;
    try {
      return decodeURIComponent(part.slice(index + 1).trim());
    } catch {
      return void 0;
    }
  }
  return void 0;
}
function cookie(name2, value, options) {
  const parts = [`${name2}=${encodeURIComponent(value)}`, `Path=${options.path}`, "HttpOnly", "SameSite=Lax"];
  if (options.maxAgeSeconds !== void 0) parts.push(`Max-Age=${Math.floor(options.maxAgeSeconds)}`);
  if (options.secure) parts.push("Secure");
  return parts.join("; ");
}
function escapeHtml(value) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}
async function fetchWithTimeout(url, init = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

// src/index.ts
var name = "oauth-github";
var inject = ["connection", "connection.authentication", "webServer", "webApp"];
var SESSION_COOKIE = "dsh_oauth_session";
var STATE_COOKIE = "dsh_oauth_state";
var STATE_TTL_MS = 10 * 60 * 1e3;
var LOG_PREFIX = "oauth-github";
var MAX_BODY_BYTES = 64 * 1024;
var PAGE_STYLE = `
:root{color-scheme:light dark;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC','Hiragino Sans GB','Microsoft YaHei','Helvetica Neue',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;background:light-dark(#fafafa,#171717);color:light-dark(#222,#eee)}
body{margin:0;min-height:100dvh;display:flex;align-items:center;justify-content:center;padding:24px 16px;box-sizing:border-box}
main{box-sizing:border-box;width:100%;max-width:360px;padding:24px;border:.5px solid color-mix(in srgb,currentColor 16%,transparent);border-radius:12px;background:light-dark(#fff,#232324);display:flex;flex-direction:column;gap:14px}
h1{margin:0;font-size:20px;line-height:1.3;font-weight:500}
p{margin:0;font-size:14px;line-height:1.5;overflow-wrap:anywhere;color:color-mix(in srgb,currentColor 72%,transparent)}
a.button{display:block;box-sizing:border-box;min-height:44px;padding:10px 12px;border-radius:8px;text-align:center;text-decoration:none;font-size:14px;font-weight:500;color:light-dark(#fff,#222);background:light-dark(#222,#eee)}
a.secondary{font-size:13px;color:inherit;text-underline-offset:3px}
`;
function jsonResponse(status, payload, extra = {}) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...extra }
  });
}
function loginPage(basePath, instances, message, acceptLanguage) {
  const t = hostText(hostLocale(acceptLanguage));
  const notice = message ? `<p style="color:light-dark(#a10c0c,#ffb3b3)" role="alert">${escapeHtml(message)}</p>` : "";
  const buttons = instances.map(
    (instance) => `<a class="button" href="${escapeHtml(`${basePath}oauth/${instance.id}/start`)}">${escapeHtml(`${t.loginWith} ${instance.label}`)}</a>`
  ).join("");
  const none = instances.length === 0 ? `<p>${t.noneConfigured}</p>` : "";
  return `<!doctype html><html lang="${hostLocale(acceptLanguage)}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="referrer" content="no-referrer"><meta name="robots" content="noindex"><title>${t.loginTitle}</title><style>${PAGE_STYLE}</style></head><body><main><h1>${t.loginTitle}</h1><p>${t.loginIntro}</p>${notice}${buttons}${none}<p>${t.otherMethods} <a class="secondary" href="${escapeHtml(basePath)}?login=page">${t.nativeLogin}</a></p></main></body></html>`;
}
function errorPage(status, title, detail, basePath, acceptLanguage) {
  const t = hostText(hostLocale(acceptLanguage));
  const html = `<!doctype html><html lang="${hostLocale(acceptLanguage)}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="referrer" content="no-referrer"><meta name="robots" content="noindex"><title>${escapeHtml(title)}</title><style>${PAGE_STYLE}</style></head><body><main><h1>${escapeHtml(title)}</h1><p>${escapeHtml(detail)}</p><a class="secondary" href="${escapeHtml(basePath)}oauth/login">${t.retryLogin}</a></main></body></html>`;
  return new Response(html, {
    status,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff"
    }
  });
}
async function readBody(request) {
  let size = 0;
  const chunks = [];
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.length;
    if (size > MAX_BODY_BYTES) throw new Error("body too large");
    chunks.push(buffer);
  }
  return Buffer.concat(chunks).toString("utf8");
}
function sendJson(response, status, payload) {
  response.writeHead(status, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
  response.end(JSON.stringify(payload));
}
function apply(ctx, config = {}) {
  const secret = loadSecret(config.cookieSecret);
  const peer = ctx.connection.createPeer({ principal: { kind: "owner" } });
  const advertised = new URL(ctx.webApp.getAdvertisedUrl() || ctx.webServer.getOrigin());
  const basePath = advertised.pathname.endsWith("/") ? advertised.pathname : `${advertised.pathname}/`;
  const secure = ctx.webServer.protocol === "https:" || advertised.protocol === "https:";
  const maxAgeDays = Number.isFinite(Number(config.cookieMaxAgeDays)) && Number(config.cookieMaxAgeDays) > 0 ? Number(config.cookieMaxAgeDays) : 30;
  const maxAgeSeconds = Math.floor(maxAgeDays * 24 * 60 * 60);
  let instances = (() => {
    try {
      return loadInstances(config);
    } catch (error) {
      console.warn(`${LOG_PREFIX}: bad providers config: ${String(error)}`);
      return [];
    }
  })();
  const enabled = () => instances.filter((instance) => instance.enabled);
  const byId = (id) => instances.find((instance) => instance.id === id);
  const callbackUrl = (id) => new URL(`${basePath}oauth/${id}/callback`, advertised.origin).href;
  const language = (headers) => headerValue(headers, "accept-language");
  const session = (headers) => {
    const raw = readCookie(headerValue(headers, "cookie"), SESSION_COOKIE);
    if (raw === void 0) return void 0;
    const parsed = decodeSigned(raw, secret);
    if (parsed === void 0 || typeof parsed.p !== "string") return void 0;
    const instance = byId(parsed.p);
    if (instance === void 0 || !instance.enabled) return void 0;
    const allowed = new Set(instance.allowedSubjects.map((value) => value.toLowerCase()));
    const identifiers = Array.isArray(parsed.ids) ? parsed.ids : [String(parsed.s ?? "")];
    return identifiers.some((value) => allowed.has(String(value).toLowerCase())) ? parsed : void 0;
  };
  ctx.effect(
    () => ctx.connection.authentication.register({
      authenticate(request) {
        return session(request.headers) === void 0 ? void 0 : peer;
      }
    }),
    `${LOG_PREFIX}: authentication provider`
  );
  ctx.on("webserver/request", async (request, response, next) => {
    const url = new URL(request.url ?? "/", "http://dsh.invalid");
    if (url.pathname !== "/" || request.method !== "GET" && request.method !== "HEAD") return next();
    if (url.searchParams.has("token") || url.searchParams.has("login")) return next();
    if (enabled().length === 0) return next();
    let admitted = false;
    try {
      admitted = "peer" in ctx.connection.authentication.authenticate({
        headers: request.headers,
        method: request.method,
        url
      });
    } catch {
      admitted = false;
    }
    if (admitted) return next();
    response.writeHead(302, { location: `${basePath}oauth/login`, "cache-control": "no-store" });
    response.end();
  });
  ctx.effect(
    () => ctx.webServer.register({
      kind: "exact",
      path: "/oauth/providers",
      auth: "required",
      handler: async (request, response) => {
        if (request.method === "GET") {
          const locale = hostLocale(language(request.headers));
          sendJson(response, 200, {
            catalog: publicCatalog(providerCopy(locale)),
            providers: instances.map((instance) => {
              const { clientSecret, ...rest } = instance;
              return { ...rest, hasSecret: Boolean(clientSecret) };
            })
          });
          return;
        }
        if (request.method !== "POST") {
          sendJson(response, 405, { error: "method not allowed" });
          return;
        }
        let body;
        try {
          body = JSON.parse(await readBody(request));
        } catch (error) {
          sendJson(response, 400, { error: error instanceof Error ? error.message : "invalid JSON" });
          return;
        }
        if (!Array.isArray(body.providers)) {
          sendJson(response, 400, { error: "providers must be an array" });
          return;
        }
        try {
          const seen = /* @__PURE__ */ new Set();
          const next = body.providers.map((entry) => {
            const previous = typeof entry.id === "string" ? byId(entry.id) : void 0;
            const normalized = normalizeInstance(entry, previous);
            if (seen.has(normalized.id)) throw new Error(`duplicate provider ${normalized.id}`);
            seen.add(normalized.id);
            return normalized;
          });
          persistInstances(next);
          instances = next;
          console.info(
            `${LOG_PREFIX}: providers updated (${next.map((item) => `${item.id}:${item.enabled ? "on" : "off"}`).join(", ") || "none"})`
          );
          sendJson(response, 200, { ok: true, enabled: next.filter((item) => item.enabled).map((item) => item.id) });
        } catch (error) {
          sendJson(response, 400, { error: error instanceof Error ? error.message : "invalid providers" });
        }
      }
    }),
    `${LOG_PREFIX}: providers API`
  );
  ctx.effect(
    () => ctx.webServer.register({
      kind: "exact",
      path: "/oauth/session",
      auth: "required",
      resource: async (request) => {
        const current = session(request.headers);
        if (current === void 0) return jsonResponse(200, { native: true });
        const instance = byId(current.p);
        return jsonResponse(200, {
          provider: current.p,
          label: instance ? instance.label : current.p,
          subject: current.s,
          name: current.n ?? current.s,
          expiresAt: current.exp
        });
      }
    }),
    `${LOG_PREFIX}: session route`
  );
  const REGISTRATION = {
    feishu: process.env.OAUTH_FEISHU_REGISTRATION_URL || "https://accounts.feishu.cn/oauth/v1/app/registration",
    lark: process.env.OAUTH_LARK_REGISTRATION_URL || "https://accounts.larksuite.com/oauth/v1/app/registration"
  };
  const OPEN_BASE = {
    feishu: process.env.OAUTH_FEISHU_OPEN_BASE || "https://open.feishu.cn",
    lark: process.env.OAUTH_LARK_OPEN_BASE || "https://open.larksuite.com"
  };
  const registrations = /* @__PURE__ */ new Map();
  const registrationCall = async (brand, form) => {
    const response = await fetchWithTimeout(REGISTRATION[brand], {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        accept: "application/json",
        "user-agent": LOG_PREFIX
      },
      body: new URLSearchParams(form).toString()
    });
    const body = await response.json().catch(() => ({}));
    return { ok: response.ok, body };
  };
  ctx.effect(
    () => ctx.webServer.register({
      kind: "exact",
      path: "/oauth/register/start",
      auth: "required",
      handler: async (request, response) => {
        if (request.method !== "POST") {
          sendJson(response, 405, { error: "method not allowed" });
          return;
        }
        let brand = "feishu";
        try {
          const body = JSON.parse(await readBody(request) || "{}");
          brand = body.brand === "lark" ? "lark" : "feishu";
        } catch {
          brand = "feishu";
        }
        try {
          const { ok, body } = await registrationCall(brand, {
            action: "begin",
            archetype: "PersonalAgent",
            auth_method: "client_secret",
            request_user_info: "open_id tenant_brand"
          });
          if (!ok || typeof body.device_code !== "string") {
            sendJson(response, 502, {
              error: String(body.error_description ?? body.error ?? "registration begin failed")
            });
            return;
          }
          const id = randomBytes2(18).toString("base64url");
          const interval = Number(body.interval) > 0 ? Number(body.interval) : 5;
          const expiresIn = Number(body.expires_in) > 0 ? Number(body.expires_in) : 300;
          registrations.set(id, {
            deviceCode: body.device_code,
            brand,
            interval,
            expiresAt: Date.now() + expiresIn * 1e3
          });
          sendJson(response, 200, {
            id,
            brand,
            userCode: body.user_code ?? "",
            verificationUri: body.verification_uri_complete ?? body.verification_uri ?? "",
            expiresIn,
            interval
          });
        } catch (error) {
          sendJson(response, 502, {
            error: `registration begin failed: ${error instanceof Error ? error.message : String(error)}`
          });
        }
      }
    }),
    `${LOG_PREFIX}: register start`
  );
  ctx.effect(
    () => ctx.webServer.register({
      kind: "exact",
      path: "/oauth/register/poll",
      auth: "required",
      resource: async (request) => {
        const id = new URL(request.url).searchParams.get("id") ?? "";
        const state = registrations.get(id);
        if (state === void 0) return jsonResponse(200, { status: "expired" });
        if (Date.now() > state.expiresAt) {
          registrations.delete(id);
          return jsonResponse(200, { status: "expired" });
        }
        try {
          const { body } = await registrationCall(state.brand, { action: "poll", device_code: state.deviceCode });
          if (typeof body.client_id === "string" && typeof body.client_secret === "string" && body.client_secret) {
            registrations.delete(id);
            const info2 = body.user_info ?? {};
            const brand = info2.tenant_brand === "lark" ? "lark" : state.brand;
            return jsonResponse(200, {
              status: "ready",
              clientId: body.client_id,
              clientSecret: body.client_secret,
              brand
            });
          }
          const code = body.error ?? body.code;
          if (code === "authorization_pending" || code === "pending") {
            return jsonResponse(200, { status: "pending", interval: state.interval });
          }
          if (code === "slow_down") {
            state.interval = Math.min(60, state.interval + 5);
            return jsonResponse(200, { status: "slow_down", interval: state.interval });
          }
          if (code === "access_denied") {
            registrations.delete(id);
            return jsonResponse(200, { status: "denied" });
          }
          if (code === "expired_token") {
            registrations.delete(id);
            return jsonResponse(200, { status: "expired" });
          }
          const info = body.user_info ?? {};
          if (info.tenant_brand === "lark" && state.brand === "feishu") {
            state.brand = "lark";
            return jsonResponse(200, { status: "pending", interval: state.interval, brand: "lark" });
          }
          return jsonResponse(200, {
            status: "error",
            error: String(body.error_description ?? body.msg ?? "registration poll failed")
          });
        } catch (error) {
          return jsonResponse(200, {
            status: "error",
            error: `registration poll failed: ${error instanceof Error ? error.message : String(error)}`
          });
        }
      }
    }),
    `${LOG_PREFIX}: register poll`
  );
  const probeRedirect = async (brand, appId, redirectUrl) => {
    const endpoints = CATALOG.feishu.endpoints({ brand });
    const target = new URL(endpoints.authorizeUrl);
    target.searchParams.set("client_id", appId);
    target.searchParams.set("redirect_uri", redirectUrl);
    target.searchParams.set("state", "preflight");
    target.searchParams.set("response_type", "code");
    const response = await fetchWithTimeout(target.href, {
      headers: { "user-agent": LOG_PREFIX, accept: "text/html" }
    });
    const text = await response.text().catch(() => "");
    return { ok: !/20029/.test(text) && !/Invalid redirect URL/i.test(text), status: response.status };
  };
  ctx.effect(
    () => ctx.webServer.register({
      kind: "exact",
      path: "/oauth/feishu/preflight",
      auth: "required",
      handler: async (request, response) => {
        if (request.method !== "POST") {
          sendJson(response, 405, { error: "method not allowed" });
          return;
        }
        let body;
        try {
          body = JSON.parse(await readBody(request) || "{}");
        } catch {
          sendJson(response, 400, { error: "invalid JSON" });
          return;
        }
        const instance = typeof body.id === "string" ? byId(body.id) : void 0;
        const appId = String(body.appId ?? instance?.clientId ?? "").trim();
        const brand = (body.brand ?? instance?.config.brand) === "lark" ? "lark" : "feishu";
        const apply2 = body.apply === true;
        const redirectUrl = callbackUrl(instance ? instance.id : "feishu");
        const checks = [];
        let token = "";
        try {
          const appSecret = String(body.appSecret || (instance ? instance.clientSecret : "") || "").trim();
          if (!appId || !appSecret) throw new Error("missing App ID / App Secret");
          const tokenResponse = await fetchWithTimeout(
            `${OPEN_BASE[brand]}/open-apis/auth/v3/tenant_access_token/internal`,
            {
              method: "POST",
              headers: { "content-type": "application/json", accept: "application/json", "user-agent": LOG_PREFIX },
              body: JSON.stringify({ app_id: appId, app_secret: appSecret })
            }
          );
          const tokenBody = await tokenResponse.json().catch(() => ({}));
          if (tokenBody.code === 0 && typeof tokenBody.tenant_access_token === "string") {
            token = tokenBody.tenant_access_token;
            checks.push({
              id: "credentials",
              label: "App ID / Secret",
              status: "ok",
              detail: "tenant_access_token acquired"
            });
          } else {
            checks.push({
              id: "credentials",
              label: "App ID / Secret",
              status: "fail",
              detail: `token exchange failed (${String(tokenBody.code)}): ${String(tokenBody.msg ?? "unknown")}`
            });
          }
        } catch (error) {
          checks.push({
            id: "credentials",
            label: "App ID / Secret",
            status: "fail",
            detail: error instanceof Error ? error.message : String(error)
          });
        }
        let redirectOk = false;
        try {
          const probe = await probeRedirect(brand, appId, redirectUrl);
          redirectOk = probe.ok;
          checks.push(
            redirectOk ? {
              id: "redirect",
              label: "Web app / redirect URL",
              status: "ok",
              detail: "the authorize page accepts this redirect_uri"
            } : {
              id: "redirect",
              label: "Web app / redirect URL",
              status: "missing",
              detail: "Feishu returned 20029: redirect_uri is not registered, or the web app capability is off"
            }
          );
        } catch (error) {
          checks.push({
            id: "redirect",
            label: "Web app / redirect URL",
            status: "unknown",
            detail: `probe failed: ${error instanceof Error ? error.message : String(error)}`
          });
        }
        if (!apply2) {
          checks.push({
            id: "autoConfig",
            label: "Register redirect URL automatically",
            status: "skipped",
            detail: token ? "available" : "credentials unavailable"
          });
        } else if (!token) {
          checks.push({
            id: "autoConfig",
            label: "Register redirect URL automatically",
            status: "fail",
            detail: "credentials unavailable; not attempted"
          });
        } else if (redirectOk) {
          checks.push({
            id: "autoConfig",
            label: "Register redirect URL automatically",
            status: "ok",
            detail: "not needed; configuration already takes effect"
          });
        } else {
          try {
            const patchResponse = await fetchWithTimeout(
              `${OPEN_BASE[brand]}/open-apis/application/v7/applications/${encodeURIComponent(appId)}/config`,
              {
                method: "PATCH",
                headers: {
                  "content-type": "application/json; charset=utf-8",
                  accept: "application/json",
                  authorization: `Bearer ${token}`,
                  "user-agent": LOG_PREFIX
                },
                body: JSON.stringify({ security: { add: { redirect_urls: [redirectUrl] } } })
              }
            );
            const patchBody = await patchResponse.json().catch(() => ({}));
            if (patchBody.code === 0) {
              let rechecked = false;
              for (let attempt = 0; attempt < 3 && !rechecked; attempt += 1) {
                rechecked = (await probeRedirect(brand, appId, redirectUrl).catch(() => ({ ok: false }))).ok;
                if (!rechecked) await new Promise((resolve) => setTimeout(resolve, 1200));
              }
              const redirectCheck = checks.find((check) => check.id === "redirect");
              if (redirectCheck !== void 0) {
                redirectCheck.status = rechecked ? "ok" : "pending";
                redirectCheck.detail = rechecked ? "the authorize page accepts this redirect_uri (written through the API and re-checked)" : "redirect_urls written through the API; the authorize page has not accepted it yet (usually a few seconds; check the web app capability)";
              }
              checks.push({
                id: "autoConfig",
                label: "Register redirect URL automatically",
                status: "ok",
                detail: rechecked ? "added through the API and verified" : "added through the API; verification pending"
              });
            } else {
              const hints = {
                "210035": "this app was not created in the developer console, so the API cannot modify it",
                "210043": "this app was not created in the developer console, so the API cannot modify it",
                "210036": "an app can only modify itself; use its own credentials",
                "99991672": "the app lacks the application:application:patch permission",
                "99991679": "the app lacks the application:application:patch permission"
              };
              const code = String(patchBody.code);
              checks.push({
                id: "autoConfig",
                label: "Register redirect URL automatically",
                status: "fail",
                detail: `${hints[code] ?? String(patchBody.msg ?? "API call failed")} (${code})`
              });
            }
          } catch (error) {
            checks.push({
              id: "autoConfig",
              label: "Register redirect URL automatically",
              status: "fail",
              detail: error instanceof Error ? error.message : String(error)
            });
          }
        }
        const manual = [];
        if (!redirectOk) {
          manual.push('Developer console → App capabilities → make sure "Web app" is added');
          manual.push(`Developer console → Development config → Security settings → Redirect URLs: add ${redirectUrl}`);
          manual.push("Save; redirect URLs take effect without review (publish only if the console asks)");
        }
        sendJson(response, 200, { appId, brand, redirectUrl, checks, manual });
      }
    }),
    `${LOG_PREFIX}: feishu preflight`
  );
  ctx.effect(
    () => ctx.webServer.register({
      kind: "prefix",
      path: "/oauth",
      auth: "anonymous",
      resource: async (request) => {
        const url = new URL(request.url);
        const languageHeader = language(request.headers);
        if (url.pathname === "/oauth/login") {
          const t = hostText(hostLocale(languageHeader));
          const error = url.searchParams.get("error");
          const message = error === "denied" ? t.loginCancelled : error ? t.loginFailed : "";
          return new Response(loginPage(basePath, enabled(), message, languageHeader), {
            status: 200,
            headers: {
              "content-type": "text/html; charset=utf-8",
              "cache-control": "no-store",
              "referrer-policy": "no-referrer",
              "x-content-type-options": "nosniff",
              "content-security-policy": "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'"
            }
          });
        }
        if (url.pathname === "/oauth/base") {
          return jsonResponse(200, {
            origin: advertised.origin,
            basePath,
            callbackTemplate: `${advertised.origin}${basePath}oauth/<id>/callback`
          });
        }
        if (url.pathname === "/oauth/logout") {
          return new Response(null, {
            status: 302,
            headers: {
              location: `${basePath}oauth/login`,
              "cache-control": "no-store",
              "set-cookie": cookie(SESSION_COOKIE, "", { path: basePath, maxAgeSeconds: 0, secure })
            }
          });
        }
        const parts = url.pathname.split("/").filter(Boolean);
        if (parts.length === 3 && parts[2] === "start") {
          const instance = byId(parts[1]);
          if (instance === void 0 || !instance.enabled) {
            const t = hostText(hostLocale(languageHeader));
            return errorPage(404, t.providerUnavailableTitle, t.providerUnavailableDetail, basePath, languageHeader);
          }
          let endpoints;
          try {
            endpoints = await resolveEndpoints(instance);
          } catch (error) {
            console.warn(`${LOG_PREFIX}: ${instance.id} endpoint resolution failed: ${String(error)}`);
            const t = hostText(hostLocale(languageHeader));
            return errorPage(502, t.misconfiguredTitle, t.misconfiguredDetail, basePath, languageHeader);
          }
          const nonce = randomBytes2(32).toString("base64url");
          const target = new URL(endpoints.authorizeUrl);
          target.searchParams.set("client_id", instance.clientId);
          target.searchParams.set("redirect_uri", callbackUrl(instance.id));
          if (endpoints.scope) target.searchParams.set("scope", endpoints.scope);
          target.searchParams.set("state", nonce);
          target.searchParams.set("response_type", "code");
          if (instance.provider === "github") target.searchParams.set("allow_signup", "false");
          const headers = new Headers({ location: target.href, "cache-control": "no-store" });
          headers.append(
            "set-cookie",
            cookie(STATE_COOKIE, `${instance.id}:${nonce}`, {
              path: basePath,
              maxAgeSeconds: Math.floor(STATE_TTL_MS / 1e3),
              secure
            })
          );
          return new Response(null, { status: 302, headers });
        }
        if (parts.length === 3 && parts[2] === "callback") {
          const instance = byId(parts[1]);
          const t = hostText(hostLocale(languageHeader));
          if (instance === void 0 || !instance.enabled) {
            return errorPage(404, t.providerUnavailableTitle, t.providerUnavailableDetail, basePath, languageHeader);
          }
          const error = url.searchParams.get("error");
          if (error !== null) {
            console.info(`${LOG_PREFIX}: authorization denied by ${instance.id} (${error})`);
            return new Response(null, {
              status: 302,
              headers: {
                location: `${basePath}oauth/login?error=denied`,
                "cache-control": "no-store",
                "set-cookie": cookie(STATE_COOKIE, "", { path: basePath, maxAgeSeconds: 0, secure })
              }
            });
          }
          const code = url.searchParams.get("code");
          const state = url.searchParams.get("state");
          const expected = readCookie(headerValue(request.headers, "cookie"), STATE_COOKIE) ?? "";
          const expectedState = expected.startsWith(`${instance.id}:`) ? expected.slice(instance.id.length + 1) : "";
          if (!code || !state || !expectedState || state.length !== expectedState.length || !timingSafeEqual2(Buffer.from(state, "utf8"), Buffer.from(expectedState, "utf8"))) {
            return errorPage(403, t.stateFailedTitle, t.stateFailedDetail, basePath, languageHeader);
          }
          const entry = CATALOG[instance.provider];
          let mapped;
          try {
            const endpoints = await resolveEndpoints(instance);
            const payload = {
              client_id: instance.clientId,
              client_secret: instance.clientSecret,
              code,
              redirect_uri: callbackUrl(instance.id),
              grant_type: "authorization_code"
            };
            const tokenResponse = await fetchWithTimeout(endpoints.tokenUrl, {
              method: "POST",
              headers: entry.token.body === "json" ? { "content-type": "application/json", accept: "application/json", "user-agent": LOG_PREFIX } : {
                "content-type": "application/x-www-form-urlencoded",
                accept: "application/json",
                "user-agent": LOG_PREFIX
              },
              body: entry.token.body === "json" ? JSON.stringify(payload) : new URLSearchParams(payload).toString()
            });
            const tokenBody = await tokenResponse.json();
            const data = tokenBody.data ?? {};
            const accessToken = tokenBody.access_token ?? data.access_token;
            if (!tokenResponse.ok || typeof accessToken !== "string") {
              throw new Error(`token exchange rejected with HTTP ${tokenResponse.status}`);
            }
            const userResponse = await fetchWithTimeout(endpoints.userInfoUrl, {
              headers: {
                authorization: `Bearer ${accessToken}`,
                accept: "application/json",
                "user-agent": LOG_PREFIX
              }
            });
            const userBody = await userResponse.json();
            if (!userResponse.ok || typeof userBody !== "object" || userBody === null) {
              throw new Error(`userinfo rejected with HTTP ${userResponse.status}`);
            }
            mapped = profileOf(instance, userBody);
          } catch (cause) {
            console.warn(`${LOG_PREFIX}: ${instance.id} exchange failed: ${String(cause)}`);
            return errorPage(502, t.exchangeFailedTitle, t.exchangeFailedDetail, basePath, languageHeader);
          }
          if (!mapped.id) {
            return errorPage(502, t.noIdentityTitle, t.noIdentityDetail, basePath, languageHeader);
          }
          const allowed = new Set(instance.allowedSubjects.map((value) => value.toLowerCase()));
          const identifiers = mapped.identifiers.length > 0 ? mapped.identifiers : [mapped.id];
          if (!identifiers.some((value) => allowed.has(String(value).toLowerCase()))) {
            console.warn(
              `${LOG_PREFIX}: rejected ${instance.id} identity ${JSON.stringify(mapped.id)} (not in allowlist)`
            );
            return errorPage(
              403,
              t.deniedTitle,
              t.deniedDetail(instance.label, mapped.id),
              basePath,
              languageHeader
            );
          }
          const headers = new Headers({ location: basePath, "cache-control": "no-store" });
          headers.append(
            "set-cookie",
            cookie(
              SESSION_COOKIE,
              encodeSigned(
                {
                  p: instance.id,
                  s: mapped.id,
                  n: mapped.name || mapped.id,
                  ids: identifiers,
                  exp: Date.now() + maxAgeSeconds * 1e3
                },
                secret
              ),
              { path: basePath, maxAgeSeconds, secure }
            )
          );
          headers.append("set-cookie", cookie(STATE_COOKIE, "", { path: basePath, maxAgeSeconds: 0, secure }));
          console.info(`${LOG_PREFIX}: signed in ${instance.id} as ${JSON.stringify(mapped.id)}`);
          return new Response(null, { status: 302, headers });
        }
        return new Response("not found", { status: 404, headers: { "cache-control": "no-store" } });
      }
    }),
    `${LOG_PREFIX}: login routes`
  );
  ctx.logger?.info?.(`${LOG_PREFIX}: ${enabled().length} provider(s) enabled`);
}
export {
  apply,
  inject,
  name
};
