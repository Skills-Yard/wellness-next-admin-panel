import { User } from '../../types/user';
import { Booking } from '../../types/booking';
import { Partner } from '../../types/partner';
import { OperationalZone } from '../../types/catalogue';

// A booking only counts toward money-in-the-bank figures (Total Earnings, Average Order Value,
// per-service/per-city revenue) once its payment has actually gone through — everything else
// (pending payment, failed, refunded) is booked interest, not collected revenue.
//
// The real /admin/bookings/all response carries payment state on the NESTED `payment.status`
// (Razorpay-style: "PENDING"/"CAPTURED"/...) — there is no top-level `paymentStatus` on the
// booking itself despite the older type guess. `booking.paymentStatus` is checked too, only as a
// defensive fallback in case some other endpoint does populate it; it is never the primary
// signal. "COMPLETED"/"PAID" are accepted alongside "CAPTURED" for the same reason.
const EARNING_PAYMENT_STATUSES = new Set(['CAPTURED', 'COMPLETED', 'PAID']);
const isEarningBooking = (b: Booking) => {
  const status = (b.payment?.status || b.paymentStatus || '').toUpperCase();
  return EARNING_PAYMENT_STATUSES.has(status);
};

// "vs last month" comparison result for one stat card. `previous === 0` can't produce a sane
// percent (division by zero, or a meaningless "+∞%"), so that case is surfaced as 'new' instead
// of faked into a number.
export type Trend =
  | { kind: 'percent'; percent: number }
  | { kind: 'new' }
  | { kind: 'none' };

function computeTrend(current: number, previous: number): Trend {
  if (previous === 0) return current === 0 ? { kind: 'none' } : { kind: 'new' };
  return { kind: 'percent', percent: ((current - previous) / previous) * 100 };
}

function monthBounds(monthsAgo: number) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1);
  const end = new Date(now.getFullYear(), now.getMonth() - monthsAgo + 1, 1);
  return { start, end };
}

function inRange(dateStr: string | undefined | null, start: Date, end: Date): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  return d >= start && d < end;
}

function before(dateStr: string | undefined | null, cutoff: Date): boolean {
  if (!dateStr) return false;
  return new Date(dateStr) < cutoff;
}

function sum(nums: number[]): number {
  return nums.reduce((total, n) => total + (n || 0), 0);
}

function categoryOf(item: NonNullable<Booking['items']>[number]): string {
  return item.categoryName || item.serviceItem?.subCategory?.category?.name || 'Other';
}

// `status` is typed as plain string, not BookingStatus — real data has already shown a value
// ("NO_PARTNER_FOUND") outside the set this admin panel's types originally assumed, and there
// will likely be more. Anything not recognized below falls into "Other" rather than being
// silently folded into an existing bucket (e.g. mislabeling an unrecognized status as "Refunded"
// would actively mislead, not just be incomplete).
export function statusBucket(status: string): string {
  switch (status) {
    case 'COMPLETED':
      return 'Completed';
    case 'CONFIRMED':
    case 'ASSIGNING_PARTNER':
    case 'PARTNER_ASSIGNED':
    case 'PARTNER_EN_ROUTE':
    case 'PARTNER_ARRIVED':
    case 'IN_PROGRESS':
      return 'Confirmed & In Progress';
    case 'PENDING_PAYMENT':
      return 'Pending Payment';
    case 'CANCELLED':
    case 'EXPIRED':
    case 'NO_PARTNER_FOUND':
      return 'Cancelled';
    case 'REFUNDED':
      return 'Refunded';
    default:
      return 'Other';
  }
}

// Monday of the week containing `d`, at local midnight — used to bucket bookings into weeks for
// the "Bookings Overview" chart.
function weekStart(d: Date): Date {
  const copy = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const day = copy.getDay(); // 0=Sun..6=Sat
  const diff = day === 0 ? -6 : 1 - day; // shift back to Monday
  copy.setDate(copy.getDate() + diff);
  return copy;
}

function shortDate(d: Date): string {
  return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
}

export interface StatCard {
  value: number;
  trend: Trend;
}

export interface DashboardStats {
  totalCustomers: StatCard;
  totalBookings: StatCard;
  totalEarnings: StatCard;
  avgOrderValue: StatCard;
  activePartners: StatCard;
  operationalZones: { value: number; newThisMonth: number };

  earningsTimeline: { date: string; earnings: number }[];
  categoryBreakdown: { label: string; count: number; percent: number }[];
  statusBreakdown: { label: string; count: number; percent: number }[];
  newVsReturning: { newCustomers: number; returningCustomers: number };
  bookingsOverview: { label: string; bookings: number; completed: number }[];
  topServices: { name: string; category: string; bookings: number; revenue: number; trend: Trend }[];
  topCities: { city: string; bookings: number; revenue: number }[];
  recentBookings: Booking[];
}

export function computeDashboardStats(
  users: User[],
  bookings: Booking[],
  partners: Partner[],
  zones: OperationalZone[]
): DashboardStats {
  const thisMonth = monthBounds(0);
  const lastMonth = monthBounds(1);
  const bookingsThisMonth = bookings.filter((b) => inRange(b.createdAt, thisMonth.start, thisMonth.end));
  const bookingsLastMonth = bookings.filter((b) => inRange(b.createdAt, lastMonth.start, lastMonth.end));

  // ---- Total Customers — a running total, so its trend compares the cumulative count now
  // against the cumulative count as of a month ago (not just this month's new signups). ----
  const totalCustomers = users.length;
  const customersAsOfLastMonth = users.filter((u) => before(u.createdAt, thisMonth.start)).length;

  // ---- Total Bookings / Earnings / AOV — flow metrics, so "vs last month" compares this
  // month's bucket to last month's bucket. ----
  const totalBookings = bookings.length;
  const earningBookings = bookings.filter(isEarningBooking);
  const totalEarnings = sum(earningBookings.map((b) => b.totalAmount));
  const earningsThisMonth = sum(bookingsThisMonth.filter(isEarningBooking).map((b) => b.totalAmount));
  const earningsLastMonth = sum(bookingsLastMonth.filter(isEarningBooking).map((b) => b.totalAmount));

  const avgOrderValue = earningBookings.length > 0 ? totalEarnings / earningBookings.length : 0;
  const earningBookingsThisMonth = bookingsThisMonth.filter(isEarningBooking);
  const earningBookingsLastMonth = bookingsLastMonth.filter(isEarningBooking);
  const aovThisMonth = earningBookingsThisMonth.length > 0 ? earningsThisMonth / earningBookingsThisMonth.length : 0;
  const aovLastMonth = earningBookingsLastMonth.length > 0 ? earningsLastMonth / earningBookingsLastMonth.length : 0;

  // ---- Active Partners — there's no history of who was active as of a past date (isActive is
  // a live flag, not a snapshot), so this approximates "network growth" via signup cohort: active
  // partners whose account predates the cutoff. It undercounts if an active partner joined after
  // last month's cutoff but overcounts if one active today only recently reactivated — a
  // reasonable proxy given what the API exposes, not a precise historical reconstruction. ----
  const activePartners = partners.filter((p) => p.isActive);
  const activePartnersAsOfLastMonth = activePartners.filter((p) => before(p.createdAt, thisMonth.start)).length;

  // ---- Operational Zones — the reference design shows an absolute "N new this month" rather
  // than a percent, which also sidesteps the same "no historical isActive" problem. ----
  const newZonesThisMonth = zones.filter((z) => inRange(z.createdAt, thisMonth.start, thisMonth.end)).length;

  // ---- Earnings timeline — daily, last 30 days ----
  const earningsByDay = new Map<string, number>();
  const dayCount = 30;
  const dayKeys: string[] = [];
  for (let i = dayCount - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    dayKeys.push(key);
    earningsByDay.set(key, 0);
  }
  earningBookings.forEach((b) => {
    const key = (b.createdAt || '').slice(0, 10);
    if (earningsByDay.has(key)) earningsByDay.set(key, (earningsByDay.get(key) || 0) + b.totalAmount);
  });
  const earningsTimeline = dayKeys.map((key) => ({
    date: shortDate(new Date(key)),
    earnings: earningsByDay.get(key) || 0,
  }));

  // ---- Bookings by Service Category (item-level — a booking with 3 items in 2 categories
  // counts once per item, not once per booking) ----
  const categoryCounts = new Map<string, number>();
  bookings.forEach((b) => (b.items || []).forEach((item) => {
    const cat = categoryOf(item);
    categoryCounts.set(cat, (categoryCounts.get(cat) || 0) + 1);
  }));
  const totalCategoryItems = sum(Array.from(categoryCounts.values()));
  const sortedCategories = Array.from(categoryCounts.entries()).sort((a, b) => b[1] - a[1]);
  // Cap at 5 slices (matches the validated 5-slot palette) — anything past the top 4 folds into "Others".
  const topCategories = sortedCategories.slice(0, 4);
  const otherCategoryCount = sum(sortedCategories.slice(4).map(([, c]) => c));
  const categoryRows = [...topCategories, ...(otherCategoryCount > 0 ? [['Others', otherCategoryCount] as [string, number]] : [])];
  const categoryBreakdown = categoryRows.map(([label, count]) => ({
    label,
    count,
    percent: totalCategoryItems > 0 ? (count / totalCategoryItems) * 100 : 0,
  }));

  // ---- Bookings by Status ----
  const statusCounts = new Map<string, number>();
  bookings.forEach((b) => {
    const bucket = statusBucket(b.status);
    statusCounts.set(bucket, (statusCounts.get(bucket) || 0) + 1);
  });
  const statusOrder = ['Completed', 'Confirmed & In Progress', 'Pending Payment', 'Cancelled', 'Refunded', 'Other'];
  const statusBreakdown = statusOrder
    .map((label) => ({ label, count: statusCounts.get(label) || 0 }))
    .filter((row) => row.count > 0)
    .map((row) => ({ ...row, percent: totalBookings > 0 ? (row.count / totalBookings) * 100 : 0 }));

  // ---- New vs Returning Customers — classifies EVERY customer (so the two slices always sum
  // to Total Customers): 2+ lifetime bookings = returning, 0 or 1 = new/first-timer. ----
  const bookingCountByUser = new Map<string, number>();
  bookings.forEach((b) => bookingCountByUser.set(b.userId, (bookingCountByUser.get(b.userId) || 0) + 1));
  let returningCustomers = 0;
  users.forEach((u) => {
    if ((bookingCountByUser.get(u.id) || 0) >= 2) returningCustomers += 1;
  });
  const newCustomers = totalCustomers - returningCustomers;

  // ---- Bookings Overview — weekly, last 6 weeks ----
  const weekCount = 6;
  const weekBuckets: { start: Date; bookings: number; completed: number }[] = [];
  const currentWeekStart = weekStart(new Date());
  for (let i = weekCount - 1; i >= 0; i--) {
    const start = new Date(currentWeekStart);
    start.setDate(start.getDate() - i * 7);
    weekBuckets.push({ start, bookings: 0, completed: 0 });
  }
  bookings.forEach((b) => {
    if (!b.createdAt) return;
    const ws = weekStart(new Date(b.createdAt)).getTime();
    const bucket = weekBuckets.find((wb) => wb.start.getTime() === ws);
    if (!bucket) return;
    bucket.bookings += 1;
    if (b.status === 'COMPLETED') bucket.completed += 1;
  });
  const bookingsOverview = weekBuckets.map((wb) => ({
    label: shortDate(wb.start),
    bookings: wb.bookings,
    completed: wb.completed,
  }));

  // ---- Top Performing Services ----
  interface ServiceAgg {
    name: string;
    category: string;
    bookings: number;
    revenue: number;
    bookingsThisMonth: number;
    bookingsLastMonth: number;
  }
  const serviceAgg = new Map<string, ServiceAgg>();
  bookings.forEach((b) => {
    const earning = isEarningBooking(b);
    const inThisMonth = inRange(b.createdAt, thisMonth.start, thisMonth.end);
    const inLastMonth = inRange(b.createdAt, lastMonth.start, lastMonth.end);
    (b.items || []).forEach((item) => {
      const name = item.serviceItemName || item.serviceItem?.name || 'Unknown service';
      const existing = serviceAgg.get(name) || {
        name,
        category: categoryOf(item),
        bookings: 0,
        revenue: 0,
        bookingsThisMonth: 0,
        bookingsLastMonth: 0,
      };
      existing.bookings += 1;
      if (earning) existing.revenue += item.customPrice || 0;
      if (inThisMonth) existing.bookingsThisMonth += 1;
      if (inLastMonth) existing.bookingsLastMonth += 1;
      serviceAgg.set(name, existing);
    });
  });
  const topServices = Array.from(serviceAgg.values())
    .sort((a, b) => b.bookings - a.bookings)
    .slice(0, 5)
    .map((s) => ({
      name: s.name,
      category: s.category,
      bookings: s.bookings,
      revenue: s.revenue,
      trend: computeTrend(s.bookingsThisMonth, s.bookingsLastMonth),
    }));

  // ---- Top Cities by Bookings ----
  interface CityAgg {
    city: string;
    bookings: number;
    revenue: number;
  }
  const cityAgg = new Map<string, CityAgg>();
  bookings.forEach((b) => {
    const city = b.address?.city || 'Unknown';
    const existing = cityAgg.get(city) || { city, bookings: 0, revenue: 0 };
    existing.bookings += 1;
    if (isEarningBooking(b)) existing.revenue += b.totalAmount;
    cityAgg.set(city, existing);
  });
  const topCities = Array.from(cityAgg.values())
    .sort((a, b) => b.bookings - a.bookings)
    .slice(0, 5);

  // ---- Recent Bookings ----
  const recentBookings = [...bookings]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6);

  return {
    totalCustomers: { value: totalCustomers, trend: computeTrend(totalCustomers, customersAsOfLastMonth) },
    totalBookings: { value: totalBookings, trend: computeTrend(bookingsThisMonth.length, bookingsLastMonth.length) },
    totalEarnings: { value: totalEarnings, trend: computeTrend(earningsThisMonth, earningsLastMonth) },
    avgOrderValue: { value: avgOrderValue, trend: computeTrend(aovThisMonth, aovLastMonth) },
    activePartners: { value: activePartners.length, trend: computeTrend(activePartners.length, activePartnersAsOfLastMonth) },
    operationalZones: { value: zones.length, newThisMonth: newZonesThisMonth },

    earningsTimeline,
    categoryBreakdown,
    statusBreakdown,
    newVsReturning: { newCustomers, returningCustomers },
    bookingsOverview,
    topServices,
    topCities,
    recentBookings,
  };
}
