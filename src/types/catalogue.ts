export interface ServiceDuration {
  id: string;
  serviceItemId?: string;
  label: string; // e.g. "90 mins"
  durationMinutes: number;
  price: number; // e.g. 1199
  discountedPrice?: number;
  isDefault?: boolean;
  displayOrder?: number;
}

export interface ServicePackage {
  id: string;
  serviceItemId?: string;
  label?: string;
  sessions: number; // e.g. 1, 4, 8
  price: number; // e.g. 1199, 4319, 6316
  pricePerSession?: number;
  originalPrice?: number; // e.g. 4319
  savings?: number; // e.g. 480
  savingsPercent?: number; // e.g. 10
  badgeText?: string;
  isPopular?: boolean;
  displayOrder?: number;
}

export interface ServiceItem {
  id: string;
  subCategoryId: string;
  categoryId?: string;
  name: string;
  slug: string;
  thumbnailKey?: string;
  cardTitle: string;
  cardSubtitle?: string;
  shortDescription?: string;
  isActive: boolean;
  isPublished: boolean;
  displayOrder: number;
  isMainCard?: boolean;
  durations: ServiceDuration[];
  packages: ServicePackage[];
  features?: any;
  overview?: any;
  procedureSteps?: any;
  itemsUsed?: any;
  skilledPros?: any;
  prePostCare?: any;
  whatsIncluded?: any;
  faqs?: any;
  trustedLoved?: any;
  reviews?: any;
  customReviews?: any;
  disclaimer?: any;
  addOns?: any[];
}

export interface ServiceSubCategory {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  title: string;
  subtitle?: string;
  shortDescription?: string;
  iconKey?: string;
  homeBannerKey?: string;
  displayOrder: number;
  isActive: boolean;
  servicesCount?: number;
  serviceItems?: ServiceItem[];
}

export interface ServiceCategory {
  id: string;
  name: string;
  slug: string;
  title: string;
  subtitle?: string;
  shortDescription?: string;
  iconKey?: string;
  displayOrder: number;
  isActive: boolean;
  subCategoriesCount?: number;
  servicesCount?: number;
  subCategories?: ServiceSubCategory[];
}
