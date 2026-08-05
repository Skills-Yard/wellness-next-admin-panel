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

// ---- Zones (see wellness-backend/prisma/schema/zone.prisma) ----
// Zones themselves are created/managed outside this admin panel — these types only cover
// reading the zone list and configuring per-zone availability/pricing overrides on catalogue
// entities that already exist.

export interface OperationalZone {
  id: string;
  name: string;
  city: string;
  country?: string;
  countryCode?: string;
  currency?: string;
  isActive: boolean;
}

export interface ZoneServiceItemConfig {
  id: string;
  zoneId: string;
  serviceItemId: string;
  isAvailable: boolean;
  surgeMultiplier: number;
  zone?: OperationalZone;
}

export interface ZoneDurationConfig {
  id: string;
  zoneId: string;
  serviceDurationId: string;
  price: number; // minor units
  discountedPrice?: number | null;
  zone?: OperationalZone;
}

export interface ZonePackageConfig {
  id: string;
  zoneId: string;
  servicePackageId: string;
  price: number; // minor units
  originalPrice?: number | null;
  savings?: number | null;
  savingsPercent?: number | null;
  zone?: OperationalZone;
}

export interface ZoneAddOnConfig {
  id: string;
  zoneId: string;
  serviceAddOnId: string;
  price: number;
  zone?: OperationalZone;
}

// ---- Promotional Campaigns (see wellness-backend/prisma/schema/catalog.prisma) ----

export type CampaignType = 'SPOTLIGHT' | 'HIGHLIGHT_VIDEO' | 'HIGHLIGHT_BANNER' | 'CAROUSEL';
export type CampaignTargetType = 'GLOBAL' | 'CATEGORY' | 'SUBCATEGORY';

export interface PromotionalCampaign {
  id: string;
  type: CampaignType;
  targetType: CampaignTargetType;
  categoryId?: string | null;
  subCategoryId?: string | null;
  serviceItemId?: string | null;
  zoneId?: string | null;
  title?: string | null;
  subtitle?: string | null;
  mediaType: MediaType;
  s3Key: string;
  cdnUrl?: string | null;
  ctaText?: string | null;
  ctaDeeplink?: string | null;
  displayOrder: number;
  isActive: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
  createdAt?: string;
  updatedAt?: string;

  category?: ServiceCategory | null;
  subCategory?: ServiceSubCategory | null;
  serviceItem?: ServiceItem | null;
  zone?: OperationalZone | null;
}
