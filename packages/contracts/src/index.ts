export type ActorRole = "platform_admin" | "tenant_admin" | "member";
export type TenantStatus = "active" | "suspended";

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
}

export interface ApiError {
  error: string;
  message?: string;
}
