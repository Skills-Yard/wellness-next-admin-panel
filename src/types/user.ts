export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'UNVERIFIED' | 'DEACTIVATED' | 'SUSPENDED';

export interface UserAddress {
  id: string;
  userId: string;
  label?: string | null;
  customLabel?: string | null;
  line1: string;             // Prisma: line1 (not addressLine1)
  line2?: string | null;
  landmark?: string | null;
  city: string;
  state: string;
  pincode: string;
  latitude: number;
  longitude: number;
  isDefault: boolean;
  zoneId?: string | null;
  customerPhone?: string | null;
  customerCountryCode?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserDeviceToken {
  id: string;
  userId: string;
  fcmToken: string;
  deviceType?: string | null;
  deviceName?: string | null;
  deviceModel?: string | null;
  isActive: boolean;
  lastUsedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserNotificationPreference {
  id?: string;
  userId: string;
  whatsappOptIn: boolean;
  emailOptIn: boolean;
  pushOptIn: boolean;
  promotionalOptIn: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserActivitySnapshot {
  totalBookings: number;
  completedBookings: number;
  canceledBookings: number;
  lifetimeSpend: number;
  averageRating: number;
  couponsRedeemed: number;
  activePlans: number;
  cartStatus: string;
  monthlyTrend: Array<{ label: string; bookings: number }>;
}

export interface User {
  id: string;
  name?: string | null;
  email?: string | null;
  // Decrypted phone (provided by backend for admin role)
  phone?: string | null;
  countryCode?: string | null;
  profilePhotoKey?: string | null;
  avatarUrl?: string | null;
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | string | null;
  dateOfBirth?: string | null;

  isActive: boolean;
  isPhoneVerified: boolean;
  isProfileComplete: boolean;

  // Backend field names (no separate status enum — derived from isActive)
  referralCode?: string | null;
  referredBy?: string | null;     // backend field name (not referredById)
  lastLoginAt?: string | null;    // backend field name for "last seen"

  // Computed by frontend from createdAt (backend has no joinedAt column)
  createdAt: string;
  updatedAt: string;

  // Relations (only present in single-user detail response)
  addresses?: UserAddress[];
  devices?: UserDeviceToken[];
  preferences?: UserNotificationPreference | null;

  // Booking count — available when backend includes _count
  _count?: { bookings?: number };

  // Optional computed/enriched fields (may not always be present)
  status?: UserStatus;
  accountCode?: string | null;
  secondaryPhone?: string | null;
  locationCity?: string | null;
  locationState?: string | null;
  totalBookings?: number;
  completedBookings?: number;
  canceledBookings?: number;
  lifetimeSpend?: number;
  averageRating?: number;
  lastSeenAt?: string | null;
  isOnline?: boolean;
  joinedAt?: string | null;
  userReferredCount?: number;
  referredByName?: string | null;
  activitySnapshot?: UserActivitySnapshot;
}

export interface UserFilter {
  search?: string;
  status?: UserStatus | 'ALL';
  isActive?: boolean;
  isPhoneVerified?: boolean;
  startDate?: string;
  endDate?: string;
}

export interface CreateUserPayload {
  name: string;
  email: string;
  countryCode: string;
  phone: string;
  gender?: string;
  dateOfBirth?: string;
}

export interface UpdateUserPayload {
  name?: string;
  email?: string;
  countryCode?: string;
  phone?: string;
  gender?: string;
  dateOfBirth?: string;
  isActive?: boolean;
  isPhoneVerified?: boolean;
  isProfileComplete?: boolean;
  status?: UserStatus;
  referredBy?: string;
}
