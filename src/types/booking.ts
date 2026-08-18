// Widened with `| (string & {})` on both types below — /admin/bookings/all has been observed
// returning values not in these lists (e.g. status "NO_PARTNER_FOUND"), so treating this as a
// closed enum silently mis-groups anything new. The named literals still drive autocomplete;
// unknown values just fall through typed as string instead of erroring.
export type BookingStatus =
  | 'PENDING_PAYMENT'
  | 'CONFIRMED'
  | 'ASSIGNING_PARTNER'
  | 'NO_PARTNER_FOUND'
  | 'PARTNER_ASSIGNED'
  | 'PARTNER_EN_ROUTE'
  | 'PARTNER_ARRIVED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'REFUNDED'
  | (string & {});

export type BookingType = 'ON_DEMAND' | 'SCHEDULED' | 'RECURRING_INSTANCE';
// Gateway-reported status on BookingPayment.status (Razorpay-style: PENDING/CAPTURED/FAILED/
// REFUNDED, not the COMPLETED/FAILED/REFUNDED guess this used to be) — kept only as a loose
// reference; nothing on Booking itself carries a top-level paymentStatus (see below).
export type PaymentStatus = 'PENDING' | 'CAPTURED' | 'AUTHORIZED' | 'FAILED' | 'REFUNDED' | (string & {});

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
  // Real field name on /admin/bookings/all (partnerEmployeeId above isn't actually sent there) —
  // added alongside rather than renaming, so this doesn't move whatever partnerEmployeeId's
  // existing callers already reference elsewhere.
  assignedEmployeeId?: string | null;
  addressId?: string | null;
  scheduledDate: string;
  scheduledTime: string;
  bookingType: BookingType;
  status: BookingStatus;
  // NOT actually present on /admin/bookings/all's rows (confirmed against a real response) —
  // whether money was collected lives on `payment.status` instead (see BookingPayment below).
  // Left optional rather than removed in case some other endpoint does populate it.
  paymentStatus?: PaymentStatus;
  subtotal: number;
  discountAmount: number;
  // Also not present on /admin/bookings/all — that endpoint sends platformFee instead. Left
  // optional for the same reason as paymentStatus above.
  taxes?: number;
  platformFee?: number;
  partnerEarning?: number;
  totalAmount: number;
  estimatedDurationMinutes: number;
  rating?: number | null;
  completedAt?: string | null;
  cancelledAt?: string | null;
  createdAt: string;
  updatedAt: string;

  user?: BookingUser;
  partner?: BookingPartner;
  address?: BookingAddress;
  items?: BookingItemDetail[];
  payment?: BookingPayment;
}
