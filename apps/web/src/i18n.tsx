import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Language = "en" | "zh";

const messages = {
  en: {
    "document.title": "Northstar SaaS Admin Platform",
    "language.label": "Language",
    "brand.subtitle": "SAAS PLATFORM",
    "brand.home": "Northstar home",
    "identity.label": "DEMO IDENTITY",
    "breadcrumb.platform": "PLATFORM / CUSTOMERS",
    "breadcrumb.organization": "ORGANIZATION / WORKSPACE",
    "app.title.platform": "Platform overview",
    "app.title.organization": "Organization console",
    "app.description.platform": "Monitor customer organizations and access.",
    "app.description.organization": "Manage your team's SaaS workspace.",
    "app.loading": "Preparing the demo workspace…",
    "app.demoNotice": "Demo identity switching is local-only and is not production authentication.",
    "directory.eyebrow": "CUSTOMER ACCOUNTS",
    "directory.title": "Tenant directory",
    "directory.description": "Manage customer access and subscription status.",
    "directory.count": "tenants shown",
    "directory.searchLabel": "Search tenants and people",
    "directory.searchPlaceholder": "Search tenant, member name, or email",
    "directory.search": "Search",
    "directory.filter.status": "Status",
    "directory.filter.region": "Region",
    "directory.filter.plan": "Plan",
    "directory.filter.allStatuses": "All statuses",
    "directory.filter.allRegions": "All regions",
    "directory.filter.allPlans": "All plans",
    "directory.filter.active": "Active",
    "directory.filter.suspended": "Suspended",
    "directory.region.northAmerica": "North America",
    "directory.region.europe": "Europe",
    "directory.region.asiaPacific": "Asia Pacific",
    "directory.plan.starter": "Starter",
    "directory.plan.growth": "Growth",
    "directory.plan.enterprise": "Enterprise",
    "directory.empty": "No tenants match this search.",
    "directory.loading": "Loading tenants…",
    "directory.column.tenant": "Tenant",
    "directory.column.subscription": "Subscription through",
    "directory.column.status": "Status",
    "directory.column.region": "Region",
    "directory.column.plan": "Plan",
    "directory.column.employees": "Employees",
    "directory.column.arr": "Annual revenue",
    "directory.column.people": "People",
    "directory.column.actions": "Actions",
    "directory.action.suspend": "Suspend",
    "directory.action.reactivate": "Reactivate",
    "directory.status.active": "active",
    "directory.status.suspended": "suspended",
    "directory.memberCount": "{count} people",
    "directory.confirm.eyebrow": "CONFIRM TENANT CHANGE",
    "directory.confirm.suspendTitle": "Suspend {tenant}?",
    "directory.confirm.reactivateTitle": "Reactivate {tenant}?",
    "directory.confirm.suspendBody": "Tenant members will lose console access. Their data will remain available.",
    "directory.confirm.reactivateBody": "Tenant members will regain console access.",
    "directory.confirm.cancel": "Cancel",
    "directory.confirm.saving": "Saving…",
    "directory.confirm.suspend": "Confirm suspension",
    "directory.confirm.reactivate": "Confirm reactivation",
    "directory.updated": "{tenant} updated successfully.",
    "console.loading": "Loading tenant workspace…",
    "console.suspendedStatus": "Suspended",
    "console.suspendedTitle": "Workspace access is paused",
    "console.suspendedBody": "{tenant} is currently suspended. Your data is preserved. Contact your platform operator if you believe this is a mistake.",
    "console.workspaceEyebrow": "TENANT WORKSPACE",
    "console.loadingWorkspace": "Loading workspace…",
    "console.active": "Active",
    "console.organizationEyebrow": "YOUR ORGANIZATION",
    "console.members": "Team members",
    "role.platformAdmin": "platform admin",
    "role.tenantAdmin": "tenant admin",
    "role.member": "member",
    "error.loadAccounts": "Could not load demo accounts.",
    "error.switchAccount": "Could not switch demo account.",
    "error.loadTenants": "Could not load tenants.",
    "error.updateTenant": "Could not update tenant.",
    "error.loadWorkspace": "Could not load tenant workspace.",
    "error.unknownActor": "Unknown demo account.",
    "error.unauthorized": "Please sign in to continue.",
    "error.forbidden": "You do not have permission to do that.",
    "error.tenantUserRequired": "A tenant account is required.",
    "error.tenantNotFound": "Tenant not found.",
    "error.tenantSuspended": "This tenant is suspended.",
    "error.notFound": "The requested item was not found.",
    "error.notImplemented": "This action is not implemented yet.",
  },
  zh: {
    "document.title": "Northstar SaaS 管理平台",
    "language.label": "语言",
    "brand.subtitle": "SaaS 管理平台",
    "brand.home": "Northstar 首页",
    "identity.label": "演示身份",
    "breadcrumb.platform": "平台 / 客户",
    "breadcrumb.organization": "组织 / 工作区",
    "app.title.platform": "平台概览",
    "app.title.organization": "组织控制台",
    "app.description.platform": "查看客户组织及其访问状态。",
    "app.description.organization": "管理团队的 SaaS 工作区。",
    "app.loading": "正在准备演示工作区…",
    "app.demoNotice": "演示身份切换仅用于本地环境，不属于生产环境认证。",
    "directory.eyebrow": "客户账户",
    "directory.title": "租户目录",
    "directory.description": "管理客户访问权限和订阅状态。",
    "directory.count": "个租户",
    "directory.searchLabel": "搜索租户和成员",
    "directory.searchPlaceholder": "搜索租户名称、成员姓名或邮箱",
    "directory.search": "搜索",
    "directory.filter.status": "状态",
    "directory.filter.region": "地区",
    "directory.filter.plan": "套餐",
    "directory.filter.allStatuses": "所有状态",
    "directory.filter.allRegions": "所有地区",
    "directory.filter.allPlans": "所有套餐",
    "directory.filter.active": "正常",
    "directory.filter.suspended": "已暂停",
    "directory.region.northAmerica": "北美",
    "directory.region.europe": "欧洲",
    "directory.region.asiaPacific": "亚太",
    "directory.plan.starter": "入门版",
    "directory.plan.growth": "成长版",
    "directory.plan.enterprise": "企业版",
    "directory.empty": "没有符合条件的租户。",
    "directory.loading": "正在加载租户…",
    "directory.column.tenant": "租户",
    "directory.column.subscription": "订阅截止日期",
    "directory.column.status": "状态",
    "directory.column.region": "地区",
    "directory.column.plan": "套餐",
    "directory.column.employees": "员工数",
    "directory.column.arr": "年经常性收入",
    "directory.column.people": "成员",
    "directory.column.actions": "操作",
    "directory.action.suspend": "暂停",
    "directory.action.reactivate": "恢复",
    "directory.status.active": "正常",
    "directory.status.suspended": "已暂停",
    "directory.memberCount": "{count} 人",
    "directory.confirm.eyebrow": "确认租户状态变更",
    "directory.confirm.suspendTitle": "确定暂停 {tenant}？",
    "directory.confirm.reactivateTitle": "确定恢复 {tenant}？",
    "directory.confirm.suspendBody": "该租户成员将无法访问控制台，但数据会保留。",
    "directory.confirm.reactivateBody": "该租户成员将重新获得控制台访问权限。",
    "directory.confirm.cancel": "取消",
    "directory.confirm.saving": "正在保存…",
    "directory.confirm.suspend": "确认暂停",
    "directory.confirm.reactivate": "确认恢复",
    "directory.updated": "{tenant} 已更新。",
    "console.loading": "正在加载租户工作区…",
    "console.suspendedStatus": "已暂停",
    "console.suspendedTitle": "工作区访问已暂停",
    "console.suspendedBody": "{tenant} 当前已暂停，数据会保留。如需帮助，请联系平台运营人员。",
    "console.workspaceEyebrow": "租户工作区",
    "console.loadingWorkspace": "正在加载工作区…",
    "console.active": "正常",
    "console.organizationEyebrow": "你的组织",
    "console.members": "团队成员",
    "role.platformAdmin": "平台管理员",
    "role.tenantAdmin": "租户管理员",
    "role.member": "成员",
    "error.loadAccounts": "无法加载演示账户。",
    "error.switchAccount": "无法切换演示账户。",
    "error.loadTenants": "无法加载租户。",
    "error.updateTenant": "无法更新租户。",
    "error.loadWorkspace": "无法加载租户工作区。",
    "error.unknownActor": "找不到此演示账户。",
    "error.unauthorized": "请先登录后继续。",
    "error.forbidden": "你没有权限执行此操作。",
    "error.tenantUserRequired": "此操作需要租户账户。",
    "error.tenantNotFound": "找不到该租户。",
    "error.tenantSuspended": "该租户已暂停。",
    "error.notFound": "找不到请求的内容。",
    "error.notImplemented": "此操作尚未实现。",
  },
} as const;

export type MessageKey = keyof typeof messages.en;
type TranslationValues = Record<string, string | number>;
type Translator = (key: MessageKey, values?: TranslationValues) => string;

interface I18nContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
  t: Translator;
}

const STORAGE_KEY = "hero-language";
const I18nContext = createContext<I18nContextValue | null>(null);

function getSavedLanguage(): Language {
  try {
    return localStorage.getItem(STORAGE_KEY) === "zh" ? "zh" : "en";
  } catch {
    return "en";
  }
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(getSavedLanguage);

  const setLanguage = useCallback((nextLanguage: Language) => {
    setLanguageState(nextLanguage);
    try {
      localStorage.setItem(STORAGE_KEY, nextLanguage);
    } catch {
      // The current page still changes language if storage is unavailable.
    }
  }, []);

  const t = useCallback<Translator>(
    (key, values = {}) =>
      messages[language][key].replace(/\{(\w+)\}/g, (_match, name: string) =>
        String(values[name] ?? `{${name}}`),
      ),
    [language],
  );

  useEffect(() => {
    document.documentElement.lang = language === "zh" ? "zh-CN" : "en";
    document.title = messages[language]["document.title"];
  }, [language]);

  const value = useMemo(
    () => ({ language, setLanguage, t }),
    [language, setLanguage, t],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) throw new Error("useI18n must be used inside I18nProvider");
  return context;
}

export function localizedError(
  cause: unknown,
  fallback: string,
  t: Translator,
) {
  if (!(cause instanceof Error)) return fallback;
  const errorKeys: Record<string, MessageKey> = {
    "Could not load demo accounts.": "error.loadAccounts",
    "Could not switch demo account.": "error.switchAccount",
    "Could not load tenants.": "error.loadTenants",
    "Could not update tenant.": "error.updateTenant",
    "Could not load tenant workspace.": "error.loadWorkspace",
    unknown_demo_actor: "error.unknownActor",
    unauthorized: "error.unauthorized",
    forbidden: "error.forbidden",
    tenant_user_required: "error.tenantUserRequired",
    tenant_not_found: "error.tenantNotFound",
    tenant_suspended: "error.tenantSuspended",
    not_found: "error.notFound",
    not_implemented: "error.notImplemented",
  };
  const key = errorKeys[cause.message];
  return key ? t(key) : cause.message;
}

export function localizedRole(role: string, t: Translator) {
  const roleKeys: Record<string, MessageKey> = {
    platform_admin: "role.platformAdmin",
    tenant_admin: "role.tenantAdmin",
    member: "role.member",
  };
  return roleKeys[role] ? t(roleKeys[role]) : role.replaceAll("_", " ");
}

export function localizedRegion(region: string, t: Translator) {
  const regionKeys: Record<string, MessageKey> = {
    "North America": "directory.region.northAmerica",
    Europe: "directory.region.europe",
    "Asia Pacific": "directory.region.asiaPacific",
  };
  return regionKeys[region] ? t(regionKeys[region]) : region;
}

export function localizedPlan(plan: string, t: Translator) {
  const planKeys: Record<string, MessageKey> = {
    Starter: "directory.plan.starter",
    Growth: "directory.plan.growth",
    Enterprise: "directory.plan.enterprise",
  };
  return planKeys[plan] ? t(planKeys[plan]) : plan;
}
