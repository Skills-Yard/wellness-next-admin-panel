export type PartnerType = 'INDIVIDUAL' | 'BUSINESS';

export type PartnerStatus =
  | 'INCOMPLETE'
  | 'PENDING_KYC'
  | 'KYC_SUBMITTED'
  | 'TRAINING'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'SUSPENDED'
  | 'REJECTED'
  | 'DEACTIVATED';

export type KycStatus =
  | 'NOT_SUBMITTED'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'RESUBMISSION_REQUIRED';

export type DayOfWeek = 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN';

export interface PartnerKyc {
  id: string;
  partnerId: string;
  aadhaarFrontKey?: string | null;
  aadhaarBackKey?: string | null;
  panKey?: string | null;
  selfieKey?: string | null;
  videoKycKey?: string | null;
  videoKycDurationSec?: number | null;
  certificateKeys?: string[];
  businessName?: string | null;
  businessType?: string | null;
  gstin?: string | null;
  businessRegistrationNumber?: string | null;
  businessAddress?: string | null;
  businessLicenseKey?: string | null;
  businessPanKey?: string | null;
  cancelledChequeKey?: string | null;
  status: KycStatus;
  adminNotes?: string | null;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  submittedAt?: string | null;
  resubmittedAt?: string | null;
  updatedAt: string;
}

export interface BankAccount {
  id: string;
  partnerId: string;
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  bankName: string;
  accountType: string;
  razorpayContactId?: string | null;
  razorpayFundAccountId?: string | null;
  isVerified: boolean;
  verifiedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PartnerServiceItem {
  id: string;
  partnerId: string;
  serviceItemId: string;
  customPrice?: number | null;
  isActive: boolean;
  serviceItem?: {
    id: string;
    name: string;
    cardTitle: string;
    cardSubtitle?: string | null;
    shortDescription?: string | null;
    thumbnailKey?: string | null;
    durations?: Array<{ price: number; discountedPrice?: number | null }>;
  };
}

export interface PartnerAvailabilityItem {
  id?: string;
  partnerId?: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

export interface PartnerEmployee {
  id: string;
  partnerId: string;
  name: string;
  phone: string;
  profilePhotoKey?: string | null;
  role: string;
  specializations: string[];
  isActive: boolean;
  status: string;
  approvedAt?: string | null;
  approvedBy?: string | null;
  joinedAt: string;
}

export interface PartnerTrainingCourse {
  id: string;
  title: string;
  category?: string | null;
}

export interface PartnerTrainingProgress {
  id: string;
  partnerId: string;
  courseId: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  score?: number | null;
  completedAt?: string | null;
  course?: PartnerTrainingCourse;
}

export interface Partner {
  id: string;
  phoneEncrypted?: string;
  phoneBlindIndex?: string;
  countryCode: string;
  phone?: string; // Decrypted or helper phone if provided
  name?: string | null;
  email?: string | null;
  profilePhotoKey?: string | null;
  type: PartnerType;
  status: PartnerStatus;
  bio?: string | null;
  yearsOfExperience?: number | null;
  languages: string[];
  latitude?: number | null;
  longitude?: number | null;
  baseH3Index?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  serviceRadiusKm: number;
  bufferMinutes: number;
  slotDurationMinutes: number;
  totalBookings: number;
  completionRate: number;
  averageRating: number;
  totalReviews: number;
  whatsappOptIn: boolean;
  commissionPercent?: number | null;
  isActive: boolean;
  isOnline: boolean;
  lastSeenAt?: string | null;
  onboardingStep: number;
  approvedAt?: string | null;
  approvedBy?: string | null;
  createdAt: string;
  updatedAt: string;
  kyc?: PartnerKyc | null;
  bankAccount?: BankAccount | null;
  partnerServices?: PartnerServiceItem[];
  availability?: PartnerAvailabilityItem[];
  employees?: PartnerEmployee[];
  trainingProgress?: PartnerTrainingProgress[];
}

export interface PartnerFilter {
  status?: PartnerStatus;
  isActive?: boolean;
  city?: string;
  search?: string;
}

export interface PartnerBooking {
  id: string;
  bookingCode?: string;
  userId: string;
  user?: {
    name?: string;
    phone?: string;
  };
  partnerId?: string;
  status: string;
  scheduledDate: string;
  scheduledTime: string;
  estimatedDurationMinutes: number;
  totalAmount: number;
  paymentStatus?: string;
  rating?: number;
  items?: Array<{
    serviceItemName: string;
    price: number;
    durationMinutes: number;
  }>;
  createdAt: string;
}

export interface PartnerReview {
  id: string;
  partnerId: string;
  userId: string;
  user?: {
    name?: string;
    avatarUrl?: string;
  };
  rating: number;
  comment?: string | null;
  serviceItemName?: string | null;
  createdAt: string;
}
