window.__ModuleLoader__.load({
	id: "@dshj/dsh-oauth-github",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		"use strict";
		var __defProp = Object.defineProperty;
		var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
		var __getOwnPropNames = Object.getOwnPropertyNames;
		var __hasOwnProp = Object.prototype.hasOwnProperty;
		var __export = (target, all) => {
		  for (var name2 in all)
		    __defProp(target, name2, { get: all[name2], enumerable: true });
		};
		var __copyProps = (to, from, except, desc) => {
		  if (from && typeof from === "object" || typeof from === "function") {
		    for (let key of __getOwnPropNames(from))
		      if (!__hasOwnProp.call(to, key) && key !== except)
		        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
		  }
		  return to;
		};
		var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

		// src/client/index.tsx
		var index_exports = {};
		__export(index_exports, {
		  apply: () => apply,
		  inject: () => inject,
		  name: () => name
		});
		module.exports = __toCommonJS(index_exports);
		var import_react = require("react");

		// src/client/locales.ts
		var en = {
		  nav: "OAuth",
		  intro: "Built-in providers: GitHub, Google, GitLab, Gitee, Microsoft, Discord, Slack, Keycloak and Feishu/Lark. Each one only needs a Client ID, a Client Secret and the allowed accounts. Changes apply immediately; configuration lives in $DSH_HOME/oauth-github/providers.json.",
		  currentNative: "Signed in with a local token or device pairing",
		  currentProvider: "Signed in: {provider} · {subject}",
		  logout: "Sign out",
		  secretSaved: "saved",
		  secretMissing: "not set",
		  allowlist: "Allowed accounts: {accounts}",
		  allowlistEmpty: "(empty — everyone is rejected)",
		  edit: "Edit",
		  delete: "Delete",
		  addTitle: "Add an OAuth provider",
		  noCatalogLeft: "Every built-in sign-in method is already added.",
		  formEdit: "Edit {label}",
		  formAdd: "Add {label}",
		  immediate: "Saving applies immediately; no restart is needed.",
		  applyHint: "Entrance: {url}",
		  redirectHint: "Redirect URL (register this with the provider): {url}",
		  displayName: "Display name",
		  clientId: "Client ID",
		  clientSecret: "Client Secret",
		  clientSecretKeep: "Client Secret (already saved; leave empty to keep it)",
		  allowlistLabel: "Allowed accounts (comma separated; username, email or subject)",
		  allowlistPlaceholder: "octocat, me@example.com",
		  save: "Save",
		  cancel: "Cancel",
		  fieldRequired: "{label} is required",
		  errorClientId: "Client ID is required",
		  errorClientSecret: "Client Secret is required",
		  errorAllowlist: "Add at least one allowed account",
		  savedNotice: "Saved; configuration applies immediately",
		  loading: "Loading…",
		  scanTitle: "Create a Feishu app by QR code",
		  scanStart: "Generate QR / open creation page",
		  scanStarting: "Requesting…",
		  scanPending: "Waiting for confirmation in Feishu… (polling automatically)",
		  scanSlowDown: "Feishu asked to slow the polling; still waiting…",
		  scanReady: "App ID and secret received. Review and save to enable.",
		  scanDenied: "You cancelled the app creation.",
		  scanExpired: "The QR code expired; generate a new one.",
		  scanFailed: "Failed: {reason}",
		  preflightCheck: "Check and auto-configure",
		  preflightOnly: "Check only",
		  preflightChecking: "Checking…",
		  preflightFailed: "Check failed: {reason}",
		  checkCredentials: "App ID / Secret",
		  checkRedirect: "Web app / redirect URL",
		  checkAuto: "Register redirect URL automatically",
		  checkOk: "ok",
		  checkMissing: "missing",
		  checkPending: "pending",
		  checkFail: "failed",
		  checkSkipped: "not attempted",
		  checkUnknown: "unknown",
		  manualTitle: "Manual steps required"
		};
		var zh = {
		  nav: "OAuth",
		  intro: "内置 GitHub、Google、GitLab、Gitee、Microsoft、Discord、Slack、Keycloak 和飞书/Lark。每个 provider 只需填 Client ID、Client Secret 和允许的账号。保存后立即生效，配置存放在 $DSH_HOME/oauth-github/providers.json。",
		  currentNative: "当前使用本机 Token / 设备配对登录",
		  currentProvider: "当前登录：{provider} · {subject}",
		  logout: "退出登录",
		  secretSaved: "已保存",
		  secretMissing: "未设置",
		  allowlist: "允许账号：{accounts}",
		  allowlistEmpty: "（空，拒绝所有）",
		  edit: "编辑",
		  delete: "删除",
		  addTitle: "添加 OAuth 提供方",
		  noCatalogLeft: "内置的登录方式都已添加。",
		  formEdit: "编辑 {label}",
		  formAdd: "添加 {label}",
		  immediate: "保存后立即生效，无需重启服务。",
		  applyHint: "申请入口：{url}",
		  redirectHint: "回调地址（填到对方平台）：{url}",
		  displayName: "显示名称",
		  clientId: "Client ID",
		  clientSecret: "Client Secret",
		  clientSecretKeep: "Client Secret（已保存；留空保持不变）",
		  allowlistLabel: "允许的账号（逗号分隔；用户名 / 邮箱 / sub 任一匹配即可）",
		  allowlistPlaceholder: "octocat, me@example.com",
		  save: "保存",
		  cancel: "取消",
		  fieldRequired: "{label} 必填",
		  errorClientId: "Client ID 必填",
		  errorClientSecret: "Client Secret 必填",
		  errorAllowlist: "至少填一个允许的账号",
		  savedNotice: "已保存，配置立即生效",
		  loading: "读取中…",
		  scanTitle: "扫码快速创建飞书应用",
		  scanStart: "生成二维码 / 打开创建页",
		  scanStarting: "正在请求…",
		  scanPending: "等待在飞书中确认创建…（会自动轮询）",
		  scanSlowDown: "飞书要求降低轮询频率，继续等待…",
		  scanReady: "已获取 App ID / Secret，请检查后保存启用。",
		  scanDenied: "你取消了创建。",
		  scanExpired: "二维码已过期，请重新生成。",
		  scanFailed: "失败：{reason}",
		  preflightCheck: "检查并自动配置",
		  preflightOnly: "只检查",
		  preflightChecking: "检查中…",
		  preflightFailed: "检查失败：{reason}",
		  checkCredentials: "App ID / Secret",
		  checkRedirect: "网页应用 / 重定向 URL",
		  checkAuto: "自动登记重定向 URL",
		  checkOk: "通过",
		  checkMissing: "缺失",
		  checkPending: "待生效",
		  checkFail: "失败",
		  checkSkipped: "未尝试",
		  checkUnknown: "未知",
		  manualTitle: "需要你手动处理"
		};

		// src/client/styles.ts
		var styles = {
		  wrap: { display: "flex", flexDirection: "column", gap: 16, padding: "4px 0", fontSize: 13, lineHeight: 1.5 },
		  card: {
		    border: "0.5px solid color-mix(in srgb, currentColor 16%, transparent)",
		    borderRadius: 10,
		    padding: 14,
		    display: "flex",
		    flexDirection: "column",
		    gap: 10
		  },
		  row: { display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" },
		  grow: { flex: 1, minWidth: 0 },
		  input: {
		    boxSizing: "border-box",
		    width: "100%",
		    minHeight: 32,
		    padding: "4px 8px",
		    fontSize: 13,
		    borderRadius: 6,
		    color: "inherit",
		    background: "transparent",
		    border: "0.5px solid color-mix(in srgb, currentColor 22%, transparent)"
		  },
		  button: {
		    minHeight: 30,
		    padding: "4px 12px",
		    fontSize: 13,
		    borderRadius: 6,
		    cursor: "pointer",
		    color: "inherit",
		    background: "color-mix(in srgb, currentColor 8%, transparent)",
		    border: "0.5px solid color-mix(in srgb, currentColor 22%, transparent)"
		  },
		  primary: {
		    minHeight: 30,
		    padding: "4px 14px",
		    fontSize: 13,
		    borderRadius: 6,
		    cursor: "pointer",
		    color: "light-dark(#fff, #222)",
		    background: "light-dark(#222, #eee)",
		    border: 0
		  },
		  muted: { opacity: 0.65 },
		  error: { color: "light-dark(#a10c0c, #ffb3b3)" },
		  label: { display: "flex", flexDirection: "column", gap: 4, flex: 1, minWidth: 160 }
		};

		// src/client/index.tsx
		var import_jsx_runtime = require("react/jsx-runtime");
		var NS = "oauthLogin";
		var translate = (key) => en[key] ?? key;
		function tr(key, params) {
		  let text = translate(key);
		  if (params !== void 0) {
		    for (const [name2, value] of Object.entries(params)) text = text.replaceAll(`{${name2}}`, String(value));
		  }
		  return text;
		}
		async function request(path, init) {
		  const response = await fetch(path, { credentials: "same-origin", cache: "no-store", ...init });
		  const text = await response.text();
		  let body = null;
		  try {
		    body = text ? JSON.parse(text) : null;
		  } catch {
		    body = null;
		  }
		  if (!response.ok) {
		    const message = body?.error ?? `HTTP ${response.status}`;
		    throw new Error(message);
		  }
		  return body;
		}
		function Field(props) {
		  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { style: styles.label, children: [
		    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: styles.muted, children: props.label }),
		    props.type === "select" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
		      "select",
		      {
		        style: styles.input,
		        value: props.value,
		        disabled: props.disabled === true,
		        onChange: (event) => props.onChange(event.target.value),
		        children: (props.options ?? []).map((option) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: option.value, children: option.label }, option.value))
		      }
		    ) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
		      "input",
		      {
		        style: styles.input,
		        type: props.type === "secret" ? "password" : "text",
		        value: props.value,
		        placeholder: props.placeholder ?? "",
		        disabled: props.disabled === true,
		        onChange: (event) => props.onChange(event.target.value)
		      }
		    ),
		    props.help ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: styles.muted, children: props.help }) : null
		  ] });
		}
		function ProviderForm(props) {
		  const { draft, catalog, base, onChange, onCancel, onSave } = props;
		  const entry = catalog.find((item) => item.id === draft.provider);
		  const [registration, setRegistration] = (0, import_react.useState)(null);
		  const [preflight, setPreflight] = (0, import_react.useState)(null);
		  const update = (patch) => onChange({ ...draft, ...patch });
		  const updateConfig = (key, value) => onChange({ ...draft, config: { ...draft.config, [key]: value } });
		  const callback = base === null ? "" : base.callbackTemplate.replace("<id>", draft.provider);
		  const runPreflight = (0, import_react.useCallback)(
		    async (apply2, override) => {
		      setPreflight({ loading: true });
		      try {
		        const result = await request(
		          "oauth/feishu/preflight",
		          {
		            method: "POST",
		            headers: { "content-type": "application/json" },
		            body: JSON.stringify({
		              id: draft.provider,
		              appId: override?.appId ?? draft.clientId,
		              appSecret: override?.appSecret ?? draft.clientSecret,
		              brand: override?.brand ?? draft.config.brand ?? "feishu",
		              apply: apply2
		            })
		          }
		        );
		        setPreflight(result);
		      } catch (cause) {
		        setPreflight({ error: cause instanceof Error ? cause.message : String(cause) });
		      }
		    },
		    [draft.provider, draft.clientId, draft.clientSecret, draft.config.brand]
		  );
		  (0, import_react.useEffect)(() => {
		    if (draft.provider === "feishu" && draft.editing && draft.hasSecret) void runPreflight(false);
		  }, []);
		  const startRegistration = async () => {
		    setRegistration({ status: "starting" });
		    try {
		      const body = await request("oauth/register/start", {
		        method: "POST",
		        headers: { "content-type": "application/json" },
		        body: JSON.stringify({ brand: draft.config.brand ?? "feishu" })
		      });
		      setRegistration({ id: body.id, status: "pending", interval: body.interval, verificationUri: body.verificationUri });
		      if (body.verificationUri) globalThis.open(body.verificationUri, "_blank", "noopener");
		    } catch (cause) {
		      setRegistration({ status: "error", error: cause instanceof Error ? cause.message : String(cause) });
		    }
		  };
		  (0, import_react.useEffect)(() => {
		    if (registration === null) return void 0;
		    if (registration.status !== "pending" && registration.status !== "slow_down") return void 0;
		    const timer = globalThis.setTimeout(async () => {
		      try {
		        const body = await request(`oauth/register/poll?id=${encodeURIComponent(registration.id ?? "")}`);
		        if (body.status === "ready") {
		          update({
		            clientId: body.clientId ?? "",
		            clientSecret: body.clientSecret ?? "",
		            hasSecret: false,
		            config: { ...draft.config, ...body.brand ? { brand: body.brand } : {} }
		          });
		          setRegistration({ ...registration, status: "ready" });
		          void runPreflight(true, {
		            appId: body.clientId,
		            appSecret: body.clientSecret,
		            brand: body.brand ?? draft.config.brand
		          });
		          return;
		        }
		        if (body.status === "pending" || body.status === "slow_down") {
		          setRegistration({ ...registration, status: body.status, interval: body.interval ?? registration.interval });
		          return;
		        }
		        setRegistration({ ...registration, status: body.status, error: body.error });
		      } catch (cause) {
		        setRegistration({ ...registration, status: "error", error: cause instanceof Error ? cause.message : String(cause) });
		      }
		    }, Math.max(2, registration.interval ?? 5) * 1e3);
		    return () => globalThis.clearTimeout(timer);
		  }, [registration, draft.config, runPreflight]);
		  const checkMark = (status) => status === "ok" ? "✅" : status === "missing" || status === "fail" ? "❌" : status === "unknown" ? "⚠️" : "ℹ️";
		  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: styles.card, children: [
		    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: styles.row, children: [
		      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: draft.editing ? tr("formEdit", { label: entry?.label ?? draft.provider }) : tr("formAdd", { label: entry?.label ?? "sign-in" }) }),
		      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { ...styles.muted, ...styles.grow }, children: tr("immediate") })
		    ] }),
		    entry?.description ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: styles.muted, children: entry.description }) : null,
		    entry?.docsUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { style: styles.muted, children: [
		      tr("applyHint", { url: "" }),
		      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", { href: entry.docsUrl, target: "_blank", rel: "noreferrer", style: { color: "inherit" }, children: entry.docsUrl })
		    ] }) : null,
		    callback ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: styles.muted, children: tr("redirectHint", { url: callback }) }) : null,
		    draft.provider === "feishu" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { ...styles.card, gap: 8, background: "color-mix(in srgb, currentColor 3%, transparent)" }, children: [
		      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: styles.row, children: [
		        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: tr("scanTitle") }),
		        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", style: styles.button, onClick: () => void startRegistration(), children: tr("scanStart") })
		      ] }),
		      registration !== null ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: registration.status === "error" || registration.status === "denied" ? styles.error : styles.muted, children: registration.status === "starting" ? tr("scanStarting") : registration.status === "pending" ? tr("scanPending") : registration.status === "slow_down" ? tr("scanSlowDown") : registration.status === "ready" ? tr("scanReady") : registration.status === "denied" ? tr("scanDenied") : registration.status === "expired" ? tr("scanExpired") : tr("scanFailed", { reason: registration.error ?? registration.status }) }) : null,
		      registration?.verificationUri ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
		        "a",
		        {
		          href: registration.verificationUri,
		          target: "_blank",
		          rel: "noreferrer",
		          style: { color: "inherit", fontSize: 12 },
		          children: registration.verificationUri
		        }
		      ) : null,
		      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: styles.row, children: [
		        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", style: styles.primary, onClick: () => void runPreflight(true), children: tr("preflightCheck") }),
		        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", style: styles.button, onClick: () => void runPreflight(false), children: tr("preflightOnly") })
		      ] }),
		      preflight !== null ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", flexDirection: "column", gap: 6 }, children: [
		        preflight.loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: styles.muted, children: tr("preflightChecking") }) : null,
		        preflight.error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: styles.error, children: tr("preflightFailed", { reason: preflight.error }) }) : null,
		        (preflight.checks ?? []).map((check) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: styles.row, children: [
		          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: checkMark(check.status) }),
		          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: styles.muted, children: [
		            check.label,
		            "：",
		            check.detail
		          ] })
		        ] }, check.id)),
		        (preflight.manual ?? []).length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { ...styles.card, gap: 4 }, children: [
		          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: tr("manualTitle") }),
		          (preflight.manual ?? []).map((step, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: styles.muted, children: [
		            index + 1,
		            ". ",
		            step
		          ] }, index))
		        ] }) : null
		      ] }) : null
		    ] }) : null,
		    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: styles.row, children: [
		      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, { label: tr("displayName"), value: draft.label, onChange: (value) => update({ label: value }) }),
		      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, { label: tr("clientId"), value: draft.clientId, onChange: (value) => update({ clientId: value }) })
		    ] }),
		    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
		      Field,
		      {
		        label: draft.hasSecret ? tr("clientSecretKeep") : tr("clientSecret"),
		        type: "secret",
		        value: draft.clientSecret,
		        onChange: (value) => update({ clientSecret: value })
		      }
		    ),
		    (entry?.fields ?? []).map((field) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
		      Field,
		      {
		        label: field.required === true ? field.label : `${field.label} (optional)`,
		        type: field.type === "url" ? "text" : field.type,
		        options: field.options,
		        placeholder: field.placeholder ?? field.default ?? "",
		        help: field.help,
		        value: draft.config[field.key] ?? field.default ?? "",
		        onChange: (value) => updateConfig(field.key, value)
		      },
		      field.key
		    )),
		    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
		      Field,
		      {
		        label: tr("allowlistLabel"),
		        value: draft.allowedSubjects,
		        placeholder: tr("allowlistPlaceholder"),
		        onChange: (value) => update({ allowedSubjects: value })
		      }
		    ),
		    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: styles.row, children: [
		      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { style: styles.primary, "data-oauth-action": "save", onClick: () => onSave(draft), children: tr("save") }),
		      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { style: styles.button, "data-oauth-action": "cancel", onClick: onCancel, children: tr("cancel") })
		    ] })
		  ] });
		}
		function ProviderRow(props) {
		  const { provider, catalog, onEdit, onDelete, onToggle } = props;
		  const entry = catalog.find((item) => item.id === provider.provider);
		  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { ...styles.card, gap: 6 }, children: [
		    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: styles.row, children: [
		      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
		        "input",
		        {
		          type: "checkbox",
		          checked: provider.enabled !== false,
		          "data-oauth-provider": provider.id,
		          onChange: () => onToggle(provider)
		        }
		      ),
		      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: provider.label || entry?.label || provider.provider }),
		      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: styles.muted, children: [
		        entry?.label ?? provider.provider,
		        " · ",
		        provider.id
		      ] }),
		      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: styles.grow }),
		      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { style: styles.button, onClick: () => onEdit(provider), children: tr("edit") }),
		      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { style: styles.button, onClick: () => onDelete(provider), children: tr("delete") })
		    ] }),
		    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: styles.muted, children: tr("allowlist", {
		      accounts: (provider.allowedSubjects ?? []).join(", ") || tr("allowlistEmpty")
		    }) }),
		    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: styles.muted, children: [
		      "Secret：",
		      provider.hasSecret ? tr("secretSaved") : tr("secretMissing")
		    ] })
		  ] });
		}
		function CatalogPicker(props) {
		  const available = props.catalog.filter((item) => !props.used.includes(item.id));
		  if (available.length === 0) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: styles.muted, children: tr("noCatalogLeft") });
		  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: styles.card, children: [
		    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: tr("addTitle") }),
		    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { display: "grid", gap: 8 }, children: available.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
		      "button",
		      {
		        "data-oauth-catalog": item.id,
		        style: { ...styles.button, textAlign: "left", display: "flex", flexDirection: "column", gap: 2, alignItems: "flex-start" },
		        onClick: () => props.onPick(item),
		        children: [
		          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: item.label }),
		          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: styles.muted, children: item.description })
		        ]
		      },
		      item.id
		    )) })
		  ] });
		}
		function LoginSettings() {
		  const [catalog, setCatalog] = (0, import_react.useState)([]);
		  const [providers, setProviders] = (0, import_react.useState)([]);
		  const [sessionInfo, setSessionInfo] = (0, import_react.useState)(null);
		  const [base, setBase] = (0, import_react.useState)(null);
		  const [draft, setDraft] = (0, import_react.useState)(null);
		  const [message, setMessage] = (0, import_react.useState)("");
		  const [error, setError] = (0, import_react.useState)("");
		  const [loading, setLoading] = (0, import_react.useState)(true);
		  const reload = (0, import_react.useCallback)(async () => {
		    setLoading(true);
		    try {
		      const body = await request("oauth/providers");
		      setCatalog(body.catalog ?? []);
		      setProviders(body.providers ?? []);
		      try {
		        setSessionInfo(await request("oauth/session"));
		      } catch {
		        setSessionInfo(null);
		      }
		      try {
		        setBase(await request("oauth/base"));
		      } catch {
		        setBase(null);
		      }
		      setError("");
		    } catch (cause) {
		      setError(cause instanceof Error ? cause.message : String(cause));
		    } finally {
		      setLoading(false);
		    }
		  }, []);
		  (0, import_react.useEffect)(() => {
		    void reload();
		  }, [reload]);
		  const save = (0, import_react.useCallback)(
		    async (list) => {
		      setError("");
		      setMessage("");
		      try {
		        await request("oauth/providers", {
		          method: "POST",
		          headers: { "content-type": "application/json" },
		          body: JSON.stringify({
		            providers: list.map((item) => ({
		              ...item,
		              allowedSubjects: item.allowedSubjects.split(",").map((value) => value.trim()).filter(Boolean),
		              clientSecret: item.clientSecret ? item.clientSecret : void 0
		            }))
		          })
		        });
		        setMessage(tr("savedNotice"));
		        await reload();
		        return true;
		      } catch (cause) {
		        setError(cause instanceof Error ? cause.message : String(cause));
		        return false;
		      }
		    },
		    [reload]
		  );
		  const commitDraft = (0, import_react.useCallback)(
		    async (value) => {
		      const entry = catalog.find((item) => item.id === value.provider);
		      if (!value.clientId) {
		        setError(tr("errorClientId"));
		        return;
		      }
		      if (!value.hasSecret && !value.clientSecret) {
		        setError(tr("errorClientSecret"));
		        return;
		      }
		      const allowed = value.allowedSubjects.split(",").map((item) => item.trim()).filter(Boolean);
		      if (allowed.length === 0) {
		        setError(tr("errorAllowlist"));
		        return;
		      }
		      if (entry) {
		        const missing = entry.fields.find(
		          (field) => field.required === true && !(value.config[field.key] || field.default)
		        );
		        if (missing) {
		          setError(tr("fieldRequired", { label: missing.label }));
		          return;
		        }
		      }
		      const next = providers.filter((item) => item.id !== value.id).map((item) => ({ ...item, allowedSubjects: item.allowedSubjects.join(", ") }));
		      next.push({ ...value, allowedSubjects: allowed.join(", ") });
		      const ok = await save(next);
		      if (ok) setDraft(null);
		    },
		    [providers, catalog, save]
		  );
		  const toggle = (0, import_react.useCallback)(
		    async (provider) => {
		      const next = providers.map(
		        (item) => item.id === provider.id ? { ...item, enabled: item.enabled === false } : item
		      );
		      setProviders(next);
		      const ok = await save(next.map((item) => ({ ...item, allowedSubjects: item.allowedSubjects.join(", ") })));
		      if (!ok) await reload();
		    },
		    [providers, save, reload]
		  );
		  const remove = (0, import_react.useCallback)(
		    async (provider) => {
		      const next = providers.filter((item) => item.id !== provider.id);
		      const ok = await save(next.map((item) => ({ ...item, allowedSubjects: item.allowedSubjects.join(", ") })));
		      if (!ok) await reload();
		    },
		    [providers, save, reload]
		  );
		  const edit = (0, import_react.useCallback)((provider) => {
		    setDraft({
		      id: provider.id,
		      provider: provider.provider,
		      label: provider.label,
		      enabled: provider.enabled,
		      clientId: provider.clientId,
		      clientSecret: "",
		      config: { ...provider.config },
		      allowedSubjects: provider.allowedSubjects.join(", "),
		      hasSecret: provider.hasSecret,
		      editing: true
		    });
		  }, []);
		  const pick = (0, import_react.useCallback)((entry) => {
		    setDraft({
		      id: entry.id,
		      provider: entry.id,
		      label: entry.label,
		      enabled: true,
		      clientId: "",
		      clientSecret: "",
		      config: Object.fromEntries(entry.fields.map((field) => [field.key, field.default ?? ""])),
		      allowedSubjects: "",
		      hasSecret: false,
		      editing: false
		    });
		  }, []);
		  const who = sessionInfo?.native === true ? tr("currentNative") : sessionInfo?.provider ? tr("currentProvider", {
		    provider: sessionInfo.label ?? sessionInfo.provider,
		    subject: sessionInfo.subject ?? ""
		  }) : "";
		  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: styles.wrap, children: [
		    who ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { ...styles.card, flexDirection: "row", alignItems: "center", gap: 10 }, children: [
		      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: styles.grow, children: who }),
		      sessionInfo?.provider ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { style: styles.button, onClick: () => globalThis.location.assign("oauth/logout"), children: tr("logout") }) : null
		    ] }) : null,
		    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: styles.muted, children: tr("intro") }),
		    message ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { "data-oauth-notice": "ok", children: message }) : null,
		    error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: styles.error, role: "alert", "data-oauth-notice": "error", children: error }) : null,
		    loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: styles.muted, children: tr("loading") }) : null,
		    providers.map((provider) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
		      ProviderRow,
		      {
		        provider,
		        catalog,
		        onEdit: edit,
		        onDelete: remove,
		        onToggle: toggle
		      },
		      provider.id
		    )),
		    draft ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
		      ProviderForm,
		      {
		        draft,
		        catalog,
		        base,
		        onChange: setDraft,
		        onCancel: () => setDraft(null),
		        onSave: (value) => void commitDraft(value)
		      }
		    ) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CatalogPicker, { catalog, used: providers.map((item) => item.provider), onPick: pick })
		  ] });
		}
		function apply(ctx) {
		  ctx.effect(() => ctx.locale.register(NS, { en, zh }), "dsh-oauth-github: dictionaries");
		  translate = ctx.locale.bind(NS);
		  ctx.slots.inject(
		    "settings.section",
		    () => ctx.slots.register(
		      {
		        name: "settings.section",
		        id: "oauth-login",
		        order: 60,
		        label: () => tr("nav"),
		        locale: NS
		      },
		      LoginSettings
		    )
		  );
		}
		var name = "oauth-github";
		var inject = ["slots", "locale"];

		return module.exports;
	}
});
