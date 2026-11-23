/** Host-rendered copy (login and error pages), localized from `Accept-Language`. */

/** Supported host locales. */
export type HostLocale = 'en' | 'zh'

interface HostText {
  loginTitle: string
  loginIntro: string
  loginWith: (provider: string) => string
  noneConfigured: string
  otherMethods: string
  nativeLogin: string
  loginCancelled: string
  loginFailed: string
  retryLogin: string
  providerUnavailableTitle: string
  providerUnavailableDetail: string
  stateFailedTitle: string
  stateFailedDetail: string
  exchangeFailedTitle: string
  exchangeFailedDetail: string
  noIdentityTitle: string
  noIdentityDetail: string
  deniedTitle: string
  deniedDetail: (provider: string, subject: string) => string
  misconfiguredTitle: string
  misconfiguredDetail: string
}

const EN: HostText = {
  loginTitle: 'Sign in to DeepSeek Harness',
  loginIntro: 'Continue with a third-party account.',
  loginWith: (provider) => `Continue with ${provider}`,
  noneConfigured: 'No third-party sign-in method is enabled.',
  otherMethods: 'Other methods:',
  nativeLogin: 'Local token / device pairing',
  loginCancelled: 'Sign-in was cancelled.',
  loginFailed: 'Sign-in failed. Try again.',
  retryLogin: 'Sign in again',
  providerUnavailableTitle: 'Sign-in method unavailable',
  providerUnavailableDetail: 'This sign-in method is not enabled.',
  stateFailedTitle: 'Sign-in state check failed',
  stateFailedDetail: 'This sign-in request expired or did not start here. Please sign in again.',
  exchangeFailedTitle: 'Third-party verification failed',
  exchangeFailedDetail: 'The third-party authorization could not be completed. Try again later.',
  noIdentityTitle: 'Third-party verification failed',
  noIdentityDetail: 'The third-party account returned no usable identity.',
  deniedTitle: 'Account not allowed',
  deniedDetail: (provider, subject) => `The ${provider} account ${subject} is not in the allowlist.`,
  misconfiguredTitle: 'Sign-in method misconfigured',
  misconfiguredDetail: 'The endpoints for this sign-in method could not be resolved. Check its configuration.',
}

const ZH: HostText = {
  loginTitle: '登录 DeepSeek Harness',
  loginIntro: '使用第三方账号验证身份后进入。',
  loginWith: (provider) => `使用 ${provider} 登录`,
  noneConfigured: '尚未启用第三方登录方式。',
  otherMethods: '其他方式：',
  nativeLogin: '本机 Token / 设备配对',
  loginCancelled: '登录已取消。',
  loginFailed: '登录失败，请重试。',
  retryLogin: '重新登录',
  providerUnavailableTitle: '登录方式不可用',
  providerUnavailableDetail: '该登录方式未启用。',
  stateFailedTitle: '登录状态校验失败',
  stateFailedDetail: '这次登录请求已过期或不是从本站发起的，请重新登录。',
  exchangeFailedTitle: '第三方验证失败',
  exchangeFailedDetail: '无法完成第三方授权，请稍后重试。',
  noIdentityTitle: '第三方验证失败',
  noIdentityDetail: '第三方账号没有返回可用的身份标识。',
  deniedTitle: '账号不允许登录',
  deniedDetail: (provider, subject) => `${provider} 账号 ${subject} 不在允许列表中。`,
  misconfiguredTitle: '登录方式配置有误',
  misconfiguredDetail: '无法解析该登录方式的端点，请检查配置。',
}

/** Localized provider labels, descriptions and field copy for the settings API. */
export interface ProviderCopy {
  label: string
  description: string
  fields?: Record<string, { label?: string; help?: string }>
}

const EN_PROVIDERS: Record<string, ProviderCopy> = {}
const ZH_PROVIDERS: Record<string, ProviderCopy> = {
  github: {
    label: 'GitHub',
    description: 'GitHub OAuth App；身份取 login、id 或 email，任一匹配白名单即可。',
  },
  google: {
    label: 'Google',
    description: 'Google OAuth 客户端；身份取 sub 或 email。',
  },
  gitlab: {
    label: 'GitLab',
    description: 'GitLab.com 或自建实例；身份取 username、id 或 email。',
    fields: { baseUrl: { label: 'GitLab 地址', help: '自建实例填自己的域名。' } },
  },
  gitee: {
    label: 'Gitee',
    description: 'Gitee 码云；身份取 login、id 或 email。',
  },
  microsoft: {
    label: 'Microsoft',
    description: 'Microsoft Entra ID（Azure AD）；身份取 sub、email 或 UPN。',
    fields: { tenant: { label: 'Tenant', help: 'common、organizations、consumers 或具体 tenant id。' } },
  },
  discord: {
    label: 'Discord',
    description: 'Discord OAuth2；身份取 username 或 id。',
  },
  slack: {
    label: 'Slack',
    description: 'Slack OpenID Connect；身份取 sub 或 email。',
  },
  feishu: {
    label: '飞书 / Lark',
    description: '飞书 / Lark 网页登录，支持扫码一键创建应用。',
    fields: {
      brand: { label: '版本' },
      scope: { label: 'Scope（可选）', help: '需要邮箱等字段时，先在开放平台申请对应权限再填 scope。' },
    },
  },
  keycloak: {
    label: 'Keycloak / OIDC',
    description: '任意标准 OIDC（Keycloak、Auth0、Okta…），填 issuer 自动发现端点。',
    fields: { issuer: { label: 'Issuer', help: '读取 <issuer>/.well-known/openid-configuration。' } },
  },
}

/** Provider copy overrides for a locale; an empty map means "use the catalog English". */
export function providerCopy(locale: HostLocale): Record<string, ProviderCopy> {
  return locale === 'zh' ? ZH_PROVIDERS : EN_PROVIDERS
}

/** Pick a host locale from an Accept-Language header. */
export function hostLocale(acceptLanguage: string | undefined): HostLocale {
  return acceptLanguage?.toLowerCase().startsWith('zh') === true ? 'zh' : 'en'
}

/** @returns the host copy for a locale. */
export function hostText(locale: HostLocale): HostText {
  return locale === 'zh' ? ZH : EN
}
