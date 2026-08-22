'use client';

import React, { useState, useRef, useLayoutEffect, useEffect, useCallback } from 'react';
import { Plus, Edit3, Trash2, ChevronDown, FolderPlus, MapPin } from 'lucide-react';
import { useCatalogue } from '../../contexts/CatalogueContext';
import { getCategoriesPagedServerAction } from '../../lib/server-actions/category';
import { getSubCategoriesPagedServerAction } from '../../lib/server-actions/sub-category';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card } from '../ui/card';
import { SkeletonTableRows } from '../ui/skeleton';
import { StatusToggle } from '../ui/status-toggle';
import { useConfirm } from '../ui/confirm-dialog';
import { toast } from 'react-toastify';
import SuiteZoneAvailabilityModal from './SuiteZoneAvailabilityModal';
import { ServiceCategory, ServiceSubCategory, ServiceSuite } from '../../types/catalogue';
import Pagination from '../shared/Pagination';

// Category "chip" tabs — replaces the old click-to-open dropdown so every category is visible at
// a glance and switching is a single click. Shared by Section 1B (suites) and Section 2
// (sub-categories) below, both of which just want to change the same `selectedCategory`. The
// active pill is a single absolutely-positioned div that slides/resizes to the selected tab's
// measured position instead of the highlight just popping from one tab to another.
function CategoryTabs({
  categories,
  selectedId,
  onSelect,
}: {
  categories: ServiceCategory[];
  selectedId?: string;
  onSelect: (category: ServiceCategory) => void;
}) {
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const [indicator, setIndicator] = useState<{ left: number; top: number; width: number; height: number } | null>(null);

  const measure = () => {
    const el = selectedId ? tabRefs.current.get(selectedId) : null;
    setIndicator(el ? { left: el.offsetLeft, top: el.offsetTop, width: el.offsetWidth, height: el.offsetHeight } : null);
  };

  // Recompute whenever the selection or the tab list itself changes (categories are rarely
  // added/removed live, but this keeps the indicator honest if they are).
  useLayoutEffect(measure, [selectedId, categories]);

  // Tab widths can reflow at responsive breakpoints even though the selection didn't change.
  useEffect(() => {
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, categories]);

  if (categories.length === 0) return null;

  return (
    <div className="relative flex items-center gap-1.5 overflow-x-auto py-1">
      {/* Sliding active-tab pill — sits behind the tab labels (z-10 below) and eases toward
          whichever one is selected instead of jumping. */}
      {indicator && (
        <div
          className="absolute rounded-full bg-[#1C1512] shadow-xs transition-all duration-300 ease-out"
          style={{ left: indicator.left, top: indicator.top, width: indicator.width, height: indicator.height }}
        />
      )}
      {categories.map((cat) => (
        <button
          key={cat.id}
          ref={(el) => {
            if (el) tabRefs.current.set(cat.id, el);
            else tabRefs.current.delete(cat.id);
          }}
          onClick={() => onSelect(cat)}
          className={`relative z-10 shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-colors duration-300 ${
            selectedId === cat.id
              ? 'text-white'
              : 'bg-[#FAF5F0] text-gray-600 hover:text-[#C68A4C] hover:bg-[#F2E5D9]'
          }`}
        >
          {cat.name}
        </button>
      ))}
    </div>
  );
}

export default function CategoriesView() {
  const {
    loading,
    categories,
    subCategories,
    genders,
    suites,
    serviceItems,
    selectedCategory,
    setSelectedCategory,
    openCategoryModal,
    navigateToServiceDetail,
    deleteCategory,
    deleteSubCategory,
    deleteServiceGender,
    deleteServiceSuite,
    updateCategoryStatus,
    updateSubCategoryStatus,
    updateServiceGenderStatus,
    updateServiceSuiteStatus,
  } = useCatalogue();
  const confirm = useConfirm();

  // ---- Section 1 (Main Categories table) — real server-driven pagination ----
  // CategoryTabs (Section 1B/2) and every suite/gender derivation below still read the full
  // `categories`/`subCategories` lists off CatalogueContext, unchanged — only this table's own
  // rows + the dead pagination footer below it are converted.
  const [catPage, setCatPage] = useState(1);
  const [catPageSize, setCatPageSize] = useState(10);
  const [catRows, setCatRows] = useState<ServiceCategory[]>([]);
  const [catPagination, setCatPagination] = useState({ total: 0, totalPages: 1 });
  const [catRowsLoading, setCatRowsLoading] = useState(true);

  const fetchCatPage = useCallback(async () => {
    setCatRowsLoading(true);
    try {
      const res = await getCategoriesPagedServerAction({ page: catPage, limit: catPageSize });
      setCatRows(res.data ?? []);
      setCatPagination({ total: res.pagination?.total ?? 0, totalPages: res.pagination?.totalPages ?? 1 });
    } finally {
      setCatRowsLoading(false);
    }
    // `categories` (CatalogueContext's full list) is included so this refetches whenever a
    // category is created/edited/deleted/toggled anywhere (CategoryModal, the status toggles
    // below) — every one of those writes goes through context's saveCategory/updateCategoryStatus/
    // deleteCategory, which replace that array with a new reference, so it doubles as a "something
    // changed, refresh your own page" signal without CategoryModal needing to know this table
    // fetches its own data separately.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catPage, catPageSize, categories]);

  useEffect(() => {
    fetchCatPage();
  }, [fetchCatPage]);

  // ---- Section 2 (Sub-Categories table) — real server-driven pagination ----
  const [subPage, setSubPage] = useState(1);
  const [subPageSize, setSubPageSize] = useState(10);
  const [subRows, setSubRows] = useState<ServiceSubCategory[]>([]);
  const [subPagination, setSubPagination] = useState({ total: 0, totalPages: 1 });
  const [subRowsLoading, setSubRowsLoading] = useState(true);

  const fetchSubPage = useCallback(async () => {
    if (!selectedCategory) {
      setSubRows([]);
      setSubPagination({ total: 0, totalPages: 1 });
      setSubRowsLoading(false);
      return;
    }
    setSubRowsLoading(true);
    try {
      const res = await getSubCategoriesPagedServerAction({
        page: subPage,
        limit: subPageSize,
        categoryId: selectedCategory.id,
      });
      setSubRows(res.data ?? []);
      setSubPagination({ total: res.pagination?.total ?? 0, totalPages: res.pagination?.totalPages ?? 1 });
    } finally {
      setSubRowsLoading(false);
    }
    // See fetchCatPage's comment above — `subCategories` (context's full list) doubles as the
    // "something changed" signal here too.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subPage, subPageSize, selectedCategory, subCategories]);

  useEffect(() => {
    fetchSubPage();
  }, [fetchSubPage]);

  // Switching category starts back at page 1 of its sub-categories instead of carrying over
  // whatever page was open under the previous category.
  useEffect(() => {
    setSubPage(1);
  }, [selectedCategory?.id]);

  // The tab switcher (Section 1B/2) is a quick-navigation control, not the management table —
  // an inactive category has nothing active to manage under it, so it's dropped from the tabs
  // while still showing up (with its status toggle) in the main table above.
  const activeCategories = categories.filter(c => c.isActive !== false);

  // If the selected category drops out of the active set (toggled inactive, or it was inactive
  // on load) fall back to the first active one instead of leaving the tabs with nothing
  // highlighted while Sections 1B/2 still show content for a now-hidden category.
  useEffect(() => {
    if (selectedCategory && !activeCategories.some(c => c.id === selectedCategory.id)) {
      setSelectedCategory(activeCategories[0] || null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, activeCategories]);

  // Row currently mid-flight on its status toggle (per section) — disables that one pill and
  // swaps it to a spinner instead of locking the whole table while a single PATCH is in flight.
  const [togglingGenderId, setTogglingGenderId] = useState<string | null>(null);
  const [togglingCategoryId, setTogglingCategoryId] = useState<string | null>(null);
  const [togglingSuiteId, setTogglingSuiteId] = useState<string | null>(null);
  const [togglingSubCategoryId, setTogglingSubCategoryId] = useState<string | null>(null);

  // Filters the Sub-Categories table (Section 2) down to sub-categories that have at least one
  // service in the chosen suite — 'all' shows every sub-category for the active category.
  const [subCategorySuiteFilter, setSubCategorySuiteFilter] = useState<string>('all');
  const [subCategorySuiteFilterOpen, setSubCategorySuiteFilterOpen] = useState(false);
  // Same idea as the suite filter above, but keyed off gender instead (genders are global — see
  // currentGenders below for how the active-category set is derived).
  const [subCategoryGenderFilter, setSubCategoryGenderFilter] = useState<string>('all');
  const [subCategoryGenderFilterOpen, setSubCategoryGenderFilterOpen] = useState(false);
  // Suite selected for the "Zone Availability" modal (see ZoneSuiteConfig in catalogue.ts) —
  // separate from modalEditData/openCategoryModal since this isn't a category-modal edit flow.
  const [suiteForZoneModal, setSuiteForZoneModal] = useState<ServiceSuite | null>(null);
  const [zoneModalOpen, setZoneModalOpen] = useState(false);

  // Filter subcategories by active category
  const currentSubCategories = subCategories.filter(
    s => s.categoryId === selectedCategory?.id
  );

  // Sub-categories, suites and genders are all scoped to a category but not to each other
  // directly — the only link is via ServiceItem (each service has a subCategoryId plus a
  // suiteId/genderId). Look up which suites/genders a sub-category's services actually belong to
  // from that join.
  const suiteIdsForSubCategory = (subCategoryId: string) =>
    Array.from(new Set(
      serviceItems.filter(s => s.subCategoryId === subCategoryId).map(s => s.suiteId).filter(Boolean)
    ));
  const suitesForSubCategory = (subCategoryId: string) =>
    suiteIdsForSubCategory(subCategoryId)
      .map(id => suites.find(su => su.id === id))
      .filter((s): s is typeof suites[number] => !!s);

  const genderIdsForSubCategory = (subCategoryId: string) =>
    Array.from(new Set(
      serviceItems.filter(s => s.subCategoryId === subCategoryId).map(s => s.genderId).filter(Boolean)
    ));
  const gendersForSubCategory = (subCategoryId: string) =>
    genderIdsForSubCategory(subCategoryId)
      .map(id => genders.find(g => g.id === id))
      .filter((g): g is typeof genders[number] => !!g);

  // Suites for the active category (see ServiceSuite in catalog.prisma) — scoped the same way
  // sub-categories are.
  const currentSuites = suites.filter(s => s.categoryId === selectedCategory?.id);

  // Genders are global (no categoryId) — "current" here means whichever genders are actually in
  // use by a service under one of the active category's sub-categories, not every gender that
  // exists globally.
  const currentGenders = genders.filter(g =>
    currentSubCategories.some(sub => genderIdsForSubCategory(sub.id).includes(g.id))
  );

  // A suiteId/genderId picked while viewing one category won't exist under another — fall back
  // to "all" rather than filtering everything out (or needing an effect to reset the raw state)
  // once the active category changes out from under a previously-picked filter.
  const activeSuiteFilter = subCategorySuiteFilter !== 'all' && !currentSuites.some(s => s.id === subCategorySuiteFilter)
    ? 'all'
    : subCategorySuiteFilter;
  const activeGenderFilter = subCategoryGenderFilter !== 'all' && !currentGenders.some(g => g.id === subCategoryGenderFilter)
    ? 'all'
    : subCategoryGenderFilter;

  const subCategorySuiteFilterLabel = activeSuiteFilter === 'all'
    ? 'All Suites'
    : suites.find(su => su.id === activeSuiteFilter)?.name || 'All Suites';
  const subCategoryGenderFilterLabel = activeGenderFilter === 'all'
    ? 'All Genders'
    : genders.find(g => g.id === activeGenderFilter)?.name || 'All Genders';

  // Suite/Gender aren't real fields on GetSubCategoriesQueryDto or the ServiceSubCategory Prisma
  // model (only ServiceItem carries suiteId/genderId) — these two filters stay client-side, but
  // now over `subRows` (this category's current fetched PAGE of sub-categories) instead of the
  // full context list, since Section 2's rows are now paginated. A filter can therefore narrow
  // within a page without changing which page's worth of rows was fetched.
  const filteredSubCategories = subRows.filter(sub => {
    const suiteOk = activeSuiteFilter === 'all' || suiteIdsForSubCategory(sub.id).includes(activeSuiteFilter);
    const genderOk = activeGenderFilter === 'all' || genderIdsForSubCategory(sub.id).includes(activeGenderFilter);
    return suiteOk && genderOk;
  });

  // Human-readable summary of whichever filters are currently narrowing the table, used by the
  // "no matches" empty state below.
  const activeFilterDescriptions = [
    activeSuiteFilter !== 'all' ? `the "${subCategorySuiteFilterLabel}" suite` : null,
    activeGenderFilter !== 'all' ? `the "${subCategoryGenderFilterLabel}" gender` : null,
  ].filter((d): d is string => !!d).join(' and ');

  // The backend doesn't return subCategoriesCount/servicesCount on category/sub-category
  // responses — compute them client-side from the already-loaded lists.
  const servicesCountBySubCategory = (subCategoryId: string) =>
    serviceItems.filter(s => s.subCategoryId === subCategoryId).length;

  const servicesCountByCategory = (categoryId: string) =>
    subCategories
      .filter(s => s.categoryId === categoryId)
      .reduce((total, sub) => total + servicesCountBySubCategory(sub.id), 0);

  const servicesCountBySuite = (suiteId: string) =>
    serviceItems.filter(s => s.suiteId === suiteId).length;
  const servicesCountByGender = (genderId: string) =>
    serviceItems.filter(s => s.genderId === genderId).length;

  const handleDeleteCategory = async (id: string, name: string) => {
    const ok = await confirm({
      title: 'Delete this category?',
      description: `"${name}" and every sub-category, suite and service under it will be removed. This can't be undone.`,
    });
    if (!ok) return;
    try {
      const res = await deleteCategory(id);
      if (res.ok) {
        toast.success('Category deleted successfully!');
      } else {
        toast.error(`Failed to delete category: ${res.message || 'Server error'}`);
      }
    } catch (err: any) {
      toast.error(`Delete failed: ${err.message || 'Operation failed'}`);
    }
  };

  const handleDeleteSubCategory = async (id: string, name: string) => {
    const ok = await confirm({
      title: 'Delete this sub-category?',
      description: `"${name}" and its services will be removed. This can't be undone.`,
    });
    if (!ok) return;
    try {
      const res = await deleteSubCategory(id);
      if (res.ok) {
        toast.success('Sub-category deleted successfully!');
      } else {
        toast.error(`Failed to delete sub-category: ${res.message || 'Server error'}`);
      }
    } catch (err: any) {
      toast.error(`Delete failed: ${err.message || 'Operation failed'}`);
    }
  };

  const handleDeleteGender = async (id: string, name: string) => {
    const ok = await confirm({
      title: 'Delete this gender?',
      description: `"${name}" will be removed. Services already tagged with it keep their reference. This can't be undone.`,
    });
    if (!ok) return;
    try {
      const res = await deleteServiceGender(id);
      if (res.ok) {
        toast.success('Gender deleted successfully!');
      } else {
        toast.error(`Failed to delete gender: ${res.message || 'Server error'}`);
      }
    } catch (err: any) {
      toast.error(`Delete failed: ${err.message || 'Operation failed'}`);
    }
  };

  const handleDeleteSuite = async (id: string, name: string) => {
    const ok = await confirm({
      title: 'Delete this suite?',
      description: `"${name}" and its zone availability will be removed. This can't be undone.`,
    });
    if (!ok) return;
    try {
      const res = await deleteServiceSuite(id);
      if (res.ok) {
        toast.success('Suite deleted successfully!');
      } else {
        toast.error(`Failed to delete suite: ${res.message || 'Server error'}`);
      }
    } catch (err: any) {
      toast.error(`Delete failed: ${err.message || 'Operation failed'}`);
    }
  };

  // ---- Inline "from the outside" status toggles — flip isActive straight from the list row,
  // no need to open the edit modal just to change status. ----
  const handleToggleGenderStatus = async (id: string, nextActive: boolean) => {
    setTogglingGenderId(id);
    try {
      const res = await updateServiceGenderStatus(id, nextActive);
      if (res.ok) toast.success(`Gender marked ${nextActive ? 'active' : 'inactive'}`);
      else toast.error(res.message || 'Failed to update status');
    } finally {
      setTogglingGenderId(null);
    }
  };

  const handleToggleCategoryStatus = async (id: string, nextActive: boolean) => {
    setTogglingCategoryId(id);
    try {
      const res = await updateCategoryStatus(id, nextActive);
      if (res.ok) toast.success(`Category marked ${nextActive ? 'active' : 'inactive'}`);
      else toast.error(res.message || 'Failed to update status');
    } finally {
      setTogglingCategoryId(null);
    }
  };

  const handleToggleSuiteStatus = async (id: string, nextActive: boolean) => {
    setTogglingSuiteId(id);
    try {
      const res = await updateServiceSuiteStatus(id, nextActive);
      if (res.ok) toast.success(`Suite marked ${nextActive ? 'active' : 'inactive'}`);
      else toast.error(res.message || 'Failed to update status');
    } finally {
      setTogglingSuiteId(null);
    }
  };

  const handleToggleSubCategoryStatus = async (id: string, nextActive: boolean) => {
    setTogglingSubCategoryId(id);
    try {
      const res = await updateSubCategoryStatus(id, nextActive);
      if (res.ok) toast.success(`Sub-category marked ${nextActive ? 'active' : 'inactive'}`);
      else toast.error(res.message || 'Failed to update status');
    } finally {
      setTogglingSubCategoryId(null);
    }
  };

  return (
    <div className="space-y-8 md:space-y-10 max-w-7xl mx-auto pb-12 animate-in fade-in duration-300 w-full">

      {/* SECTION 0: GENDERS (global — not scoped to a category, see ServiceGender in catalog.prisma) */}
      <div className="space-y-4 w-full">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">Genders</h1>
            <p className="text-xs md:text-sm text-gray-500 mt-0.5">Manage the genders services can be tagged with</p>
          </div>
          <Button
            onClick={() => openCategoryModal('gender')}
            className="self-start sm:self-auto bg-[#1C1512] hover:bg-black text-white rounded-xl shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add Gender</span>
          </Button>
        </div>

        {/* Genders Table Card */}
        <Card className="w-full">
          {loading ? (
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="bg-[#FAF5F0] text-gray-700 text-xs font-semibold uppercase tracking-wider border-b border-[#F2E5D9]">
                    <th className="py-4 px-4 sm:px-6">Gender</th>
                    <th className="py-4 px-4 sm:px-6 text-center">Code</th>
                    <th className="py-4 px-4 sm:px-6 text-center">Services</th>
                    <th className="py-4 px-4 sm:px-6 text-center">Status</th>
                    <th className="py-4 px-4 sm:px-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <SkeletonTableRows rows={2} columns={2} />
                </tbody>
              </table>
            </div>
          ) : genders.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center text-center p-6 space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#FAF5F0] text-[#C68A4C] flex items-center justify-center">
                <FolderPlus className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-gray-800">No Genders Yet</h3>
              <p className="text-xs text-gray-500 max-w-sm">
                Get started by creating your first gender (e.g. Male, Female).
              </p>
              <Button
                onClick={() => openCategoryModal('gender')}
                size="sm"
                className="mt-2 bg-[#1C1512] text-white"
              >
                + Create Gender
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="bg-[#FAF5F0] text-gray-700 text-xs font-semibold uppercase tracking-wider border-b border-[#F2E5D9]">
                    <th className="py-4 px-4 sm:px-6">Gender</th>
                    <th className="py-4 px-4 sm:px-6 text-center">Code</th>
                    <th className="py-4 px-4 sm:px-6 text-center">Services</th>
                    <th className="py-4 px-4 sm:px-6 text-center">Status</th>
                    <th className="py-4 px-4 sm:px-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                  {genders.map((gender) => (
                    <tr key={gender.id} className="hover:bg-[#FAF9F6]/80 transition-colors">
                      <td className="py-4 px-4 sm:px-6">
                        <div className="flex items-center gap-3 sm:gap-4">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-[#FAF5F0] border border-[#F2E5D9] flex items-center justify-center overflow-hidden flex-shrink-0 p-1">
                            <img
                              src={gender.iconKey || gender.homeBannerKey || 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=120&q=80'}
                              alt={gender.name}
                              className="w-full h-full object-contain"
                            />
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900 text-sm sm:text-base">{gender.name}</div>
                            <div className="text-xs text-gray-400 mt-0.5">{gender.subtitle || gender.slug}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 sm:px-6 text-center font-medium text-gray-600">{gender.code}</td>
                      <td className="py-4 px-4 sm:px-6 text-center font-medium text-gray-600">
                        {servicesCountByGender(gender.id)}
                      </td>
                      <td className="py-4 px-4 sm:px-6 text-center">
                        <StatusToggle
                          isActive={gender.isActive !== false}
                          busy={togglingGenderId === gender.id}
                          onToggle={() => handleToggleGenderStatus(gender.id, !(gender.isActive !== false))}
                        />
                      </td>
                      <td className="py-4 px-4 sm:px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => openCategoryModal('gender', gender)}
                            title="Edit Gender"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => handleDeleteGender(gender.id, gender.name)}
                            className="bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-700 border-none"
                            title="Delete Gender"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* SECTION 1: MAIN CATEGORIES */}
      <div className="space-y-4 w-full">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">Eezit</h1>
            <p className="text-xs md:text-sm text-gray-500 mt-0.5">Manage your main categories</p>
          </div>
          <Button
            onClick={() => openCategoryModal('category')}
            className="self-start sm:self-auto bg-[#1C1512] hover:bg-black text-white rounded-xl shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add Category</span>
          </Button>
        </div>

        {/* Main Categories Table Card */}
        <Card className="w-full">
          {loading || catRowsLoading ? (
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="bg-[#FAF5F0] text-gray-700 text-xs font-semibold uppercase tracking-wider border-b border-[#F2E5D9]">
                    <th className="py-4 px-4 sm:px-6">Categories</th>
                    <th className="py-4 px-4 sm:px-6 text-center">Sub-Categories</th>
                    <th className="py-4 px-4 sm:px-6 text-center">Services</th>
                    <th className="py-4 px-4 sm:px-6 text-center">Status</th>
                    <th className="py-4 px-4 sm:px-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <SkeletonTableRows rows={3} columns={2} />
                </tbody>
              </table>
            </div>
          ) : catPagination.total === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center text-center p-6 space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#FAF5F0] text-[#C68A4C] flex items-center justify-center">
                <FolderPlus className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-gray-800">No Main Categories Yet</h3>
              <p className="text-xs text-gray-500 max-w-sm">
                Get started by creating your first category in the backend database.
              </p>
              <Button
                onClick={() => openCategoryModal('category')}
                size="sm"
                className="mt-2 bg-[#1C1512] text-white"
              >
                + Create Category
              </Button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className="bg-[#FAF5F0] text-gray-700 text-xs font-semibold uppercase tracking-wider border-b border-[#F2E5D9]">
                      <th className="py-4 px-4 sm:px-6">Categories</th>
                      <th className="py-4 px-4 sm:px-6 text-center">Sub-Categories</th>
                      <th className="py-4 px-4 sm:px-6 text-center">Services</th>
                      <th className="py-4 px-4 sm:px-6 text-center">Status</th>
                      <th className="py-4 px-4 sm:px-6 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                    {catRows.map((category) => (
                      <tr 
                        key={category.id} 
                        className={`hover:bg-[#FAF9F6]/80 transition-colors cursor-pointer ${
                          selectedCategory?.id === category.id ? 'bg-[#FAF5F0]/30' : ''
                        }`}
                        onClick={() => setSelectedCategory(category)}
                      >
                        {/* Category Title + Subtitle + Icon */}
                        <td className="py-4 px-4 sm:px-6">
                          <div className="flex items-center gap-3 sm:gap-4">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-[#FAF5F0] border border-[#F2E5D9] flex items-center justify-center overflow-hidden flex-shrink-0 p-1">
                              <img
                                src={category.iconKey || category.homeBannerKey || 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=120&q=80'}
                                alt={category.name}
                                className="w-full h-full object-contain"
                              />
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900 text-sm sm:text-base">{category.name}</div>
                              <div className="text-xs text-gray-400 mt-0.5">{category.subtitle || category.slug}</div>
                            </div>
                          </div>
                        </td>

                        {/* Sub-Categories count */}
                        <td className="py-4 px-4 sm:px-6 text-center font-medium text-gray-600">
                          {subCategories.filter(s => s.categoryId === category.id).length}
                        </td>

                        {/* Services count */}
                        <td className="py-4 px-4 sm:px-6 text-center font-medium text-gray-600">
                          {servicesCountByCategory(category.id)}
                        </td>

                        {/* Status Badge */}
                        <td className="py-4 px-4 sm:px-6 text-center" onClick={(e) => e.stopPropagation()}>
                          <StatusToggle
                            isActive={category.isActive !== false}
                            busy={togglingCategoryId === category.id}
                            onToggle={() => handleToggleCategoryStatus(category.id, !(category.isActive !== false))}
                          />
                        </td>

                        {/* Action Buttons */}
                        <td className="py-4 px-4 sm:px-6 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => openCategoryModal('category', category)}
                              title="Edit Category"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="icon"
                              onClick={() => handleDeleteCategory(category.id, category.name)}
                              className="bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-700 border-none"
                              title="Delete Category"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Footer Pagination — real, backend-driven */}
              <Pagination
                page={catPage}
                totalPages={catPagination.totalPages}
                onPageChange={setCatPage}
                pageSize={catPageSize}
                onPageSizeChange={(size) => { setCatPageSize(size); setCatPage(1); }}
                totalItems={catPagination.total}
                itemLabel="categories"
                className="px-4 sm:px-6 py-4 bg-white border-t border-gray-100"
              />
            </>
          )}
        </Card>
      </div>

      {/* SECTION 1B: SUITES FOR SELECTED CATEGORY (see ServiceSuite in catalog.prisma) */}
      <div className="space-y-4 pt-4 w-full">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">
              Suites for <span className="text-[#C68A4C]">{selectedCategory?.name || 'Category'}</span>
            </h2>
            <p className="text-xs md:text-sm text-gray-500 mt-0.5">
              Manage the suites (e.g. Classic, Premium) services under this category can belong to
            </p>
          </div>
          <Button
            onClick={() => openCategoryModal('suite')}
            disabled={!selectedCategory}
            className="self-start sm:self-auto bg-[#1C1512] hover:bg-black text-white rounded-xl shadow-xs disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            <span>Add Suite</span>
          </Button>
        </div>

        {/* Category switcher — tabs instead of a dropdown so every category is reachable in one
            glance (see CategoryTabs above); drives the same selectedCategory used by Section 2. */}
        <CategoryTabs categories={activeCategories} selectedId={selectedCategory?.id} onSelect={setSelectedCategory} />

        {/* Suites Table Card */}
        <Card className="w-full">
          {loading ? (
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse min-w-[500px]">
                <thead>
                  <tr className="bg-[#FAF5F0] text-gray-700 text-xs font-semibold uppercase tracking-wider border-b border-[#F2E5D9]">
                    <th className="py-4 px-4 sm:px-6">Suites</th>
                    <th className="py-4 px-4 sm:px-6 text-center">Services</th>
                    <th className="py-4 px-4 sm:px-6 text-center">Status</th>
                    <th className="py-4 px-4 sm:px-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <SkeletonTableRows rows={2} columns={1} />
                </tbody>
              </table>
            </div>
          ) : currentSuites.length === 0 ? (
            <div className="py-14 flex flex-col items-center justify-center text-center p-6 space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#FAF5F0] text-[#C68A4C] flex items-center justify-center">
                <FolderPlus className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-gray-800">No Suites Found</h3>
              <p className="text-xs text-gray-500 max-w-sm">
                There are no suites for {selectedCategory?.name || 'this category'} in the database.
              </p>
              <Button
                onClick={() => openCategoryModal('suite')}
                disabled={!selectedCategory}
                size="sm"
                className="mt-2 bg-[#1C1512] text-white"
              >
                + Create Suite
              </Button>
            </div>
          ) : (
            // Re-keyed on the active category so switching tabs replays the fade-in instead of
            // the new rows just appearing (see @keyframes fadeSlideIn in globals.css).
            <div key={selectedCategory?.id} className="overflow-x-auto w-full animate-[fadeSlideIn_0.3s_ease-out]">
              <table className="w-full text-left border-collapse min-w-[500px]">
                <thead>
                  <tr className="bg-[#FAF5F0] text-gray-700 text-xs font-semibold uppercase tracking-wider border-b border-[#F2E5D9]">
                    <th className="py-4 px-4 sm:px-6">Suites</th>
                    <th className="py-4 px-4 sm:px-6 text-center">Services</th>
                    <th className="py-4 px-4 sm:px-6 text-center">Status</th>
                    <th className="py-4 px-4 sm:px-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                  {currentSuites.map((suite) => (
                    <tr key={suite.id} className="hover:bg-[#FAF9F6]/80 transition-colors">
                      <td className="py-4 px-4 sm:px-6">
                        <div className="flex items-center gap-3 sm:gap-4">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-[#FAF5F0] border border-[#F2E5D9] flex items-center justify-center overflow-hidden flex-shrink-0 p-1">
                            <img
                              src={suite.iconKey || suite.homeBannerKey || 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=120&q=80'}
                              alt={suite.name}
                              className="w-full h-full object-contain"
                            />
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900 text-sm sm:text-base">{suite.name}</div>
                            <div className="text-xs text-gray-400 mt-0.5">{suite.subtitle || suite.title}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 sm:px-6 text-center font-medium text-gray-600">
                        {servicesCountBySuite(suite.id)}
                      </td>
                      <td className="py-4 px-4 sm:px-6 text-center">
                        <StatusToggle
                          isActive={suite.isActive !== false}
                          busy={togglingSuiteId === suite.id}
                          onToggle={() => handleToggleSuiteStatus(suite.id, !(suite.isActive !== false))}
                        />
                      </td>
                      <td className="py-4 px-4 sm:px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => { setSuiteForZoneModal(suite); setZoneModalOpen(true); }}
                            title="Zone Availability"
                          >
                            <MapPin className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => openCategoryModal('suite', suite)}
                            title="Edit Suite"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => handleDeleteSuite(suite.id, suite.name)}
                            className="bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-700 border-none"
                            title="Delete Suite"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* SECTION 2: SUB-CATEGORIES FOR SELECTED CATEGORY */}
      <div className="space-y-4 pt-4 w-full">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
              {selectedCategory?.name || 'Category'}
            </h1>
            <p className="text-xs md:text-sm text-gray-500 mt-0.5">
              Manage {selectedCategory?.name ? selectedCategory.name.toLowerCase() : 'category'} sub-categories
            </p>
          </div>
          <Button
            onClick={() => openCategoryModal('subcategory')}
            className="self-start sm:self-auto bg-[#1C1512] hover:bg-black text-white rounded-xl shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add Sub-Category</span>
          </Button>
        </div>

        {/* Category switcher + Suite/Gender filters, flexed onto one line sitting right above the
            table they control (see CategoryTabs above for the tabs' sliding indicator; the filter
            dropdowns below fade/scale in via subCategorySuiteFilterOpen/subCategoryGenderFilterOpen
            instead of just popping open). */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <CategoryTabs categories={activeCategories} selectedId={selectedCategory?.id} onSelect={setSelectedCategory} />

          {(currentSuites.length > 0 || currentGenders.length > 0) && (
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap self-start sm:self-auto">
              {/* Suite filter — only worth showing once the active category actually has suites
                  to filter by (see currentSuites, computed above for Section 1B). */}
              {currentSuites.length > 0 && (
                <div className="relative inline-block">
                  <button
                    onClick={() => { setSubCategorySuiteFilterOpen(!subCategorySuiteFilterOpen); setSubCategoryGenderFilterOpen(false); }}
                    className="flex items-center gap-1.5 px-3 h-10 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:border-[#C68A4C] hover:text-[#C68A4C] transition-colors"
                  >
                    <span>Suite: {subCategorySuiteFilterLabel}</span>
                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${subCategorySuiteFilterOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Always mounted (rather than only while open) so the fade/scale below can
                      transition on close too, not just pop out of existence. */}
                  <div
                    className={`absolute top-full right-0 sm:left-0 mt-2 w-56 origin-top bg-white border border-gray-100 rounded-xl shadow-xl z-20 py-1 max-h-72 overflow-y-auto transition-all duration-150 ease-out ${
                      subCategorySuiteFilterOpen
                        ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
                        : 'opacity-0 scale-95 -translate-y-1 pointer-events-none'
                    }`}
                  >
                    <button
                      onClick={() => {
                        setSubCategorySuiteFilter('all');
                        setSubCategorySuiteFilterOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm font-medium hover:bg-[#FAF5F0] hover:text-[#C68A4C] ${
                        activeSuiteFilter === 'all' ? 'text-[#C68A4C]' : 'text-gray-700'
                      }`}
                    >
                      All Suites
                    </button>
                    {currentSuites.map((suite) => (
                      <button
                        key={suite.id}
                        onClick={() => {
                          setSubCategorySuiteFilter(suite.id);
                          setSubCategorySuiteFilterOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm font-medium hover:bg-[#FAF5F0] hover:text-[#C68A4C] ${
                          activeSuiteFilter === suite.id ? 'text-[#C68A4C]' : 'text-gray-700'
                        }`}
                      >
                        {suite.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Gender filter — same pattern as the suite filter above, only shown once the
                  active category actually has gender-tagged services to filter by. */}
              {currentGenders.length > 0 && (
                <div className="relative inline-block">
                  <button
                    onClick={() => { setSubCategoryGenderFilterOpen(!subCategoryGenderFilterOpen); setSubCategorySuiteFilterOpen(false); }}
                    className="flex items-center gap-1.5 px-3 h-10 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:border-[#C68A4C] hover:text-[#C68A4C] transition-colors"
                  >
                    <span>Gender: {subCategoryGenderFilterLabel}</span>
                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${subCategoryGenderFilterOpen ? 'rotate-180' : ''}`} />
                  </button>

                  <div
                    className={`absolute top-full right-0 sm:left-0 mt-2 w-56 origin-top bg-white border border-gray-100 rounded-xl shadow-xl z-20 py-1 max-h-72 overflow-y-auto transition-all duration-150 ease-out ${
                      subCategoryGenderFilterOpen
                        ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
                        : 'opacity-0 scale-95 -translate-y-1 pointer-events-none'
                    }`}
                  >
                    <button
                      onClick={() => {
                        setSubCategoryGenderFilter('all');
                        setSubCategoryGenderFilterOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm font-medium hover:bg-[#FAF5F0] hover:text-[#C68A4C] ${
                        activeGenderFilter === 'all' ? 'text-[#C68A4C]' : 'text-gray-700'
                      }`}
                    >
                      All Genders
                    </button>
                    {currentGenders.map((gender) => (
                      <button
                        key={gender.id}
                        onClick={() => {
                          setSubCategoryGenderFilter(gender.id);
                          setSubCategoryGenderFilterOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm font-medium hover:bg-[#FAF5F0] hover:text-[#C68A4C] ${
                          activeGenderFilter === gender.id ? 'text-[#C68A4C]' : 'text-gray-700'
                        }`}
                      >
                        {gender.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sub-Categories Table Card */}
        <Card className="w-full">
          {loading || subRowsLoading ? (
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse min-w-[640px]">
                <thead>
                  <tr className="bg-[#FAF5F0] text-gray-700 text-xs font-semibold uppercase tracking-wider border-b border-[#F2E5D9]">
                    <th className="py-4 px-4 sm:px-6">Sub-Categories</th>
                    <th className="py-4 px-4 sm:px-6 text-center">Services</th>
                    <th className="py-4 px-4 sm:px-6 text-center">Suites</th>
                    <th className="py-4 px-4 sm:px-6 text-center">Genders</th>
                    <th className="py-4 px-4 sm:px-6 text-center">Status</th>
                    <th className="py-4 px-4 sm:px-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <SkeletonTableRows rows={3} columns={3} />
                </tbody>
              </table>
            </div>
          ) : subPagination.total === 0 ? (
            <div className="py-14 flex flex-col items-center justify-center text-center p-6 space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#FAF5F0] text-[#C68A4C] flex items-center justify-center">
                <FolderPlus className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-gray-800">No Sub-Categories Found</h3>
              <p className="text-xs text-gray-500 max-w-sm">
                There are no sub-categories for {selectedCategory?.name || 'this category'} in the database.
              </p>
              <Button
                onClick={() => openCategoryModal('subcategory')}
                size="sm"
                className="mt-2 bg-[#1C1512] text-white"
              >
                + Create Sub-Category
              </Button>
            </div>
          ) : filteredSubCategories.length === 0 ? (
            <div className="py-14 flex flex-col items-center justify-center text-center p-6 space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#FAF5F0] text-[#C68A4C] flex items-center justify-center">
                <FolderPlus className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-gray-800">No Sub-Categories Match These Filters</h3>
              <p className="text-xs text-gray-500 max-w-sm">
                None of {selectedCategory?.name || 'this category'}&apos;s sub-categories have a service in {activeFilterDescriptions}.
              </p>
              <Button
                onClick={() => { setSubCategorySuiteFilter('all'); setSubCategoryGenderFilter('all'); }}
                size="sm"
                variant="outline"
                className="mt-2"
              >
                Clear Filters
              </Button>
            </div>
          ) : (
            // Re-keyed on the active category + filters so switching either replays the fade-in
            // instead of the new rows just appearing (see @keyframes fadeSlideIn in globals.css).
            <div key={`${selectedCategory?.id}-${activeSuiteFilter}-${activeGenderFilter}`} className="animate-[fadeSlideIn_0.3s_ease-out]">
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left border-collapse min-w-[640px]">
                  <thead>
                    <tr className="bg-[#FAF5F0] text-gray-700 text-xs font-semibold uppercase tracking-wider border-b border-[#F2E5D9]">
                      <th className="py-4 px-4 sm:px-6">Sub-Categories</th>
                      <th className="py-4 px-4 sm:px-6 text-center">Services</th>
                      <th className="py-4 px-4 sm:px-6 text-center">Suites</th>
                      <th className="py-4 px-4 sm:px-6 text-center">Genders</th>
                      <th className="py-4 px-4 sm:px-6 text-center">Status</th>
                      <th className="py-4 px-4 sm:px-6 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                    {filteredSubCategories.map((sub) => (
                      <tr
                        key={sub.id}
                        className="hover:bg-[#FAF9F6]/80 transition-colors cursor-pointer"
                        onClick={() => navigateToServiceDetail(sub)}
                      >
                        {/* Sub-Category Title + Subtitle + Icon */}
                        <td className="py-4 px-4 sm:px-6">
                          <div className="flex items-center gap-3 sm:gap-4">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-[#FAF5F0] border border-[#F2E5D9] flex items-center justify-center overflow-hidden flex-shrink-0 p-1">
                              <img
                                src={sub.iconKey || sub.homeBannerKey || 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=120&q=80'}
                                alt={sub.name}
                                className="w-full h-full object-contain"
                              />
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900 text-sm sm:text-base">{sub.name}</div>
                              <div className="text-xs text-gray-400 mt-0.5">{sub.subtitle || sub.title}</div>
                            </div>
                          </div>
                        </td>

                        {/* Services count */}
                        <td className="py-4 px-4 sm:px-6 text-center font-medium text-gray-600">
                          {servicesCountBySubCategory(sub.id)}
                        </td>

                        {/* Suites this sub-category's services belong to (derived via ServiceItem —
                            see suitesForSubCategory above; there's no direct FK). */}
                        <td className="py-4 px-4 sm:px-6" onClick={(e) => e.stopPropagation()}>
                          <div className="flex flex-wrap items-center justify-center gap-1.5">
                            {suitesForSubCategory(sub.id).length === 0 ? (
                              <span className="text-xs text-gray-400">—</span>
                            ) : (
                              suitesForSubCategory(sub.id).map((suite) => (
                                <Badge key={suite.id} variant="secondary">{suite.name}</Badge>
                              ))
                            )}
                          </div>
                        </td>

                        {/* Genders this sub-category's services are tagged with (derived the same
                            way as suites, via ServiceItem — see gendersForSubCategory above). */}
                        <td className="py-4 px-4 sm:px-6" onClick={(e) => e.stopPropagation()}>
                          <div className="flex flex-wrap items-center justify-center gap-1.5">
                            {gendersForSubCategory(sub.id).length === 0 ? (
                              <span className="text-xs text-gray-400">—</span>
                            ) : (
                              gendersForSubCategory(sub.id).map((gender) => (
                                <Badge key={gender.id} variant="secondary">{gender.name}</Badge>
                              ))
                            )}
                          </div>
                        </td>

                        {/* Status Badge */}
                        <td className="py-4 px-4 sm:px-6 text-center" onClick={(e) => e.stopPropagation()}>
                          <StatusToggle
                            isActive={sub.isActive !== false}
                            busy={togglingSubCategoryId === sub.id}
                            onToggle={() => handleToggleSubCategoryStatus(sub.id, !(sub.isActive !== false))}
                          />
                        </td>

                        {/* Action Buttons */}
                        <td className="py-4 px-4 sm:px-6 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => openCategoryModal('subcategory', sub)}
                              title="Edit Sub-Category"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="icon"
                              onClick={() => handleDeleteSubCategory(sub.id, sub.name)}
                              className="bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-700 border-none"
                              title="Delete Sub-Category"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Footer Pagination — real, backend-driven (categoryId-scoped); the Suite/Gender
                  filters above narrow within whichever page this shows, they don't change the
                  query, so "showing" counts the fetched page, not the post-filter row count. */}
              <Pagination
                page={subPage}
                totalPages={subPagination.totalPages}
                onPageChange={setSubPage}
                pageSize={subPageSize}
                onPageSizeChange={(size) => { setSubPageSize(size); setSubPage(1); }}
                totalItems={subPagination.total}
                itemLabel="sub-categories"
                className="px-4 sm:px-6 py-4 bg-white border-t border-gray-100"
              />
            </div>
          )}
        </Card>
      </div>

      <SuiteZoneAvailabilityModal
        isOpen={zoneModalOpen}
        onClose={() => { setZoneModalOpen(false); setSuiteForZoneModal(null); }}
        suite={suiteForZoneModal}
      />
    </div>
  );
}
