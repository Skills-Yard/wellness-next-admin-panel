'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  ServiceCategory,
  ServiceSubCategory,
  ServiceGender,
  ServiceSuite,
  ServiceItem,
  ServiceDuration,
  ServicePackage,
  ServiceAddOn,
  OperationalZone,
  ZoneServiceItemConfig,
  ZoneDurationConfig,
  ZonePackageConfig,
  ZoneAddOnConfig,
  ZoneSuiteConfig,
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
  getServiceGendersServerAction,
  saveServiceGenderServerAction,
  updateServiceGenderStatusServerAction,
  updateServiceGenderSlugServerAction,
  deleteServiceGenderServerAction,
  ServiceGenderPayload,
} from '../lib/server-actions/gender';
import {
  getServiceSuitesServerAction,
  saveServiceSuiteServerAction,
  updateServiceSuiteStatusServerAction,
  updateServiceSuiteSlugServerAction,
  deleteServiceSuiteServerAction,
  ServiceSuitePayload,
} from '../lib/server-actions/suite';
import {
  getServiceItemsServerAction,
  getServiceItemByIdServerAction,
  saveServiceItemServerAction,
  updateServiceItemStatusServerAction,
  updateServiceItemSlugServerAction,
  updateServiceItemPublishStatusServerAction,
  deleteServiceItemServerAction,
  ServiceItemPayload,
} from '../lib/server-actions/service';
import {
  getServiceDurationsServerAction,
  getAllServiceDurationsServerAction,
  saveServiceDurationServerAction,
  deleteServiceDurationServerAction,
} from '../lib/server-actions/duration';
import {
  getServicePackagesServerAction,
  getAllServicePackagesServerAction,
  saveServicePackageServerAction,
  deleteServicePackageServerAction,
} from '../lib/server-actions/package';
import {
  getServiceAddOnsServerAction,
  getAllServiceAddOnsServerAction,
  saveServiceAddOnServerAction,
  deleteServiceAddOnServerAction,
} from '../lib/server-actions/addon';
import {
  getZonesServerAction,
  createZoneWithPolygonServerAction,
  CreateZoneWithPolygonPayload,
  updateZoneServerAction,
  UpdateZonePayload,
  deleteZoneServerAction,
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
  getZoneSuiteConfigsServerAction,
  saveZoneSuiteConfigServerAction,
  deleteZoneSuiteConfigServerAction,
  ZoneSuiteConfigPayload,
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

  // Global (not category-scoped) — see ServiceGender in catalog.prisma.
  genders: ServiceGender[];
  // Scoped to a ServiceCategory, same relationship shape as subCategories.
  suites: ServiceSuite[];

  serviceItems: ServiceItem[];
  selectedServiceItem: ServiceItem | null;
  setSelectedServiceItem: (item: ServiceItem | null) => void;

  // The four config lists hold every row across every zone (the backend has no
  // serviceItemId/durationId filter) — callers filter client-side by the entity they need.
  zones: OperationalZone[];
  selectedZone: OperationalZone | null;
  setSelectedZone: (zone: OperationalZone | null) => void;
  zoneServiceItemConfigs: ZoneServiceItemConfig[];
  zoneDurationConfigs: ZoneDurationConfig[];
  zonePackageConfigs: ZonePackageConfig[];
  zoneAddOnConfigs: ZoneAddOnConfig[];
  zoneSuiteConfigs: ZoneSuiteConfig[];

  // Durations/packages/add-ons are NOT embedded in the service-item list/detail response —
  // the backend requires a dedicated GET with serviceItemId for each. These track whichever
  // service is currently selected, and refetch whenever selectedServiceItem changes.
  serviceDurations: ServiceDuration[];
  servicePackages: ServicePackage[];
  serviceAddOns: ServiceAddOn[];
  // Split per-entity so adding/updating/deleting just a duration only shows a loading state on
  // the Duration section — packages/add-ons stay untouched. Each flag covers both the initial
  // fetch (switching services) and the refetch after any add/update/delete for that entity.
  serviceDurationsLoading: boolean;
  servicePackagesLoading: boolean;
  serviceAddOnsLoading: boolean;

  // Cross-service catalogs — every duration/package/add-on across every service, each row
  // carrying a `serviceItem` ref. Fetched on demand (not on load) to power the "pick from
  // an existing one" selector in DurationModal/PackModal/AddOnModal when creating a new row.
  allServiceDurations: ServiceDuration[];
  allServicePackages: ServicePackage[];
  allServiceAddOns: ServiceAddOn[];
  allServiceDurationsLoading: boolean;
  allServicePackagesLoading: boolean;
  allServiceAddOnsLoading: boolean;
  loadAllServiceDurations: () => Promise<void>;
  loadAllServicePackages: () => Promise<void>;
  loadAllServiceAddOns: () => Promise<void>;

  // Modals state
  categoryModalOpen: boolean;
  setCategoryModalOpen: (open: boolean) => void;
  categoryModalMode: 'category' | 'subcategory' | 'gender' | 'suite';
  modalEditData: ServiceCategory | ServiceSubCategory | ServiceGender | ServiceSuite | null;
  openCategoryModal: (
    mode: 'category' | 'subcategory' | 'gender' | 'suite',
    data?: ServiceCategory | ServiceSubCategory | ServiceGender | ServiceSuite | null
  ) => void;

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

  saveServiceGender: (data: Partial<ServiceGender>) => Promise<ActionResponse>;
  updateServiceGenderStatus: (id: string, isActive: boolean) => Promise<ActionResponse>;
  deleteServiceGender: (id: string) => Promise<ActionResponse>;

  // Suite create/edit reads its categoryId off selectedCategory (same convention as
  // saveSubCategory) rather than taking it as a form field.
  saveServiceSuite: (data: Partial<ServiceSuite>) => Promise<ActionResponse>;
  updateServiceSuiteStatus: (id: string, isActive: boolean) => Promise<ActionResponse>;
  deleteServiceSuite: (id: string) => Promise<ActionResponse>;

  saveServiceItem: (data: Partial<ServiceItem>) => Promise<ActionResponse>;
  updateServiceItemStatus: (id: string, isActive: boolean) => Promise<ActionResponse>;
  updateServiceItemPublishStatus: (id: string, isPublished: boolean) => Promise<ActionResponse>;
  deleteServiceItem: (id: string) => Promise<ActionResponse>;
  // Clones a service item plus its durations/packages/add-ons AND their per-zone
  // availability/surge/price overrides as brand-new rows on a brand-new service item (same data,
  // independent ids) — see implementation below for the create ordering this requires.
  // overrideSubCategoryId places the clone under a different sub-category than its source (used
  // by the "+ Add Service -> Duplicate Existing" picker, which can duplicate from any
  // sub-category into whichever one is currently active); omit it to keep the source's own.
  duplicateServiceItem: (id: string, overrideSubCategoryId?: string) => Promise<ActionResponse>;

  // Timeslots & Packs & Add-ons management
  addDurationToService: (serviceId: string, duration: Omit<ServiceDuration, 'id'>) => Promise<ActionResponse>;
  updateDurationInService: (serviceId: string, durationId: string, duration: Omit<ServiceDuration, 'id'>) => Promise<ActionResponse>;
  deleteDurationFromService: (serviceId: string, durationId: string) => Promise<ActionResponse>;
  addPackageToService: (serviceId: string, pkg: Omit<ServicePackage, 'id'>) => Promise<ActionResponse>;
  updatePackageInService: (serviceId: string, packageId: string, pkg: Omit<ServicePackage, 'id'>) => Promise<ActionResponse>;
  deletePackageFromService: (serviceId: string, packageId: string) => Promise<ActionResponse>;
  addAddOnToService: (serviceId: string, addon: Omit<ServiceAddOn, 'id' | 'serviceItemId'>) => Promise<ActionResponse>;
  updateAddOnInService: (serviceId: string, addonId: string, addon: Omit<ServiceAddOn, 'id' | 'serviceItemId'>) => Promise<ActionResponse>;
  deleteAddOnFromService: (serviceId: string, addonId: string) => Promise<ActionResponse>;

  // Zone entities (name/city/boundary) — see AdminOperationalZoneController / ZoneController
  createZone: (data: CreateZoneWithPolygonPayload) => Promise<ActionResponse>;
  updateZone: (id: string, data: UpdateZonePayload) => Promise<ActionResponse>;
  deleteZone: (id: string) => Promise<ActionResponse>;

  // Zone availability & pricing overrides
  saveZoneServiceItemConfig: (id: string | null, data: ZoneServiceItemConfigPayload) => Promise<ActionResponse>;
  deleteZoneServiceItemConfig: (id: string) => Promise<ActionResponse>;
  saveZoneDurationConfig: (id: string | null, data: ZoneDurationConfigPayload) => Promise<ActionResponse>;
  deleteZoneDurationConfig: (id: string) => Promise<ActionResponse>;
  saveZonePackageConfig: (id: string | null, data: ZonePackageConfigPayload) => Promise<ActionResponse>;
  deleteZonePackageConfig: (id: string) => Promise<ActionResponse>;
  saveZoneAddOnConfig: (id: string | null, data: ZoneAddOnConfigPayload) => Promise<ActionResponse>;
  deleteZoneAddOnConfig: (id: string) => Promise<ActionResponse>;
  saveZoneSuiteConfig: (id: string | null, data: ZoneSuiteConfigPayload) => Promise<ActionResponse>;
  deleteZoneSuiteConfig: (id: string) => Promise<ActionResponse>;
}

const CatalogueContext = createContext<CatalogueContextType | undefined>(undefined);

const isDraftId = (id?: string | null, prefix?: string) => !!id && !!prefix && id.startsWith(prefix);

// Neither endpoint returns durations/packages in a meaningful order (both the per-service and
// the cross-service "get all" lists come back in whatever order the backend happens to return),
// so every setter below sorts client-side — durations shortest-first, packages fewest-sessions-
// first — instead of showing raw insertion order.
const sortByDurationMinutes = (list: ServiceDuration[]) => [...list].sort((a, b) => a.durationMinutes - b.durationMinutes);
const sortByPackageSessions = (list: ServicePackage[]) => [...list].sort((a, b) => a.sessions - b.sessions);

export const CatalogueProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'categories' | 'service-detail'>('categories');

  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | null>(null);

  const [subCategories, setSubCategories] = useState<ServiceSubCategory[]>([]);
  const [selectedSubCategory, setSelectedSubCategory] = useState<ServiceSubCategory | null>(null);

  const [genders, setGenders] = useState<ServiceGender[]>([]);
  const [suites, setSuites] = useState<ServiceSuite[]>([]);

  const [serviceItems, setServiceItems] = useState<ServiceItem[]>([]);
  const [selectedServiceItem, setSelectedServiceItem] = useState<ServiceItem | null>(null);

  const [zones, setZones] = useState<OperationalZone[]>([]);
  const [selectedZone, setSelectedZone] = useState<OperationalZone | null>(null);
  const [zoneServiceItemConfigs, setZoneServiceItemConfigs] = useState<ZoneServiceItemConfig[]>([]);
  const [zoneDurationConfigs, setZoneDurationConfigs] = useState<ZoneDurationConfig[]>([]);
  const [zonePackageConfigs, setZonePackageConfigs] = useState<ZonePackageConfig[]>([]);
  const [zoneAddOnConfigs, setZoneAddOnConfigs] = useState<ZoneAddOnConfig[]>([]);
  const [zoneSuiteConfigs, setZoneSuiteConfigs] = useState<ZoneSuiteConfig[]>([]);

  const [serviceDurations, setServiceDurations] = useState<ServiceDuration[]>([]);
  const [servicePackages, setServicePackages] = useState<ServicePackage[]>([]);
  const [serviceAddOns, setServiceAddOns] = useState<ServiceAddOn[]>([]);
  const [serviceDurationsLoading, setServiceDurationsLoading] = useState(false);
  const [servicePackagesLoading, setServicePackagesLoading] = useState(false);
  const [serviceAddOnsLoading, setServiceAddOnsLoading] = useState(false);

  const [allServiceDurations, setAllServiceDurations] = useState<ServiceDuration[]>([]);
  const [allServicePackages, setAllServicePackages] = useState<ServicePackage[]>([]);
  const [allServiceAddOns, setAllServiceAddOns] = useState<ServiceAddOn[]>([]);
  const [allServiceDurationsLoading, setAllServiceDurationsLoading] = useState(false);
  const [allServicePackagesLoading, setAllServicePackagesLoading] = useState(false);
  const [allServiceAddOnsLoading, setAllServiceAddOnsLoading] = useState(false);

  // Modals state
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [categoryModalMode, setCategoryModalMode] = useState<'category' | 'subcategory' | 'gender' | 'suite'>('category');
  const [modalEditData, setModalEditData] = useState<ServiceCategory | ServiceSubCategory | ServiceGender | ServiceSuite | null>(null);

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

      const [backendGenders, backendSuites] = await Promise.all([
        getServiceGendersServerAction(),
        getServiceSuitesServerAction(),
      ]);
      setGenders(backendGenders);
      setSuites(backendSuites);

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
        backendZoneSuiteConfigs,
      ] = await Promise.all([
        getZonesServerAction(),
        getZoneServiceItemConfigsServerAction(),
        getZoneDurationConfigsServerAction(),
        getZonePackageConfigsServerAction(),
        getZoneAddOnConfigsServerAction(),
        getZoneSuiteConfigsServerAction(),
      ]);
      setZones(backendZones);
      setSelectedZone(prev => (prev ? backendZones.find(z => z.id === prev.id) || prev : prev));
      setZoneServiceItemConfigs(backendZoneItemConfigs);
      setZoneDurationConfigs(backendZoneDurationConfigs);
      setZonePackageConfigs(backendZonePackageConfigs);
      setZoneAddOnConfigs(backendZoneAddOnConfigs);
      setZoneSuiteConfigs(backendZoneSuiteConfigs);
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
      setGenders([]);
      setSuites([]);
      setServiceItems([]);
      setSelectedCategory(null);
      setSelectedSubCategory(null);
      setSelectedServiceItem(null);
      setZones([]);
      setZoneServiceItemConfigs([]);
      setZoneDurationConfigs([]);
      setZonePackageConfigs([]);
      setZoneAddOnConfigs([]);
      setZoneSuiteConfigs([]);
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, authLoading]);

  // Durations/packages/add-ons live on their own endpoints keyed by serviceItemId. Each has its
  // own loader + loading flag so that, say, adding a duration only flips the Duration section
  // into a loading/"Updating..." state — packages/add-ons stay untouched. loadServiceDetail
  // (below) just fans out to all three, for the initial "service selected" load.
  const loadServiceDurationsList = useCallback(async (serviceItemId: string) => {
    setServiceDurationsLoading(true);
    try {
      setServiceDurations(sortByDurationMinutes(await getServiceDurationsServerAction(serviceItemId)));
    } finally {
      setServiceDurationsLoading(false);
    }
  }, []);

  const loadServicePackagesList = useCallback(async (serviceItemId: string) => {
    setServicePackagesLoading(true);
    try {
      setServicePackages(sortByPackageSessions(await getServicePackagesServerAction(serviceItemId)));
    } finally {
      setServicePackagesLoading(false);
    }
  }, []);

  const loadServiceAddOnsList = useCallback(async (serviceItemId: string) => {
    setServiceAddOnsLoading(true);
    try {
      setServiceAddOns(await getServiceAddOnsServerAction(serviceItemId));
    } finally {
      setServiceAddOnsLoading(false);
    }
  }, []);

  // Refetches all three — used when the selected service changes (all three genuinely are
  // loading together in that case). Individual CRUD actions below call the single-entity
  // loaders directly instead of this.
  const loadServiceDetail = useCallback(async (serviceItemId: string) => {
    await Promise.all([
      loadServiceDurationsList(serviceItemId),
      loadServicePackagesList(serviceItemId),
      loadServiceAddOnsList(serviceItemId),
    ]);
  }, [loadServiceDurationsList, loadServicePackagesList, loadServiceAddOnsList]);

  useEffect(() => {
    if (selectedServiceItem && !isDraftId(selectedServiceItem.id, 'srv-')) {
      loadServiceDetail(selectedServiceItem.id);
    } else {
      setServiceDurations([]);
      setServicePackages([]);
      setServiceAddOns([]);
    }
  }, [selectedServiceItem?.id, loadServiceDetail]);

  // Packs have no durationId column — their price is sessions x a duration's price, derived
  // server-side from sessions + savingsPercent (see PackModal). Bootstrap a "1 Session" / 0%
  // pack ONCE, the first time a service gets a duration to price off of — deliberately NOT
  // re-synced on every later duration add/update/delete (that used to make the Pack section
  // flash "Updating..." for edits that have nothing to do with packs). Past that first pack,
  // pricing is entirely user-managed via session count + discount %. Best-effort: failures here
  // are logged, not surfaced — they shouldn't block the duration action that triggered them.
  const createDefaultPackIfMissing = async (serviceId: string) => {
    try {
      const packages = await getServicePackagesServerAction(serviceId);
      if (packages.length > 0) return;

      await saveServicePackageServerAction(null, {
        serviceItemId: serviceId,
        label: '1 Session',
        sessions: 1,
        savingsPercent: 0,
      });
    } catch (err) {
      console.error('[createDefaultPackIfMissing]', err);
    }
  };

  // On-demand cross-service catalogs (see allServiceDurations etc. above) — called when the
  // corresponding "add" modal opens, not eagerly, since these can span every service.
  const loadAllServiceDurations = useCallback(async () => {
    setAllServiceDurationsLoading(true);
    try {
      setAllServiceDurations(sortByDurationMinutes(await getAllServiceDurationsServerAction()));
    } finally {
      setAllServiceDurationsLoading(false);
    }
  }, []);

  const loadAllServicePackages = useCallback(async () => {
    setAllServicePackagesLoading(true);
    try {
      setAllServicePackages(sortByPackageSessions(await getAllServicePackagesServerAction()));
    } finally {
      setAllServicePackagesLoading(false);
    }
  }, []);

  const loadAllServiceAddOns = useCallback(async () => {
    setAllServiceAddOnsLoading(true);
    try {
      setAllServiceAddOns(await getAllServiceAddOnsServerAction());
    } finally {
      setAllServiceAddOnsLoading(false);
    }
  }, []);

  const openCategoryModal = (
    mode: 'category' | 'subcategory' | 'gender' | 'suite',
    data?: ServiceCategory | ServiceSubCategory | ServiceGender | ServiceSuite | null
  ) => {
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

  // ---- Gender CRUD ----
  // Global list (not scoped to a category). Status and slug changes on an existing gender go
  // through their own dedicated endpoints rather than being bundled into the general update PATCH.
  const saveServiceGender = async (data: Partial<ServiceGender>): Promise<ActionResponse> => {
    const editData = modalEditData as ServiceGender | null;
    const isNew = !editData?.id || editData.id.startsWith('gen-');
    const editId = isNew ? null : editData!.id;

    const payload: ServiceGenderPayload = {
      name: data.name || '',
      title: data.title || data.name || '',
      subtitle: data.subtitle || undefined,
      displayOrder: data.displayOrder !== undefined ? Number(data.displayOrder) : undefined,
      iconKey: data.iconKey || undefined,
      homeBannerKey: data.homeBannerKey || undefined,
      homeBannerType: data.homeBannerType || undefined,
      // code is only sent on create — it identifies the row (MALE/FEMALE) and the admin UI
      // treats it as immutable afterward (see GenderModal fields in CategoryModal).
      ...(isNew ? { code: data.code, slug: data.slug || undefined } : {}),
    };

    const res = await saveServiceGenderServerAction(editId, payload);
    if (!res.ok) {
      console.error('Failed to save gender:', res.message);
      return { ok: false, message: res.message };
    }

    if (!isNew && data.slug && data.slug !== editData?.slug) {
      const slugRes = await updateServiceGenderSlugServerAction(editId!, data.slug);
      if (!slugRes.ok) return { ok: false, message: slugRes.message };
    }
    if (!isNew && data.isActive !== undefined && data.isActive !== editData?.isActive) {
      const statusRes = await updateServiceGenderStatusServerAction(editId!, data.isActive);
      if (!statusRes.ok) return { ok: false, message: statusRes.message };
    }

    await refreshData();
    return { ok: true };
  };

  const updateServiceGenderStatus = async (id: string, isActive: boolean): Promise<ActionResponse> => {
    const res = await updateServiceGenderStatusServerAction(id, isActive);
    if (res.ok) {
      await refreshData();
      return { ok: true };
    }
    return { ok: false, message: res.message };
  };

  const deleteServiceGender = async (id: string): Promise<ActionResponse> => {
    const res = await deleteServiceGenderServerAction(id);
    if (res.ok) {
      await refreshData();
      return { ok: true };
    }
    return { ok: false, message: res.message };
  };

  // ---- Suite CRUD ----
  // Scoped to the currently selected Category (same convention as saveSubCategory). Status and
  // slug changes on an existing suite go through their own dedicated endpoints.
  const saveServiceSuite = async (data: Partial<ServiceSuite>): Promise<ActionResponse> => {
    const editData = modalEditData as ServiceSuite | null;
    const isNew = !editData?.id || editData.id.startsWith('suite-');
    const editId = isNew ? null : editData!.id;

    const payload: ServiceSuitePayload = {
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

    const res = await saveServiceSuiteServerAction(editId, payload);
    if (!res.ok) {
      console.error('Failed to save suite:', res.message);
      return { ok: false, message: res.message };
    }

    if (!isNew && data.slug && data.slug !== editData?.slug) {
      const slugRes = await updateServiceSuiteSlugServerAction(editId!, data.slug);
      if (!slugRes.ok) return { ok: false, message: slugRes.message };
    }
    if (!isNew && data.isActive !== undefined && data.isActive !== editData?.isActive) {
      const statusRes = await updateServiceSuiteStatusServerAction(editId!, data.isActive);
      if (!statusRes.ok) return { ok: false, message: statusRes.message };
    }

    await refreshData();
    return { ok: true };
  };

  const updateServiceSuiteStatus = async (id: string, isActive: boolean): Promise<ActionResponse> => {
    const res = await updateServiceSuiteStatusServerAction(id, isActive);
    if (res.ok) {
      await refreshData();
      return { ok: true };
    }
    return { ok: false, message: res.message };
  };

  const deleteServiceSuite = async (id: string): Promise<ActionResponse> => {
    const res = await deleteServiceSuiteServerAction(id);
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
      genderId: data.genderId || prev.genderId || genders[0]?.id || '',
      suiteId: data.suiteId || prev.suiteId || suites[0]?.id || '',
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

  // Clones an existing service item into a brand-new one — same content, independent rows.
  // The service-item JSON columns are copied as-is via the detail endpoint (the list endpoint
  // doesn't embed them); durations/packages/add-ons and their per-zone availability/price
  // overrides are fetched from their own endpoints (never embedded anywhere) and each re-created
  // individually against the new service's (and new durations'/packages'/add-ons') ids, the same
  // way a human re-typing them into the new service one at a time would. Starts as an unpublished
  // draft (like "+ Add Service") so a duplicate never goes live unreviewed.
  const duplicateServiceItem = async (id: string, overrideSubCategoryId?: string): Promise<ActionResponse> => {
    try {
      const source = await getServiceItemByIdServerAction(id);
      if (!source) return { ok: false, message: 'Service item not found' };

      // The four zone-config list endpoints have no serviceItemId filter — they return every
      // config row across every zone/service (see the comments on each getZone*ConfigsServerAction
      // above) — so pull them alongside this service's own durations/packages/add-ons and filter
      // down to just this source service's rows below.
      const [durations, packages, addOns, allItemZoneConfigs, allDurationZoneConfigs, allPackageZoneConfigs, allAddOnZoneConfigs] = await Promise.all([
        getServiceDurationsServerAction(id),
        getServicePackagesServerAction(id),
        getServiceAddOnsServerAction(id),
        getZoneServiceItemConfigsServerAction(),
        getZoneDurationConfigsServerAction(),
        getZonePackageConfigsServerAction(),
        getZoneAddOnConfigsServerAction(),
      ]);

      const durationIds = new Set(durations.map(d => d.id));
      const packageIds = new Set(packages.map(p => p.id));
      const addOnIds = new Set(addOns.map(a => a.id));

      const itemZoneConfigs = allItemZoneConfigs.filter(c => c.serviceItemId === id);
      const durationZoneConfigs = allDurationZoneConfigs.filter(c => durationIds.has(c.serviceDurationId));
      const packageZoneConfigs = allPackageZoneConfigs.filter(c => packageIds.has(c.servicePackageId));
      const addOnZoneConfigs = allAddOnZoneConfigs.filter(c => addOnIds.has(c.serviceAddOnId));

      const createRes = await saveServiceItemServerAction(null, {
        subCategoryId: overrideSubCategoryId || source.subCategoryId,
        genderId: source.genderId,
        suiteId: source.suiteId,
        name: `${source.name} (Copy)`,
        slug: `${source.slug}-copy-${Date.now()}`,
        thumbnailKey: source.thumbnailKey,
        thumbnailType: source.thumbnailType,
        cardTitle: source.cardTitle,
        cardSubtitle: source.cardSubtitle,
        cardTemplate: source.cardTemplate,
        shortDescription: source.shortDescription,
        tags: source.tags,
        isActive: true,
        isPublished: false,
        displayOrder: source.displayOrder,
        features: source.features,
        overview: source.overview,
        procedureSteps: source.procedureSteps,
        itemsUsed: source.itemsUsed,
        skilledPros: source.skilledPros,
        prePostCare: source.prePostCare,
        disclaimer: source.disclaimer,
        whatsIncluded: source.whatsIncluded,
        faqs: source.faqs,
        trustedLoved: source.trustedLoved,
        reviews: source.reviews,
        customReviews: source.customReviews,
      });

      if (!createRes.ok) {
        return { ok: false, message: createRes.message || 'Failed to create duplicate service item' };
      }
      const newServiceId = createRes.data.id;

      // Add-ons and the service-item-level zone availability/surge configs have no dependency on
      // durations, so they run alongside them; packages must wait until durations exist since the
      // backend derives a pack's price off this service's own default duration (see
      // addPackageToService/PackModal elsewhere in this file) — captured here so their new ids can
      // be used to remap the per-duration/per-add-on zone price overrides below.
      const [durationResults, addOnResults] = await Promise.all([
        Promise.all(durations.map(d => saveServiceDurationServerAction(null, {
          serviceItemId: newServiceId,
          label: d.label,
          durationMinutes: d.durationMinutes,
          price: d.price,
          discountedPrice: d.discountedPrice ?? undefined,
          isDefault: d.isDefault,
          displayOrder: d.displayOrder,
        }))),
        Promise.all(addOns.map(a => saveServiceAddOnServerAction(null, {
          serviceItemId: newServiceId,
          name: a.name,
          description: a.description,
          price: a.price,
          imageKey: a.imageKey,
          extraMinutes: a.extraMinutes,
          isActive: a.isActive !== undefined ? a.isActive : true,
          displayOrder: a.displayOrder,
        }))),
        Promise.all(itemZoneConfigs.map(c => saveZoneServiceItemConfigServerAction(null, {
          zoneId: c.zoneId,
          serviceItemId: newServiceId,
          isAvailable: c.isAvailable,
          surgeMultiplier: c.surgeMultiplier,
        }))),
      ]);

      const durationIdMap = new Map<string, string>();
      durations.forEach((d, i) => {
        const res = durationResults[i];
        if (res.ok) durationIdMap.set(d.id, res.data.id);
      });
      const addOnIdMap = new Map<string, string>();
      addOns.forEach((a, i) => {
        const res = addOnResults[i];
        if (res.ok) addOnIdMap.set(a.id, res.data.id);
      });

      // Re-point each per-zone price override at the matching newly-created duration/add-on
      // (skipping any whose duration/add-on failed to clone above).
      await Promise.all([
        ...durationZoneConfigs.flatMap(c => {
          const newDurationId = durationIdMap.get(c.serviceDurationId);
          if (!newDurationId) return [];
          return [saveZoneDurationConfigServerAction(null, {
            zoneId: c.zoneId,
            serviceDurationId: newDurationId,
            price: c.price,
            discountedPrice: c.discountedPrice ?? undefined,
          })];
        }),
        ...addOnZoneConfigs.flatMap(c => {
          const newAddOnId = addOnIdMap.get(c.serviceAddOnId);
          if (!newAddOnId) return [];
          return [saveZoneAddOnConfigServerAction(null, {
            zoneId: c.zoneId,
            serviceAddOnId: newAddOnId,
            price: c.price,
          })];
        }),
      ]);

      const packageResults = await Promise.all(
        packages.map(p => saveServicePackageServerAction(null, {
          serviceItemId: newServiceId,
          label: p.label,
          sessions: p.sessions,
          savingsPercent: p.savingsPercent ?? undefined,
        }))
      );
      const packageIdMap = new Map<string, string>();
      packages.forEach((p, i) => {
        const res = packageResults[i];
        if (res.ok) packageIdMap.set(p.id, res.data.id);
      });

      await Promise.all(
        packageZoneConfigs.flatMap(c => {
          const newPackageId = packageIdMap.get(c.servicePackageId);
          if (!newPackageId) return [];
          return [saveZonePackageConfigServerAction(null, {
            zoneId: c.zoneId,
            servicePackageId: newPackageId,
            price: c.price,
            originalPrice: c.originalPrice ?? undefined,
            savings: c.savings ?? undefined,
            savingsPercent: c.savingsPercent ?? undefined,
          })];
        })
      );

      await refreshData();
      setSelectedServiceItem(createRes.data);
      return { ok: true };
    } catch (err: any) {
      console.error('[duplicateServiceItem]', err);
      return { ok: false, message: err?.message || 'Failed to duplicate service item' };
    }
  };

  // ---- Durations ----
  const addDurationToService = async (serviceId: string, duration: Omit<ServiceDuration, 'id'>): Promise<ActionResponse> => {
    // Read before the save so this only fires on this service's very first duration — packs are
    // otherwise left untouched by duration actions (see createDefaultPackIfMissing above).
    const isFirstDuration = serviceDurations.length === 0;
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
      await loadServiceDurationsList(serviceId);
      if (isFirstDuration) {
        await createDefaultPackIfMissing(serviceId);
        await loadServicePackagesList(serviceId);
      }
      return { ok: true };
    }
    return { ok: false, message: res.message };
  };

  const updateDurationInService = async (
    serviceId: string,
    durationId: string,
    duration: Omit<ServiceDuration, 'id'>
  ): Promise<ActionResponse> => {
    const res = await saveServiceDurationServerAction(durationId, {
      serviceItemId: serviceId,
      label: duration.label,
      durationMinutes: duration.durationMinutes,
      price: duration.price,
      discountedPrice: duration.discountedPrice ?? undefined,
      isDefault: duration.isDefault,
      displayOrder: duration.displayOrder,
    });
    if (res.ok) {
      await loadServiceDurationsList(serviceId);
      return { ok: true };
    }
    return { ok: false, message: res.message };
  };

  const deleteDurationFromService = async (serviceId: string, durationId: string): Promise<ActionResponse> => {
    const res = await deleteServiceDurationServerAction(durationId);
    if (res.ok) {
      await loadServiceDurationsList(serviceId);
      return { ok: true };
    }
    return { ok: false, message: res.message };
  };

  // ---- Packages ----
  // Only serviceItemId/label/sessions/savingsPercent are sent — price/pricePerSession/
  // originalPrice/savings/badgeText/isPopular/displayOrder are not provided by the admin panel;
  // the backend derives/defaults them (see ServicePackagePayload).
  const addPackageToService = async (serviceId: string, pkg: Omit<ServicePackage, 'id'>): Promise<ActionResponse> => {
    const res = await saveServicePackageServerAction(null, {
      serviceItemId: serviceId,
      label: pkg.label,
      sessions: pkg.sessions,
      savingsPercent: pkg.savingsPercent ?? undefined,
    });
    if (res.ok) {
      await loadServicePackagesList(serviceId);
      return { ok: true };
    }
    return { ok: false, message: res.message };
  };

  const updatePackageInService = async (
    serviceId: string,
    packageId: string,
    pkg: Omit<ServicePackage, 'id'>
  ): Promise<ActionResponse> => {
    const res = await saveServicePackageServerAction(packageId, {
      serviceItemId: serviceId,
      label: pkg.label,
      sessions: pkg.sessions,
      savingsPercent: pkg.savingsPercent ?? undefined,
    });
    if (res.ok) {
      await loadServicePackagesList(serviceId);
      return { ok: true };
    }
    return { ok: false, message: res.message };
  };

  const deletePackageFromService = async (serviceId: string, packageId: string): Promise<ActionResponse> => {
    const res = await deleteServicePackageServerAction(packageId);
    if (res.ok) {
      await loadServicePackagesList(serviceId);
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
      await loadServiceAddOnsList(serviceId);
      return { ok: true };
    }
    return { ok: false, message: res.message };
  };

  const updateAddOnInService = async (
    serviceId: string,
    addonId: string,
    addon: Omit<ServiceAddOn, 'id' | 'serviceItemId'>
  ): Promise<ActionResponse> => {
    const res = await saveServiceAddOnServerAction(addonId, {
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
      await loadServiceAddOnsList(serviceId);
      return { ok: true };
    }
    return { ok: false, message: res.message };
  };

  const deleteAddOnFromService = async (serviceId: string, addonId: string): Promise<ActionResponse> => {
    const res = await deleteServiceAddOnServerAction(addonId);
    if (res.ok) {
      await loadServiceAddOnsList(serviceId);
      return { ok: true };
    }
    return { ok: false, message: res.message };
  };

  // ---- Zone entities ----
  const createZone = async (data: CreateZoneWithPolygonPayload): Promise<ActionResponse> => {
    const res = await createZoneWithPolygonServerAction(data);
    if (res.ok) {
      if (res.data) setSelectedZone(res.data);
      await refreshData();
      return { ok: true };
    }
    return { ok: false, message: res.message };
  };

  const updateZone = async (id: string, data: UpdateZonePayload): Promise<ActionResponse> => {
    const res = await updateZoneServerAction(id, data);
    if (res.ok) {
      await refreshData();
      return { ok: true };
    }
    return { ok: false, message: res.message };
  };

  const deleteZone = async (id: string): Promise<ActionResponse> => {
    const res = await deleteZoneServerAction(id);
    if (res.ok) {
      if (selectedZone?.id === id) setSelectedZone(null);
      await refreshData();
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

  const saveZoneSuiteConfig = async (id: string | null, data: ZoneSuiteConfigPayload): Promise<ActionResponse> => {
    const res = await saveZoneSuiteConfigServerAction(id, data);
    if (res.ok) {
      await refreshData();
      return { ok: true };
    }
    return { ok: false, message: res.message };
  };

  const deleteZoneSuiteConfig = async (id: string): Promise<ActionResponse> => {
    const res = await deleteZoneSuiteConfigServerAction(id);
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
      genders,
      suites,
      serviceItems,
      selectedServiceItem,
      setSelectedServiceItem,
      zones,
      selectedZone,
      setSelectedZone,
      zoneServiceItemConfigs,
      zoneDurationConfigs,
      zonePackageConfigs,
      zoneAddOnConfigs,
      zoneSuiteConfigs,
      serviceDurations,
      servicePackages,
      serviceAddOns,
      serviceDurationsLoading,
      servicePackagesLoading,
      serviceAddOnsLoading,
      allServiceDurations,
      allServicePackages,
      allServiceAddOns,
      allServiceDurationsLoading,
      allServicePackagesLoading,
      allServiceAddOnsLoading,
      loadAllServiceDurations,
      loadAllServicePackages,
      loadAllServiceAddOns,
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
      saveServiceGender,
      updateServiceGenderStatus,
      deleteServiceGender,
      saveServiceSuite,
      updateServiceSuiteStatus,
      deleteServiceSuite,
      saveServiceItem,
      updateServiceItemStatus,
      updateServiceItemPublishStatus,
      deleteServiceItem,
      duplicateServiceItem,
      addDurationToService,
      updateDurationInService,
      deleteDurationFromService,
      addPackageToService,
      updatePackageInService,
      deletePackageFromService,
      addAddOnToService,
      updateAddOnInService,
      deleteAddOnFromService,
      createZone,
      updateZone,
      deleteZone,
      saveZoneServiceItemConfig,
      deleteZoneServiceItemConfig,
      saveZoneDurationConfig,
      deleteZoneDurationConfig,
      saveZonePackageConfig,
      deleteZonePackageConfig,
      saveZoneAddOnConfig,
      deleteZoneAddOnConfig,
      saveZoneSuiteConfig,
      deleteZoneSuiteConfig,
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
