// These types mirror the real backend Prisma models (see wellness-backend/prisma/schema/catalog.prisma)
// and the admin DTOs (see wellness-backend/src/modules/catalog/dtos/**). Keep them in sync with those.

export type MediaType = 'IMAGE' | 'VIDEO';
export type ServiceCardTemplate = 'REGULAR' | 'PREMIUM';

export interface ServiceDuration {
  id: string;
  serviceItemId?: string;
  label: string; // e.g. "90 mins"
  durationMinutes: number;
  price: number; // e.g. 1199
  discountedPrice?: number | null;
  isDefault?: boolean;
  displayOrder?: number;
}

export interface ServicePackage {
  id: string;
  serviceItemId?: string;
  label: string;
  sessions: number; // e.g. 1, 4, 8
  price: number; // e.g. 1199, 4319, 6316
  pricePerSession: number;
  originalPrice?: number | null; // e.g. 4319
  savings?: number | null; // e.g. 480
  savingsPercent?: number | null; // e.g. 10
  badgeText?: string | null;
  isPopular?: boolean;
  displayOrder?: number;
}

export interface ServiceAddOn {
  id: string;
  serviceItemId: string;
  name: string;
  description?: string;
  price: number;
  imageKey: string;
  extraMinutes?: number;
  isActive?: boolean;
  displayOrder?: number;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface ImageCardItem {
  id?: string;
  title: string;
  subtitle?: string;
  image: string;
}

export interface ReviewItem {
  id?: string;
  name: string;
  content: string;
  displayOrder?: number;
  image?: string;
}

export interface ServiceItem {
  id: string;
  subCategoryId: string;
  name: string;
  slug: string;
  thumbnailKey?: string;
  thumbnailType?: MediaType;
  cardTitle: string;
  cardSubtitle?: string;
  cardTemplate?: ServiceCardTemplate;
  shortDescription?: string;
  tags?: string[];
  isActive: boolean;
  isPublished: boolean;
  displayOrder: number;

  // JSON content columns on ServiceItem (see catalog.prisma / CreateServiceItemDto) that the
  // admin panel's editor actually uses. There are more columns on the model
  // (freeGifts, includedItems, ambienceItems, hygieneEssentials, careItems, thingsToKnow,
  // beforeYouBook) with no editor section — leave those alone rather than guessing a mapping.
  features?: string[];
  overview?: { text?: string; gallery?: ImageCardItem[] };
  procedureSteps?: ImageCardItem[];
  itemsUsed?: ImageCardItem[];
  skilledPros?: string[];
  prePostCare?: string[];
  disclaimer?: string[];
  whatsIncluded?: ImageCardItem[];
  faqs?: FaqItem[];
  trustedLoved?: string[];
  reviews?: ReviewItem[];
  customReviews?: ReviewItem[];

  // Denormalized, recomputed server-side by ReviewService — read-only here.
  averageRating?: number;
  totalReviews?: number;

  // Not embedded by the backend list/detail endpoints — fetch separately
  // via getServiceDurationsServerAction/getServicePackagesServerAction/getServiceAddOnsServerAction.
  durations?: ServiceDuration[];
  packages?: ServicePackage[];
  addOns?: ServiceAddOn[];

  subCategory?: ServiceSubCategory;
}

export interface ServiceSubCategory {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  title: string;
  subtitle?: string;
  iconKey?: string;
  homeBannerKey?: string;
  homeBannerType?: MediaType;
  displayOrder: number;
  isActive: boolean;
  // Not returned by the backend — computed client-side from the loaded serviceItems list.
  servicesCount?: number;
  category?: ServiceCategory;
}

export interface ServiceCategory {
  id: string;
  name: string;
  slug: string;
  title: string;
  subtitle?: string;
  iconKey?: string;
  homeBannerKey?: string;
  homeBannerType?: MediaType;
  displayOrder: number;
  isActive: boolean;
  // Not returned by the backend — computed client-side from the loaded subCategories/serviceItems lists.
  subCategoriesCount?: number;
  servicesCount?: number;
}
