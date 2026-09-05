// Mirrors eezit-backend's BroadcastAudienceType/BroadcastStatus enums and the
// NotificationBroadcast model (prisma/schema/notification.prisma) — see
// AudienceFilterDto / CreateBroadcastDto on the backend for the source of truth.

export type BroadcastAudienceType =
  | 'ALL_USERS'
  | 'ALL_PARTNERS'
  | 'SELECTED_USERS'
  | 'SELECTED_PARTNERS'
  | 'SEGMENT_USERS'
  | 'SEGMENT_PARTNERS';

export type BroadcastStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'PARTIALLY_FAILED'
  | 'FAILED';

export type RecipientRole = 'USERS' | 'PARTNERS';

export type AudienceMode = 'ALL' | 'SEGMENT' | 'SELECTED';

/**
 * One combined filter shape for both roles — matches AudienceFilterDto on
 * the backend field-for-field. AudienceBuilder only renders/sends the
 * fields relevant to whichever `RecipientRole` is currently selected.
 */
export interface AudienceFilter {
  // shared
  isActive?: boolean;
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY';
  city?: string;
  state?: string;
  joinedFrom?: string;
  joinedTo?: string;
  minTotalBookings?: number;

  // users only
  isPhoneVerified?: boolean;
  neverBooked?: boolean;
  lapsedDays?: number;
  minLifetimeSpend?: number;
  respectPromotionalOptIn?: boolean;

  // partners only
  type?: 'INDIVIDUAL' | 'BUSINESS';
  status?: string[];
  isOnline?: boolean;
  kycStatus?: 'NOT_SUBMITTED' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'RESUBMISSION_REQUIRED';
  minRating?: number;
}

export interface NotificationBroadcast {
  id: string;
  createdByAdminId: string;
  title: string;
  body: string;
  deeplink?: string | null;
  imageKey?: string | null;
  audienceType: BroadcastAudienceType;
  audienceFilter?: (AudienceFilter & { recipientIds?: string[] }) | null;
  status: BroadcastStatus;
  targetCount: number;
  sentCount: number;
  failedCount: number;
  errorMessage?: string | null;
  createdAt: string;
  startedAt?: string | null;
  completedAt?: string | null;
}

export interface CreateBroadcastPayload {
  title: string;
  body: string;
  deeplink?: string;
  imageKey?: string;
  audienceType: BroadcastAudienceType;
  audienceFilter?: AudienceFilter;
  recipientIds?: string[];
}

export interface BroadcastFilter {
  status?: BroadcastStatus[];
  from?: string;
  to?: string;
}
