export type BookingStatus =
  | 'PENDING_PAYMENT'
  | 'CONFIRMED'
  | 'ASSIGNING_PARTNER'
  | 'PARTNER_ASSIGNED'
  | 'PARTNER_EN_ROUTE'
  | 'PARTNER_ARRIVED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'REFUNDED';

export type BookingType = 'ON_DEMAND' | 'SCHEDULED' | 'RECURRING_INSTANCE';
export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';

export interface BookingUser {
  id: string;
  name?: string | null;
  phone?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
}

export interface BookingPartner {
  id: string;
  name?: string | null;
  phone?: string | null;
  profilePhotoKey?: string | null;
  city?: string | null;
  averageRating?: number | null;
  totalReviews?: number | null;
}

export interface BookingAddress {
  id: string;
  formattedAddress?: string | null;
  houseNo?: string | null;
  street?: string | null;
  landmark?: string | null;
  city?: string | null;
  postalCode?: string | null;
}

export interface BookingPayment {
  id: string;
  razorpayPaymentId?: string | null;
  amount: number;
  status: string;
  paidAt?: string | null;
  createdAt?: string | null;
}

export interface BookingItemDetail {
  id: string;
  bookingId: string;
  serviceItemId: string;
  serviceItemName: string;
  categoryName?: string | null;
  customPrice?: number | null;
  durationMinutes: number;
  scheduledTime?: string | null;
  status?: string | null;
  serviceItem?: {
    id: string;
    name?: string | null;
    cardTitle?: string | null;
    thumbnailKey?: string | null;
    subCategory?: {
      name?: string | null;
      category?: {
        name?: string | null;
      };
    };
  };
}

export interface Booking {
  id: string;
  bookingCode?: string | null;
  userId: string;
  partnerId?: string | null;
  partnerEmployeeId?: string | null;
  addressId?: string | null;
  scheduledDate: string;
  scheduledTime: string;
  bookingType: BookingType;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  subtotal: number;
  discountAmount: number;
  taxes: number;
  totalAmount: number;
  estimatedDurationMinutes: number;
  rating?: number | null;
  createdAt: string;
  updatedAt: string;

  user?: BookingUser;
  partner?: BookingPartner;
  address?: BookingAddress;
  items?: BookingItemDetail[];
  payment?: BookingPayment;
}
