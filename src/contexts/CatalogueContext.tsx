'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { ServiceCategory, ServiceSubCategory, ServiceItem, ServiceDuration, ServicePackage } from '../types/catalogue';
import {
  getCategoriesServerAction,
  saveCategoryServerAction,
  deleteCategoryServerAction,
} from '../lib/server-actions/category';
import {
  getSubCategoriesServerAction,
  saveSubCategoryServerAction,
  deleteSubCategoryServerAction,
} from '../lib/server-actions/sub-category';
import {
  getServiceItemsServerAction,
  saveServiceItemServerAction,
  deleteServiceItemServerAction,
} from '../lib/server-actions/service';
import {
  saveServiceDurationServerAction,
  deleteServiceDurationServerAction,
} from '../lib/server-actions/duration';
import {
  saveServicePackageServerAction,
  deleteServicePackageServerAction,
} from '../lib/server-actions/package';
import {
  saveServiceAddOnServerAction,
  deleteServiceAddOnServerAction,
} from '../lib/server-actions/addon';

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
  saveCategory: (data: Partial<ServiceCategory>) => Promise<{ ok: boolean; message?: string }>;
  saveSubCategory: (data: Partial<ServiceSubCategory>) => Promise<{ ok: boolean; message?: string }>;
  saveServiceItem: (data: Partial<ServiceItem>) => Promise<{ ok: boolean; message?: string }>;
  deleteCategory: (id: string) => Promise<{ ok: boolean; message?: string }>;
  deleteSubCategory: (id: string) => Promise<{ ok: boolean; message?: string }>;
  deleteServiceItem: (id: string) => Promise<{ ok: boolean; message?: string }>;

  // Timeslots & Packs management
  addDurationToService: (serviceId: string, duration: Omit<ServiceDuration, 'id'>) => Promise<{ ok: boolean; message?: string }>;
  deleteDurationFromService: (serviceId: string, durationId: string) => Promise<{ ok: boolean; message?: string }>;
  addPackageToService: (serviceId: string, pkg: Omit<ServicePackage, 'id'>) => Promise<{ ok: boolean; message?: string }>;
  deletePackageFromService: (serviceId: string, packageId: string) => Promise<{ ok: boolean; message?: string }>;
  addAddOnToService: (serviceId: string, addon: { name: string; price: number; description?: string; extraMinutes?: number; imageKey?: string; isActive?: boolean }) => Promise<{ ok: boolean; message?: string }>;
  deleteAddOnFromService: (serviceId: string, addonId: string) => Promise<{ ok: boolean; message?: string }>;
}

const CatalogueContext = createContext<CatalogueContextType | undefined>(undefined);

export const CatalogueProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'categories' | 'service-detail'>('categories');

  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | null>(null);

  const [subCategories, setSubCategories] = useState<ServiceSubCategory[]>([]);
  const [selectedSubCategory, setSelectedSubCategory] = useState<ServiceSubCategory | null>(null);

  const [serviceItems, setServiceItems] = useState<ServiceItem[]>([]);
  const [selectedServiceItem, setSelectedServiceItem] = useState<ServiceItem | null>(null);

  // Modals state
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [categoryModalMode, setCategoryModalMode] = useState<'category' | 'subcategory'>('category');
  const [modalEditData, setModalEditData] = useState<ServiceCategory | ServiceSubCategory | null>(null);

  // Fetch real data from NestJS Backend via Server Actions
  const refreshData = async () => {
    setLoading(true);
    try {
      const backendCategories = await getCategoriesServerAction();
      if (backendCategories && Array.isArray(backendCategories)) {
        setCategories(backendCategories);
        if (backendCategories.length > 0) {
          setSelectedCategory(prev => {
            if (prev) {
              const matched = backendCategories.find(c => c.id === prev.id);
              if (matched) return matched;
            }
            return backendCategories[0];
          });
        } else {
          setSelectedCategory(null);
        }
      }

      const backendSubCats = await getSubCategoriesServerAction();
      if (backendSubCats && Array.isArray(backendSubCats)) {
        setSubCategories(backendSubCats);
        if (backendSubCats.length > 0) {
          setSelectedSubCategory(prev => {
            if (prev) {
              const matched = backendSubCats.find(s => s.id === prev.id);
              if (matched) return matched;
            }
            return backendSubCats[0];
          });
        } else {
          setSelectedSubCategory(null);
        }
      }

      const backendServices = await getServiceItemsServerAction();
      if (backendServices && Array.isArray(backendServices)) {
        setServiceItems(backendServices);
        if (backendServices.length > 0) {
          setSelectedServiceItem(prev => {
            if (prev) {
              const matched = backendServices.find(s => s.id === prev.id);
              if (matched) return matched;
            }
            return backendServices[0];
          });
        } else {
          setSelectedServiceItem(null);
        }
      }
    } catch (err) {
      console.error('Error fetching backend catalogue data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

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

  // Category CRUD
  const saveCategory = async (data: Partial<ServiceCategory>): Promise<{ ok: boolean; message?: string }> => {
    const isNew = !modalEditData?.id || modalEditData.id.startsWith('cat-');
    const editId = isNew ? null : modalEditData.id;

    const payload = {
      name: data.name || '',
      title: data.title || data.name || '',
      slug: data.slug || undefined,
      subtitle: data.subtitle || data.shortDescription || undefined,
      displayOrder: Number(data.displayOrder) || 0,
      iconKey: data.iconKey || undefined,
    };

    const res = await saveCategoryServerAction(editId, payload);
    if (res.ok) {
      if (res.data) {
        setSelectedCategory(res.data);
      }
      await refreshData();
      return { ok: true };
    } else {
      console.error('Failed to save category:', res.message);
      return { ok: false, message: res.message };
    }
  };

  // SubCategory CRUD
  const saveSubCategory = async (data: Partial<ServiceSubCategory>): Promise<{ ok: boolean; message?: string }> => {
    const isNew = !modalEditData?.id || modalEditData.id.startsWith('sub-');
    const editId = isNew ? null : modalEditData.id;

    const payload = {
      categoryId: selectedCategory?.id || categories[0]?.id || '',
      name: data.name || '',
      title: data.title || data.name || '',
      slug: data.slug || undefined,
      subtitle: data.subtitle || data.shortDescription || undefined,
      displayOrder: Number(data.displayOrder) || 0,
      isActive: data.isActive !== undefined ? data.isActive : true,
      homeBannerKey: data.iconKey || undefined,
      iconKey: data.iconKey || undefined,
    };

    const res = await saveSubCategoryServerAction(editId, payload);
    if (res.ok) {
      if (res.data) {
        setSelectedSubCategory(res.data);
      }
      await refreshData();
      return { ok: true };
    } else {
      console.error('Failed to save subcategory:', res.message);
      return { ok: false, message: res.message };
    }
  };

  const deleteCategory = async (id: string): Promise<{ ok: boolean; message?: string }> => {
    const res = await deleteCategoryServerAction(id);
    if (res.ok) {
      await refreshData();
      return { ok: true };
    }
    return { ok: false, message: res.message };
  };

  const deleteSubCategory = async (id: string): Promise<{ ok: boolean; message?: string }> => {
    const res = await deleteSubCategoryServerAction(id);
    if (res.ok) {
      await refreshData();
      return { ok: true };
    }
    return { ok: false, message: res.message };
  };

  // Service Item CRUD
  const saveServiceItem = async (data: Partial<ServiceItem>): Promise<{ ok: boolean; message?: string }> => {
    const isNew = !selectedServiceItem?.id || selectedServiceItem.id.startsWith('srv-');
    const editId = isNew ? null : selectedServiceItem.id;
    const prev = (selectedServiceItem as any) || {};

    const payload = {
      subCategoryId: data.subCategoryId || prev.subCategoryId || selectedSubCategory?.id || subCategories[0]?.id || '',
      name: data.name !== undefined ? data.name : prev.name || '',
      cardTitle: data.cardTitle !== undefined ? data.cardTitle : prev.cardTitle || data.name || prev.name || '',
      slug: data.slug !== undefined ? data.slug : prev.slug,
      cardSubtitle: data.cardSubtitle !== undefined ? data.cardSubtitle : prev.cardSubtitle,
      shortDescription: data.shortDescription !== undefined ? data.shortDescription : prev.shortDescription,
      displayOrder: data.displayOrder !== undefined ? Number(data.displayOrder) : Number(prev.displayOrder) || 0,
      isActive: data.isActive !== undefined ? data.isActive : prev.isActive !== undefined ? prev.isActive : true,
      isPublished: data.isPublished !== undefined ? data.isPublished : prev.isPublished !== undefined ? prev.isPublished : false,
      thumbnailKey: data.thumbnailKey !== undefined ? data.thumbnailKey : prev.thumbnailKey,
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
      reviews: data.reviews !== undefined ? data.reviews : prev.customReviews || prev.reviews,
      customReviews: data.reviews !== undefined ? data.reviews : (data as any).customReviews || prev.customReviews || prev.reviews,
    };

    const res = await saveServiceItemServerAction(editId, payload);
    if (res.ok) {
      if (res.data) {
        setSelectedServiceItem(res.data);
      }
      await refreshData();
      return { ok: true };
    } else {
      console.error('Failed to save service item:', res.message);
      return { ok: false, message: res.message };
    }
  };

  const deleteServiceItem = async (id: string): Promise<{ ok: boolean; message?: string }> => {
    const res = await deleteServiceItemServerAction(id);
    if (res.ok) {
      await refreshData();
      return { ok: true };
    }
    return { ok: false, message: res.message };
  };

  const addDurationToService = async (serviceId: string, duration: Omit<ServiceDuration, 'id'>): Promise<{ ok: boolean; message?: string }> => {
    const res = await saveServiceDurationServerAction(null, {
      serviceItemId: serviceId,
      label: duration.label,
      durationMinutes: duration.durationMinutes,
      price: duration.price,
    });
    if (res.ok) {
      await refreshData();
      return { ok: true };
    }
    return { ok: false, message: res.message };
  };

  const deleteDurationFromService = async (serviceId: string, durationId: string): Promise<{ ok: boolean; message?: string }> => {
    const res = await deleteServiceDurationServerAction(durationId);
    if (res.ok) {
      await refreshData();
      return { ok: true };
    }
    return { ok: false, message: res.message };
  };

  const addPackageToService = async (serviceId: string, pkg: Omit<ServicePackage, 'id'>): Promise<{ ok: boolean; message?: string }> => {
    const res = await saveServicePackageServerAction(null, {
      serviceItemId: serviceId,
      sessions: pkg.sessions,
      price: pkg.price,
      originalPrice: pkg.originalPrice || undefined,
      savings: pkg.savings || undefined,
      savingsPercent: pkg.savingsPercent || undefined,
      label: pkg.label,
    });
    if (res.ok) {
      await refreshData();
      return { ok: true };
    }
    return { ok: false, message: res.message };
  };

  const deletePackageFromService = async (serviceId: string, packageId: string): Promise<{ ok: boolean; message?: string }> => {
    const res = await deleteServicePackageServerAction(packageId);
    if (res.ok) {
      await refreshData();
      return { ok: true };
    }
    return { ok: false, message: res.message };
  };

  const addAddOnToService = async (
    serviceId: string,
    addon: { name: string; price: number; description?: string; extraMinutes?: number; imageKey?: string; isActive?: boolean }
  ): Promise<{ ok: boolean; message?: string }> => {
    const res = await saveServiceAddOnServerAction(null, {
      serviceItemId: serviceId,
      name: addon.name,
      price: addon.price,
      description: addon.description,
      extraMinutes: addon.extraMinutes,
      imageKey: addon.imageKey,
      isActive: addon.isActive !== undefined ? addon.isActive : true,
    });
    if (res.ok) {
      await refreshData();
      return { ok: true };
    }
    return { ok: false, message: res.message };
  };

  const deleteAddOnFromService = async (serviceId: string, addonId: string): Promise<{ ok: boolean; message?: string }> => {
    const res = await deleteServiceAddOnServerAction(addonId);
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
      categoryModalOpen,
      setCategoryModalOpen,
      categoryModalMode,
      modalEditData,
      openCategoryModal,
      navigateToServiceDetail,
      refreshData,
      saveCategory,
      saveSubCategory,
      saveServiceItem,
      deleteCategory,
      deleteSubCategory,
      deleteServiceItem,
      addDurationToService,
      deleteDurationFromService,
      addPackageToService,
      deletePackageFromService,
      addAddOnToService,
      deleteAddOnFromService,
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
