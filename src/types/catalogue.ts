// These types mirror the real backend Prisma models (see wellness-backend/prisma/schema/catalog.prisma)
// and the admin DTOs (see wellness-backend/src/modules/catalog/dtos/**). Keep them in sync with those.

export type MediaType = 'IMAGE' | 'VIDEO';
export type ServiceCardTemplate = 'REGULAR' | 'PREMIUM';

// Present only on rows returned by the admin "get all" (no serviceItemId) endpoints —
// identifies which service a duration/pack/add-on belongs to, for cross-service pickers.
export interface ServiceItemRef {
  id: string;
  name: string;
}

export interface ServiceDuration {
  id: string;
  serviceItemId?: string;
  label: string; // e.g. "90 mins"
  durationMinutes: number;
  price: number; // e.g. 1199
  discountedPrice?: number | null;
  isDefault?: boolean;
  displayOrder?: number;
  serviceItem?: ServiceItemRef;
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
  serviceItem?: ServiceItemRef;
}

export interface ServiceAddOn {
  id: string;
  name: string;
  description?: string;
  price: number;
  imageKey: string;
  extraMinutes?: number;
  isActive?: boolean;
  displayOrder?: number;
  // Many-to-many (see catalog.prisma ServiceAddOn.serviceItems): the same add-on row can be
  // shared across several service items instead of being cloned per item. Present on rows from
  // findAll (getServiceAddOnsServerAction/getAllServiceAddOnsServerAction) — NOT present on
  // getServiceAddOnById, whose repository call doesn't include the relation.
  serviceItems?: ServiceItemRef[];
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
  genderId: string;
  suiteId: string;
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
  gender?: ServiceGender;
  suite?: ServiceSuite;
}

// Fixed classification (code is MALE/FEMALE, unique per row — see ServiceGenderType in
// wellness-backend/prisma/schema/enums.prisma) but otherwise a marketing-content row just like
// ServiceCategory (title/subtitle/icon/banner). Not scoped to a category — shared globally.
export type ServiceGenderCode = 'MALE' | 'FEMALE';

export interface ServiceGender {
  id: string;
  code: ServiceGenderCode;
  name: string;
  slug: string;
  title: string;
  subtitle?: string;
  sectionHeading?: string;
  sectionSubheading?: string;
  iconKey?: string;
  homeBannerKey?: string;
  homeBannerType?: MediaType;
  displayOrder: number;
  isActive: boolean;
}

// Scoped to a ServiceCategory, same relationship shape as ServiceSubCategory.
export interface ServiceSuite {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  title: string;
  subtitle?: string;
  sectionHeading?: string;
  sectionSubheading?: string;
  iconKey?: string;
  homeBannerKey?: string;
  homeBannerType?: MediaType;
  displayOrder: number;
  isActive: boolean;
  category?: ServiceCategory;
}

export interface ServiceSubCategory {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  title: string;
  subtitle?: string;
  sectionHeading?: string;
  sectionSubheading?: string;
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
  sectionHeading?: string;
  sectionSubheading?: string;
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

export interface Coordinate {
  latitude: number;
  longitude: number;
}

export interface OperationalZoneHex {
  id: string;
  zoneId: string;
  h3Index: string;
}

export interface OperationalZone {
  id: string;
  name: string;
  city: string;
  country?: string;
  countryCode?: string;
  currency?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  // Only present once fetched via the read endpoints — added server-side in zone.repository.ts
  // so the admin panel can actually show what a zone covers after it's created.
  hexes?: OperationalZoneHex[];
}

export interface ZoneServiceItemConfig {
  id: string;
  zoneId: string;
  serviceItemId: string;
  isAvailable: boolean;
  surgeMultiplier: number;
  zone?: OperationalZone;
  // Joined by the backend (findZoneServiceItemConfigs includes serviceItem: true).
  serviceItem?: { id: string; name: string };
}

export interface ZoneDurationConfig {
  id: string;
  zoneId: string;
  serviceDurationId: string;
  price: number; // minor units
  discountedPrice?: number | null;
  zone?: OperationalZone;
  // Joined by the backend (findZoneDurationConfigs includes serviceDuration: true).
  serviceDuration?: { id: string; label: string; serviceItemId: string };
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
  // Joined by the backend (findZonePackageConfigs includes servicePackage: true).
  servicePackage?: { id: string; label: string; sessions: number; serviceItemId: string };
}

export interface ZoneAddOnConfig {
  id: string;
  zoneId: string;
  serviceAddOnId: string;
  price: number;
  zone?: OperationalZone;
  // Joined by the backend (findZoneAddOnConfigs includes serviceAddOn: true) — a bare scalar
  // include, so no serviceItemId/serviceItems here. Add-ons are shared across service items now,
  // so there's no single "owning" service to reference anyway.
  serviceAddOn?: { id: string; name: string };
}

// Controls, per zone, which Suites are available for that category's browse flow (see
// ZoneSuiteConfig in wellness-backend/prisma/schema/zone.prisma). No pricing — availability only.
export interface ZoneSuiteConfig {
  id: string;
  zoneId: string;
  suiteId: string;
  isAvailable: boolean;
  zone?: OperationalZone;
  // Joined by the backend (findZoneSuiteConfigs includes suite: true).
  suite?: ServiceSuite;
}

// ---- Promotional Campaigns (see wellness-backend/prisma/schema/catalog.prisma) ----

// 'CAROUSEL' is a deprecated legacy value still accepted by the backend enum
// (existing rows were migrated off it) — intentionally left out here so the
// admin UI can no longer create new campaigns with it.
export type CampaignType =
  | 'SPOTLIGHT'
  | 'HIGHLIGHT_VIDEO'
  | 'HIGHLIGHT_BANNER'
  | 'CAROUSEL_VIDEO'
  | 'CAROUSEL_BANNER';
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
  highlightText?: string | null;
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
