export type ActorRole = "platform_admin" | "tenant_admin" | "member";
export type TenantStatus = "active" | "suspended";

export interface TenantDirectoryPerson {
  id: string;
  name: string;
  email: string;
  role: ActorRole;
  jobTitle: string;
  joinedAt: string;
}

export interface Actor {
  userId: string;
  email: string;
  role: ActorRole;
  tenantId: string | null;
}

export interface TenantSummary {
  id: string;
  name: string;
  status: TenantStatus;
  subscriptionEndsAt: string;
  region: string;
  plan: "Starter" | "Growth" | "Enterprise";
  industry: string;
  employeeCount: number;
  annualRecurringRevenueCents: number;
  members: TenantDirectoryPerson[];
}

export type TenantStatusInfo = Pick<TenantSummary, "id" | "name" | "status">;

export interface ApiError {
  error: string;
  message?: string;
}
