'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  ServiceCategory,
  ServiceSubCategory,
  ServiceItem,
  ServiceDuration,
  ServicePackage,
  ServiceAddOn,
  OperationalZone,
  ZoneServiceItemConfig,
  ZoneDurationConfig,
  ZonePackageConfig,
  ZoneAddOnConfig,
} from '../types/catalogue';
import { useAuth } from './AuthContext';
import {
  getCategoriesServerAction,
  saveCategoryServerAction,
  updateCategoryStatusServerAction,
  updateCategorySlugServerAction,
  deleteCategoryServerAction,
  CategoryPayload,
} from '../lib/server-actions/category';
import {
  getSubCategoriesServerAction,
  saveSubCategoryServerAction,
  updateSubCategoryStatusServerAction,
  updateSubCategorySlugServerAction,
  deleteSubCategoryServerAction,
  SubCategoryPayload,
} from '../lib/server-actions/sub-category';
import {
  getServiceItemsServerAction,
  saveServiceItemServerAction,
  updateServiceItemStatusServerAction,
  updateServiceItemSlugServerAction,
  updateServiceItemPublishStatusServerAction,
  deleteServiceItemServerAction,
  ServiceItemPayload,
} from '../lib/server-actions/service';
import {
  getServiceDurationsServerAction,
  saveServiceDurationServerAction,
  deleteServiceDurationServerAction,
} from '../lib/server-actions/duration';
import {
  getServicePackagesServerAction,
  saveServicePackageServerAction,
  deleteServicePackageServerAction,
} from '../lib/server-actions/package';
import {
  getServiceAddOnsServerAction,
  saveServiceAddOnServerAction,
  deleteServiceAddOnServerAction,
} from '../lib/server-actions/addon';
import {
  getZonesServerAction,
  getZoneServiceItemConfigsServerAction,
  saveZoneServiceItemConfigServerAction,
  deleteZoneServiceItemConfigServerAction,
  ZoneServiceItemConfigPayload,
  getZoneDurationConfigsServerAction,
  saveZoneDurationConfigServerAction,
  deleteZoneDurationConfigServerAction,
  ZoneDurationConfigPayload,
  getZonePackageConfigsServerAction,
  saveZonePackageConfigServerAction,
  deleteZonePackageConfigServerAction,
  ZonePackageConfigPayload,
  getZoneAddOnConfigsServerAction,
  saveZoneAddOnConfigServerAction,
  deleteZoneAddOnConfigServerAction,
  ZoneAddOnConfigPayload,
} from '../lib/server-actions/zone';

type ActionResponse = { ok: boolean; message?: string };

interface CatalogueContextType {
  loading: boolean;
  activeView: 'categories' | 'service-detail';
  setActiveView: (view: 'categories' | 'service-detail') => void;

  categories: ServiceCategory[];
  selectedCategory: ServiceCategory | null;
  setSelectedCategory: (cat: ServiceCategory | null) => void;

  subCategories: ServiceSubCategory[];
  selectedSubCategory: ServiceSubCategory | null;
  setSelectedSubCategory: (sub: ServiceSubCategory | null) => void;

  serviceItems: ServiceItem[];
  selectedServiceItem: ServiceItem | null;
  setSelectedServiceItem: (item: ServiceItem | null) => void;

  // Zones are managed outside this admin panel — this is a read-only list for zone pickers.
  // The four config lists hold every row across every zone (the backend has no
  // serviceItemId/durationId filter) — callers filter client-side by the entity they need.
  zones: OperationalZone[];
  zoneServiceItemConfigs: ZoneServiceItemConfig[];
  zoneDurationConfigs: ZoneDurationConfig[];
  zonePackageConfigs: ZonePackageConfig[];
  zoneAddOnConfigs: ZoneAddOnConfig[];

  // Durations/packages/add-ons are NOT embedded in the service-item list/detail response —
  // the backend requires a dedicated GET with serviceItemId for each. These track whichever
  // service is currently selected, and refetch whenever selectedServiceItem changes.
  serviceDurations: ServiceDuration[];
  servicePackages: ServicePackage[];
  serviceAddOns: ServiceAddOn[];
  serviceDetailLoading: boolean;

  // Modals state
  categoryModalOpen: boolean;
  setCategoryModalOpen: (open: boolean) => void;
  categoryModalMode: 'category' | 'subcategory';
  modalEditData: ServiceCategory | ServiceSubCategory | null;
  openCategoryModal: (mode: 'category' | 'subcategory', data?: ServiceCategory | ServiceSubCategory | null) => void;

  // Navigation
  navigateToServiceDetail: (subCategory: ServiceSubCategory) => void;

  // Server Actions CRUD returning { ok: boolean, message?: string }
  refreshData: () => Promise<void>;
  saveCategory: (data: Partial<ServiceCategory>) => Promise<ActionResponse>;
  updateCategoryStatus: (id: string, isActive: boolean) => Promise<ActionResponse>;
  deleteCategory: (id: string) => Promise<ActionResponse>;

  saveSubCategory: (data: Partial<ServiceSubCategory>) => Promise<ActionResponse>;
  updateSubCategoryStatus: (id: string, isActive: boolean) => Promise<ActionResponse>;
  deleteSubCategory: (id: string) => Promise<ActionResponse>;

  saveServiceItem: (data: Partial<ServiceItem>) => Promise<ActionResponse>;
  updateServiceItemStatus: (id: string, isActive: boolean) => Promise<ActionResponse>;
  updateServiceItemPublishStatus: (id: string, isPublished: boolean) => Promise<ActionResponse>;
  deleteServiceItem: (id: string) => Promise<ActionResponse>;

  // Timeslots & Packs & Add-ons management
  addDurationToService: (serviceId: string, duration: Omit<ServiceDuration, 'id'>) => Promise<ActionResponse>;
  deleteDurationFromService: (serviceId: string, durationId: string) => Promise<ActionResponse>;
  addPackageToService: (serviceId: string, pkg: Omit<ServicePackage, 'id'>) => Promise<ActionResponse>;
  deletePackageFromService: (serviceId: string, packageId: string) => Promise<ActionResponse>;
  addAddOnToService: (serviceId: string, addon: Omit<ServiceAddOn, 'id' | 'serviceItemId'>) => Promise<ActionResponse>;
  deleteAddOnFromService: (serviceId: string, addonId: string) => Promise<ActionResponse>;

  // Zone availability & pricing overrides
  saveZoneServiceItemConfig: (id: string | null, data: ZoneServiceItemConfigPayload) => Promise<ActionResponse>;
  deleteZoneServiceItemConfig: (id: string) => Promise<ActionResponse>;
  saveZoneDurationConfig: (id: string | null, data: ZoneDurationConfigPayload) => Promise<ActionResponse>;
  deleteZoneDurationConfig: (id: string) => Promise<ActionResponse>;
  saveZonePackageConfig: (id: string | null, data: ZonePackageConfigPayload) => Promise<ActionResponse>;
  deleteZonePackageConfig: (id: string) => Promise<ActionResponse>;
  saveZoneAddOnConfig: (id: string | null, data: ZoneAddOnConfigPayload) => Promise<ActionResponse>;
  deleteZoneAddOnConfig: (id: string) => Promise<ActionResponse>;
}

const CatalogueContext = createContext<CatalogueContextType | undefined>(undefined);

const isDraftId = (id?: string | null, prefix?: string) => !!id && !!prefix && id.startsWith(prefix);

export const CatalogueProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'categories' | 'service-detail'>('categories');

  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | null>(null);

  const [subCategories, setSubCategories] = useState<ServiceSubCategory[]>([]);
  const [selectedSubCategory, setSelectedSubCategory] = useState<ServiceSubCategory | null>(null);

  const [serviceItems, setServiceItems] = useState<ServiceItem[]>([]);
  const [selectedServiceItem, setSelectedServiceItem] = useState<ServiceItem | null>(null);

  const [zones, setZones] = useState<OperationalZone[]>([]);
  const [zoneServiceItemConfigs, setZoneServiceItemConfigs] = useState<ZoneServiceItemConfig[]>([]);
  const [zoneDurationConfigs, setZoneDurationConfigs] = useState<ZoneDurationConfig[]>([]);
  const [zonePackageConfigs, setZonePackageConfigs] = useState<ZonePackageConfig[]>([]);
  const [zoneAddOnConfigs, setZoneAddOnConfigs] = useState<ZoneAddOnConfig[]>([]);

  const [serviceDurations, setServiceDurations] = useState<ServiceDuration[]>([]);
  const [servicePackages, setServicePackages] = useState<ServicePackage[]>([]);
  const [serviceAddOns, setServiceAddOns] = useState<ServiceAddOn[]>([]);
  const [serviceDetailLoading, setServiceDetailLoading] = useState(false);

  // Modals state
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [categoryModalMode, setCategoryModalMode] = useState<'category' | 'subcategory'>('category');
  const [modalEditData, setModalEditData] = useState<ServiceCategory | ServiceSubCategory | null>(null);

  // Fetch real data from the backend
  const refreshData = async () => {
    setLoading(true);
    try {
      const backendCategories = await getCategoriesServerAction();
      setCategories(backendCategories);
      setSelectedCategory(prev => {
        if (prev) {
          const matched = backendCategories.find(c => c.id === prev.id);
          if (matched) return matched;
        }
        return backendCategories[0] || null;
      });

      const backendSubCats = await getSubCategoriesServerAction();
      setSubCategories(backendSubCats);
      setSelectedSubCategory(prev => {
        if (prev) {
          const matched = backendSubCats.find(s => s.id === prev.id);
          if (matched) return matched;
        }
        return backendSubCats[0] || null;
      });

      const backendServices = await getServiceItemsServerAction();
      setServiceItems(backendServices);
      setSelectedServiceItem(prev => {
        if (prev) {
          const matched = backendServices.find(s => s.id === prev.id);
          if (matched) return matched;
        }
        return backendServices[0] || null;
      });

      const [
        backendZones,
        backendZoneItemConfigs,
        backendZoneDurationConfigs,
        backendZonePackageConfigs,
        backendZoneAddOnConfigs,
      ] = await Promise.all([
        getZonesServerAction(),
        getZoneServiceItemConfigsServerAction(),
        getZoneDurationConfigsServerAction(),
        getZonePackageConfigsServerAction(),
        getZoneAddOnConfigsServerAction(),
      ]);
      setZones(backendZones);
      setZoneServiceItemConfigs(backendZoneItemConfigs);
      setZoneDurationConfigs(backendZoneDurationConfigs);
      setZonePackageConfigs(backendZonePackageConfigs);
      setZoneAddOnConfigs(backendZoneAddOnConfigs);
    } catch (err) {
      console.error('Error fetching backend catalogue data:', err);
    } finally {
      setLoading(false);
    }
  };

  // CatalogueProvider is mounted once at the root layout, above MainLayout's auth gate — it
  // exists (and this effect can fire) before login ever completes. Fetching unconditionally on
  // mount means that first, unauthenticated call is the ONLY automatic fetch that ever happens;
  // logging in afterward never re-triggers it, leaving every list empty. Key the fetch off auth
  // state instead, so it (re)runs once a valid session actually exists.
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading) return;
    if (isAuthenticated) {
      refreshData();
    } else {
      setCategories([]);
      setSubCategories([]);
      setServiceItems([]);
      setSelectedCategory(null);
      setSelectedSubCategory(null);
      setSelectedServiceItem(null);
      setZones([]);
      setZoneServiceItemConfigs([]);
      setZoneDurationConfigs([]);
      setZonePackageConfigs([]);
      setZoneAddOnConfigs([]);
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, authLoading]);

  // Durations/packages/add-ons live on their own endpoints keyed by serviceItemId — refetch
  // whenever the selected service changes. Unsaved local drafts (id starting with "srv-") have
  // nothing to fetch yet.
  const loadServiceDetail = useCallback(async (serviceItemId: string) => {
    setServiceDetailLoading(true);
    try {
      const [durations, packages, addOns] = await Promise.all([
        getServiceDurationsServerAction(serviceItemId),
        getServicePackagesServerAction(serviceItemId),
        getServiceAddOnsServerAction(serviceItemId),
      ]);
      setServiceDurations(durations);
      setServicePackages(packages);
      setServiceAddOns(addOns);
    } finally {
      setServiceDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedServiceItem && !isDraftId(selectedServiceItem.id, 'srv-')) {
      loadServiceDetail(selectedServiceItem.id);
    } else {
      setServiceDurations([]);
      setServicePackages([]);
      setServiceAddOns([]);
    }
  }, [selectedServiceItem?.id, loadServiceDetail]);

  const openCategoryModal = (mode: 'category' | 'subcategory', data?: ServiceCategory | ServiceSubCategory | null) => {
    setCategoryModalMode(mode);
    setModalEditData(data || null);
    setCategoryModalOpen(true);
  };

  const navigateToServiceDetail = (subCat: ServiceSubCategory) => {
    setSelectedSubCategory(subCat);
    const matchedService = serviceItems.find(s => s.subCategoryId === subCat.id);
    setSelectedServiceItem(matchedService || null);
    setActiveView('service-detail');
  };

  // ---- Category CRUD ----
  // Status and slug changes on an existing category go through their own dedicated endpoints
  // (PATCH .../status, PATCH .../slug) rather than being bundled into the general update PATCH.
  const saveCategory = async (data: Partial<ServiceCategory>): Promise<ActionResponse> => {
    const isNew = !modalEditData?.id || modalEditData.id.startsWith('cat-');
    const editId = isNew ? null : modalEditData!.id;

    const payload: CategoryPayload = {
      name: data.name || '',
      title: data.title || data.name || '',
      subtitle: data.subtitle || undefined,
      displayOrder: data.displayOrder !== undefined ? Number(data.displayOrder) : undefined,
      iconKey: data.iconKey || undefined,
      homeBannerKey: data.homeBannerKey || undefined,
      homeBannerType: data.homeBannerType || undefined,
      // Category creation has no isActive field (Prisma defaults new categories to active);
      // slug is only sent on create — edits rename slug via the dedicated endpoint below.
      ...(isNew ? { slug: data.slug || undefined } : {}),
    };

    const res = await saveCategoryServerAction(editId, payload);
    if (!res.ok) {
      console.error('Failed to save category:', res.message);
      return { ok: false, message: res.message };
    }

    if (!isNew && data.slug && data.slug !== modalEditData?.slug) {
      const slugRes = await updateCategorySlugServerAction(editId!, data.slug);
      if (!slugRes.ok) return { ok: false, message: slugRes.message };
    }
    if (!isNew && data.isActive !== undefined && data.isActive !== modalEditData?.isActive) {
      const statusRes = await updateCategoryStatusServerAction(editId!, data.isActive);
      if (!statusRes.ok) return { ok: false, message: statusRes.message };
    }

    if (res.data) setSelectedCategory(res.data);
    await refreshData();
    return { ok: true };
  };

  const updateCategoryStatus = async (id: string, isActive: boolean): Promise<ActionResponse> => {
    const res = await updateCategoryStatusServerAction(id, isActive);
    if (res.ok) {
      await refreshData();
      return { ok: true };
    }
    return { ok: false, message: res.message };
  };

  const deleteCategory = async (id: string): Promise<ActionResponse> => {
    const res = await deleteCategoryServerAction(id);
    if (res.ok) {
      await refreshData();
      return { ok: true };
    }
    return { ok: false, message: res.message };
  };

  // ---- SubCategory CRUD ----
  // Status and slug changes on an existing sub-category go through their own dedicated
  // endpoints rather than being bundled into the general update PATCH.
  const saveSubCategory = async (data: Partial<ServiceSubCategory>): Promise<ActionResponse> => {
    const isNew = !modalEditData?.id || modalEditData.id.startsWith('sub-');
    const editId = isNew ? null : modalEditData!.id;

    const payload: SubCategoryPayload = {
      categoryId: selectedCategory?.id || categories[0]?.id || '',
      name: data.name || '',
      title: data.title || data.name || '',
      subtitle: data.subtitle || undefined,
      iconKey: data.iconKey || undefined,
      homeBannerKey: data.homeBannerKey || undefined,
      homeBannerType: data.homeBannerType || undefined,
      displayOrder: data.displayOrder !== undefined ? Number(data.displayOrder) : undefined,
      ...(isNew ? { slug: data.slug || undefined, isActive: data.isActive } : {}),
    };

    const res = await saveSubCategoryServerAction(editId, payload);
    if (!res.ok) {
      console.error('Failed to save subcategory:', res.message);
      return { ok: false, message: res.message };
    }

    if (!isNew && data.slug && data.slug !== modalEditData?.slug) {
      const slugRes = await updateSubCategorySlugServerAction(editId!, data.slug);
      if (!slugRes.ok) return { ok: false, message: slugRes.message };
    }
    if (!isNew && data.isActive !== undefined && data.isActive !== modalEditData?.isActive) {
      const statusRes = await updateSubCategoryStatusServerAction(editId!, data.isActive);
      if (!statusRes.ok) return { ok: false, message: statusRes.message };
    }

    if (res.data) setSelectedSubCategory(res.data);
    await refreshData();
    return { ok: true };
  };

  const updateSubCategoryStatus = async (id: string, isActive: boolean): Promise<ActionResponse> => {
    const res = await updateSubCategoryStatusServerAction(id, isActive);
    if (res.ok) {
      await refreshData();
      return { ok: true };
    }
    return { ok: false, message: res.message };
  };

  const deleteSubCategory = async (id: string): Promise<ActionResponse> => {
    const res = await deleteSubCategoryServerAction(id);
    if (res.ok) {
      await refreshData();
      return { ok: true };
    }
    return { ok: false, message: res.message };
  };

  // ---- Service Item CRUD ----
  // Status and slug changes on an existing service item go through their own dedicated
  // endpoints rather than being bundled into the general update PATCH. Publish/draft state
  // goes through updateServiceItemPublishStatus (see below) once the item exists.
  const saveServiceItem = async (data: Partial<ServiceItem>): Promise<ActionResponse> => {
    const isNew = !selectedServiceItem?.id || isDraftId(selectedServiceItem.id, 'srv-');
    const editId = isNew ? null : selectedServiceItem!.id;
    const prev = (selectedServiceItem as ServiceItem) || ({} as ServiceItem);

    const payload: ServiceItemPayload = {
      subCategoryId: data.subCategoryId || prev.subCategoryId || selectedSubCategory?.id || subCategories[0]?.id || '',
      name: data.name !== undefined ? data.name : prev.name || '',
      thumbnailKey: data.thumbnailKey !== undefined ? data.thumbnailKey : prev.thumbnailKey,
      thumbnailType: (data.thumbnailType || prev.thumbnailType) as ServiceItemPayload['thumbnailType'],
      cardTitle: (data.cardTitle !== undefined ? data.cardTitle : prev.cardTitle || data.name || prev.name) || '',
      cardSubtitle: data.cardSubtitle !== undefined ? data.cardSubtitle : prev.cardSubtitle,
      cardTemplate: (data.cardTemplate !== undefined ? data.cardTemplate : prev.cardTemplate) as ServiceItemPayload['cardTemplate'],
      shortDescription: data.shortDescription !== undefined ? data.shortDescription : prev.shortDescription,
      displayOrder: data.displayOrder !== undefined ? Number(data.displayOrder) : Number(prev.displayOrder) || 0,
      features: data.features !== undefined ? data.features : prev.features,
      overview: data.overview !== undefined ? data.overview : prev.overview,
      procedureSteps: data.procedureSteps !== undefined ? data.procedureSteps : prev.procedureSteps,
      itemsUsed: data.itemsUsed !== undefined ? data.itemsUsed : prev.itemsUsed,
      skilledPros: data.skilledPros !== undefined ? data.skilledPros : prev.skilledPros,
      prePostCare: data.prePostCare !== undefined ? data.prePostCare : prev.prePostCare,
      disclaimer: data.disclaimer !== undefined ? data.disclaimer : prev.disclaimer,
      whatsIncluded: data.whatsIncluded !== undefined ? data.whatsIncluded : prev.whatsIncluded,
      faqs: data.faqs !== undefined ? data.faqs : prev.faqs,
      trustedLoved: data.trustedLoved !== undefined ? data.trustedLoved : prev.trustedLoved,
      // reviews and customReviews are kept in sync — the backend has both columns and nothing
      // in this codebase distinguishes their meaning, so every write updates both.
      reviews: data.reviews !== undefined ? data.reviews : data.customReviews !== undefined ? data.customReviews : prev.reviews ?? prev.customReviews,
      customReviews: data.customReviews !== undefined ? data.customReviews : data.reviews !== undefined ? data.reviews : prev.customReviews ?? prev.reviews,
      // New items set isActive/isPublished/slug directly at creation (the DTO supports it there);
      // edits change these via the dedicated slug/status/publish-status endpoints instead.
      ...(isNew
        ? {
            slug: data.slug !== undefined ? data.slug : prev.slug,
            isActive: data.isActive !== undefined ? data.isActive : true,
            isPublished: data.isPublished !== undefined ? data.isPublished : false,
          }
        : {}),
    };

    const res = await saveServiceItemServerAction(editId, payload);
    if (!res.ok) {
      console.error('Failed to save service item:', res.message);
      return { ok: false, message: res.message };
    }

    if (!isNew && data.slug && data.slug !== prev.slug) {
      const slugRes = await updateServiceItemSlugServerAction(editId!, data.slug);
      if (!slugRes.ok) return { ok: false, message: slugRes.message };
    }
    if (!isNew && data.isActive !== undefined && data.isActive !== prev.isActive) {
      const statusRes = await updateServiceItemStatusServerAction(editId!, data.isActive);
      if (!statusRes.ok) return { ok: false, message: statusRes.message };
    }
    if (!isNew && data.isPublished !== undefined && data.isPublished !== prev.isPublished) {
      const pubRes = await updateServiceItemPublishStatusServerAction(editId!, data.isPublished);
      if (!pubRes.ok) return { ok: false, message: pubRes.message };
    }

    if (res.data) setSelectedServiceItem(res.data);
    await refreshData();
    return { ok: true };
  };

  const updateServiceItemStatus = async (id: string, isActive: boolean): Promise<ActionResponse> => {
    const res = await updateServiceItemStatusServerAction(id, isActive);
    if (res.ok) {
      await refreshData();
      return { ok: true };
    }
    return { ok: false, message: res.message };
  };

  const updateServiceItemPublishStatus = async (id: string, isPublished: boolean): Promise<ActionResponse> => {
    const res = await updateServiceItemPublishStatusServerAction(id, isPublished);
    if (res.ok) {
      if (res.data) setSelectedServiceItem(res.data);
      await refreshData();
      return { ok: true };
    }
    return { ok: false, message: res.message };
  };

  const deleteServiceItem = async (id: string): Promise<ActionResponse> => {
    // Unsaved local draft — nothing exists on the backend to delete yet.
    if (isDraftId(id, 'srv-')) {
      setServiceItems(prev => prev.filter(s => s.id !== id));
      setSelectedServiceItem(null);
      return { ok: true };
    }
    const res = await deleteServiceItemServerAction(id);
    if (res.ok) {
      await refreshData();
      return { ok: true };
    }
    return { ok: false, message: res.message };
  };

  // ---- Durations ----
  const addDurationToService = async (serviceId: string, duration: Omit<ServiceDuration, 'id'>): Promise<ActionResponse> => {
    const res = await saveServiceDurationServerAction(null, {
      serviceItemId: serviceId,
      label: duration.label,
      durationMinutes: duration.durationMinutes,
      price: duration.price,
      discountedPrice: duration.discountedPrice ?? undefined,
      isDefault: duration.isDefault,
      displayOrder: duration.displayOrder,
    });
    if (res.ok) {
      await loadServiceDetail(serviceId);
      return { ok: true };
    }
    return { ok: false, message: res.message };
  };

  const deleteDurationFromService = async (serviceId: string, durationId: string): Promise<ActionResponse> => {
    const res = await deleteServiceDurationServerAction(durationId);
    if (res.ok) {
      await loadServiceDetail(serviceId);
      return { ok: true };
    }
    return { ok: false, message: res.message };
  };

  // ---- Packages ----
  const addPackageToService = async (serviceId: string, pkg: Omit<ServicePackage, 'id'>): Promise<ActionResponse> => {
    const res = await saveServicePackageServerAction(null, {
      serviceItemId: serviceId,
      label: pkg.label,
      sessions: pkg.sessions,
      price: pkg.price,
      pricePerSession: pkg.pricePerSession,
      originalPrice: pkg.originalPrice ?? undefined,
      savings: pkg.savings ?? undefined,
      savingsPercent: pkg.savingsPercent ?? undefined,
      badgeText: pkg.badgeText ?? undefined,
      isPopular: pkg.isPopular,
      displayOrder: pkg.displayOrder,
    });
    if (res.ok) {
      await loadServiceDetail(serviceId);
      return { ok: true };
    }
    return { ok: false, message: res.message };
  };

  const deletePackageFromService = async (serviceId: string, packageId: string): Promise<ActionResponse> => {
    const res = await deleteServicePackageServerAction(packageId);
    if (res.ok) {
      await loadServiceDetail(serviceId);
      return { ok: true };
    }
    return { ok: false, message: res.message };
  };

  // ---- Add-ons ----
  const addAddOnToService = async (
    serviceId: string,
    addon: Omit<ServiceAddOn, 'id' | 'serviceItemId'>
  ): Promise<ActionResponse> => {
    const res = await saveServiceAddOnServerAction(null, {
      serviceItemId: serviceId,
      name: addon.name,
      price: addon.price,
      imageKey: addon.imageKey,
      description: addon.description,
      extraMinutes: addon.extraMinutes,
      isActive: addon.isActive !== undefined ? addon.isActive : true,
      displayOrder: addon.displayOrder,
    });
    if (res.ok) {
      await loadServiceDetail(serviceId);
      return { ok: true };
    }
    return { ok: false, message: res.message };
  };

  const deleteAddOnFromService = async (serviceId: string, addonId: string): Promise<ActionResponse> => {
    const res = await deleteServiceAddOnServerAction(addonId);
    if (res.ok) {
      await loadServiceDetail(serviceId);
      return { ok: true };
    }
    return { ok: false, message: res.message };
  };

  // ---- Zone availability & pricing overrides ----
  // All four config lists are refetched in full after every write (same cost as the rest of
  // refreshData) since the backend has no per-entity filter to refetch just one slice.
  const saveZoneServiceItemConfig = async (id: string | null, data: ZoneServiceItemConfigPayload): Promise<ActionResponse> => {
    const res = await saveZoneServiceItemConfigServerAction(id, data);
    if (res.ok) {
      await refreshData();
      return { ok: true };
    }
    return { ok: false, message: res.message };
  };

  const deleteZoneServiceItemConfig = async (id: string): Promise<ActionResponse> => {
    const res = await deleteZoneServiceItemConfigServerAction(id);
    if (res.ok) {
      await refreshData();
      return { ok: true };
    }
    return { ok: false, message: res.message };
  };

  const saveZoneDurationConfig = async (id: string | null, data: ZoneDurationConfigPayload): Promise<ActionResponse> => {
    const res = await saveZoneDurationConfigServerAction(id, data);
    if (res.ok) {
      await refreshData();
      return { ok: true };
    }
    return { ok: false, message: res.message };
  };

  const deleteZoneDurationConfig = async (id: string): Promise<ActionResponse> => {
    const res = await deleteZoneDurationConfigServerAction(id);
    if (res.ok) {
      await refreshData();
      return { ok: true };
    }
    return { ok: false, message: res.message };
  };

  const saveZonePackageConfig = async (id: string | null, data: ZonePackageConfigPayload): Promise<ActionResponse> => {
    const res = await saveZonePackageConfigServerAction(id, data);
    if (res.ok) {
      await refreshData();
      return { ok: true };
    }
    return { ok: false, message: res.message };
  };

  const deleteZonePackageConfig = async (id: string): Promise<ActionResponse> => {
    const res = await deleteZonePackageConfigServerAction(id);
    if (res.ok) {
      await refreshData();
      return { ok: true };
    }
    return { ok: false, message: res.message };
  };

  const saveZoneAddOnConfig = async (id: string | null, data: ZoneAddOnConfigPayload): Promise<ActionResponse> => {
    const res = await saveZoneAddOnConfigServerAction(id, data);
    if (res.ok) {
      await refreshData();
      return { ok: true };
    }
    return { ok: false, message: res.message };
  };

  const deleteZoneAddOnConfig = async (id: string): Promise<ActionResponse> => {
    const res = await deleteZoneAddOnConfigServerAction(id);
    if (res.ok) {
      await refreshData();
      return { ok: true };
    }
    return { ok: false, message: res.message };
  };

  return (
    <CatalogueContext.Provider value={{
      loading,
      activeView,
      setActiveView,
      categories,
      selectedCategory,
      setSelectedCategory,
      subCategories,
      selectedSubCategory,
      setSelectedSubCategory,
      serviceItems,
      selectedServiceItem,
      setSelectedServiceItem,
      zones,
      zoneServiceItemConfigs,
      zoneDurationConfigs,
      zonePackageConfigs,
      zoneAddOnConfigs,
      serviceDurations,
      servicePackages,
      serviceAddOns,
      serviceDetailLoading,
      categoryModalOpen,
      setCategoryModalOpen,
      categoryModalMode,
      modalEditData,
      openCategoryModal,
      navigateToServiceDetail,
      refreshData,
      saveCategory,
      updateCategoryStatus,
      deleteCategory,
      saveSubCategory,
      updateSubCategoryStatus,
      deleteSubCategory,
      saveServiceItem,
      updateServiceItemStatus,
      updateServiceItemPublishStatus,
      deleteServiceItem,
      addDurationToService,
      deleteDurationFromService,
      addPackageToService,
      deletePackageFromService,
      addAddOnToService,
      deleteAddOnFromService,
      saveZoneServiceItemConfig,
      deleteZoneServiceItemConfig,
      saveZoneDurationConfig,
      deleteZoneDurationConfig,
      saveZonePackageConfig,
      deleteZonePackageConfig,
      saveZoneAddOnConfig,
      deleteZoneAddOnConfig,
    }}>
      {children}
    </CatalogueContext.Provider>
  );
};

export const useCatalogue = () => {
  const context = useContext(CatalogueContext);
  if (!context) throw new Error('useCatalogue must be used within CatalogueProvider');
  return context;
};
