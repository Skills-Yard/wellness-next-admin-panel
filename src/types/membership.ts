export type BusinessMembershipStatus =
  | 'PENDING_BUSINESS_APPROVAL'
  | 'PENDING_EMPLOYEE_APPROVAL'
  | 'ACTIVE'
  | 'REJECTED'
  | 'REVOKED'
  | 'LEFT';

export type BusinessMembershipOrigin =
  | 'PARTNER_REQUEST'
  | 'BUSINESS_INVITE'
  | 'BUSINESS_CREATED'
  | 'ADMIN';

export interface MembershipPartySummary {
  id: string;
  name?: string | null;
  type?: string;
  status?: string;
  city?: string | null;
  businessCode?: string | null;
  phone?: string | null;
}

export interface BusinessMembership {
  id: string;
  employeePartnerId: string;
  businessPartnerId: string;
  status: BusinessMembershipStatus;
  origin: BusinessMembershipOrigin;
  role?: string | null;
  specializations: string[];
  endReason?: string | null;
  createdAt: string;
  respondedAt?: string | null;
  endedAt?: string | null;
  businessPartner?: MembershipPartySummary;
  employeePartner?: MembershipPartySummary;
}

export const MEMBERSHIP_STATUS_LABEL: Record<BusinessMembershipStatus, string> = {
  PENDING_BUSINESS_APPROVAL: 'Awaiting business',
  PENDING_EMPLOYEE_APPROVAL: 'Awaiting employee',
  ACTIVE: 'Active',
  REJECTED: 'Rejected',
  REVOKED: 'Revoked',
  LEFT: 'Left',
};
