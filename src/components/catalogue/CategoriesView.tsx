'use client';

import React, { useState } from 'react';
import { Plus, Edit3, Trash2, ChevronDown, ChevronLeft, ChevronRight, Loader2, FolderPlus, MapPin } from 'lucide-react';
import { useCatalogue } from '../../contexts/CatalogueContext';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card } from '../ui/card';
import { toast } from 'react-toastify';
import SuiteZoneAvailabilityModal from './SuiteZoneAvailabilityModal';
import { ServiceSuite } from '../../types/catalogue';

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
    deleteServiceSuite
  } = useCatalogue();

  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  // Separate open/close state from the Sub-Categories section's dropdown below (even though
  // both just pick `selectedCategory`) so opening one doesn't also pop the other's menu open.
  const [suiteCategoryDropdownOpen, setSuiteCategoryDropdownOpen] = useState(false);
  // Filters the Sub-Categories table (Section 2) down to sub-categories that have at least one
  // service in the chosen suite — 'all' shows every sub-category for the active category.
  const [subCategorySuiteFilter, setSubCategorySuiteFilter] = useState<string>('all');
  const [subCategorySuiteFilterOpen, setSubCategorySuiteFilterOpen] = useState(false);
  // Suite selected for the "Zone Availability" modal (see ZoneSuiteConfig in catalogue.ts) —
  // separate from modalEditData/openCategoryModal since this isn't a category-modal edit flow.
  const [suiteForZoneModal, setSuiteForZoneModal] = useState<ServiceSuite | null>(null);
  const [zoneModalOpen, setZoneModalOpen] = useState(false);

  // Filter subcategories by active category
  const currentSubCategories = subCategories.filter(
    s => s.categoryId === selectedCategory?.id
  );

  // Sub-categories and suites are both scoped to a category but not to each other directly —
  // the only link is via ServiceItem (each service has both a subCategoryId and a suiteId). Look
  // up which suites a sub-category's services actually belong to from that join.
  const suiteIdsForSubCategory = (subCategoryId: string) =>
    Array.from(new Set(
      serviceItems.filter(s => s.subCategoryId === subCategoryId).map(s => s.suiteId).filter(Boolean)
    ));
  const suitesForSubCategory = (subCategoryId: string) =>
    suiteIdsForSubCategory(subCategoryId)
      .map(id => suites.find(su => su.id === id))
      .filter((s): s is typeof suites[number] => !!s);

  // Suites for the active category (see ServiceSuite in catalog.prisma) — scoped the same way
  // sub-categories are. Genders are global (no categoryId), so that table below isn't filtered.
  const currentSuites = suites.filter(s => s.categoryId === selectedCategory?.id);

  // A suiteId picked while viewing one category won't exist under another — fall back to "all"
  // rather than filtering everything out (or needing an effect to reset the raw state) once the
  // active category changes out from under a previously-picked suite.
  const activeSuiteFilter = subCategorySuiteFilter !== 'all' && !currentSuites.some(s => s.id === subCategorySuiteFilter)
    ? 'all'
    : subCategorySuiteFilter;

  const subCategorySuiteFilterLabel = activeSuiteFilter === 'all'
    ? 'All Suites'
    : suites.find(su => su.id === activeSuiteFilter)?.name || 'All Suites';

  const filteredSubCategories = activeSuiteFilter === 'all'
    ? currentSubCategories
    : currentSubCategories.filter(sub => suiteIdsForSubCategory(sub.id).includes(activeSuiteFilter));

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

  const handleDeleteCategory = async (id: string) => {
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

  const handleDeleteSubCategory = async (id: string) => {
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

  const handleDeleteGender = async (id: string) => {
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

  const handleDeleteSuite = async (id: string) => {
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
            <div className="py-12 flex flex-col items-center justify-center text-gray-400 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-[#C68A4C]" />
              <span className="text-sm">Loading genders from backend...</span>
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
                        <Badge variant={gender.isActive !== false ? "active" : "inactive"}>
                          {gender.isActive !== false ? 'Active' : 'Inactive'}
                        </Badge>
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
                            onClick={() => handleDeleteGender(gender.id)}
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
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-gray-400 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-[#C68A4C]" />
              <span className="text-sm">Loading categories from backend...</span>
            </div>
          ) : categories.length === 0 ? (
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
                    {categories.map((category) => (
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
                        <td className="py-4 px-4 sm:px-6 text-center">
                          <Badge variant={category.isActive !== false ? "active" : "inactive"}>
                            {category.isActive !== false ? 'Active' : 'Inactive'}
                          </Badge>
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
                              onClick={() => handleDeleteCategory(category.id)}
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

              {/* Footer Pagination */}
              <div className="px-4 sm:px-6 py-4 bg-white border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                <span>Showing 1 to {categories.length} of {categories.length} categories</span>
                <div className="flex items-center gap-2">
                  <button className="w-8 h-8 rounded-full bg-gray-200 text-gray-400 flex items-center justify-center cursor-not-allowed">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button className="w-8 h-8 rounded-full bg-[#1C1512] text-white flex items-center justify-center shadow-xs hover:bg-black transition-colors">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </Card>
      </div>

      {/* SECTION 1B: SUITES FOR SELECTED CATEGORY (see ServiceSuite in catalog.prisma) */}
      <div className="space-y-4 pt-4 w-full">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl md:text-2xl font-bold text-gray-400 tracking-tight">Suites for</h2>
              <div className="relative inline-block">
                <button
                  onClick={() => setSuiteCategoryDropdownOpen(!suiteCategoryDropdownOpen)}
                  className="flex items-center gap-1.5 text-xl md:text-2xl font-bold text-gray-900 tracking-tight hover:text-[#C68A4C] transition-colors"
                >
                  <span>{selectedCategory?.name || 'Category'}</span>
                  <ChevronDown className="w-4 h-4 text-gray-600" />
                </button>

                {/* Category selector dropdown */}
                {suiteCategoryDropdownOpen && (
                  <div className="absolute top-full left-0 mt-2 w-56 bg-white border border-gray-100 rounded-xl shadow-xl z-20 py-1">
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => {
                          setSelectedCategory(cat);
                          setSuiteCategoryDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-[#FAF5F0] hover:text-[#C68A4C] font-medium"
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
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

        {/* Suites Table Card */}
        <Card className="w-full">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-gray-400 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-[#C68A4C]" />
              <span className="text-sm">Loading suites...</span>
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
                        <Badge variant={suite.isActive !== false ? "active" : "inactive"}>
                          {suite.isActive !== false ? 'Active' : 'Inactive'}
                        </Badge>
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
                            onClick={() => handleDeleteSuite(suite.id)}
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
            <div className="relative inline-block">
              <button 
                onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
                className="flex items-center gap-2 text-2xl md:text-3xl font-bold text-gray-900 tracking-tight hover:text-[#C68A4C] transition-colors"
              >
                <span>{selectedCategory?.name || 'Category'}</span>
                <ChevronDown className="w-5 h-5 text-gray-600" />
              </button>

              {/* Category selector dropdown */}
              {categoryDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 w-56 bg-white border border-gray-100 rounded-xl shadow-xl z-20 py-1">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setSelectedCategory(cat);
                        setCategoryDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-[#FAF5F0] hover:text-[#C68A4C] font-medium"
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <p className="text-xs md:text-sm text-gray-500 mt-0.5">
              Manage {selectedCategory?.name ? selectedCategory.name.toLowerCase() : 'category'} sub-categories
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {/* Suite filter — only worth showing once the active category actually has suites to
                filter by (see currentSuites, computed above for Section 1B). */}
            {currentSuites.length > 0 && (
              <div className="relative inline-block">
                <button
                  onClick={() => setSubCategorySuiteFilterOpen(!subCategorySuiteFilterOpen)}
                  className="flex items-center gap-1.5 px-3 h-10 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:border-[#C68A4C] hover:text-[#C68A4C] transition-colors"
                >
                  <span>Suite: {subCategorySuiteFilterLabel}</span>
                  <ChevronDown className="w-4 h-4" />
                </button>

                {subCategorySuiteFilterOpen && (
                  <div className="absolute top-full right-0 sm:left-0 mt-2 w-56 bg-white border border-gray-100 rounded-xl shadow-xl z-20 py-1 max-h-72 overflow-y-auto">
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
                )}
              </div>
            )}

            <Button
              onClick={() => openCategoryModal('subcategory')}
              className="bg-[#1C1512] hover:bg-black text-white rounded-xl shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add Sub-Category</span>
            </Button>
          </div>
        </div>

        {/* Sub-Categories Table Card */}
        <Card className="w-full">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-gray-400 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-[#C68A4C]" />
              <span className="text-sm">Loading sub-categories...</span>
            </div>
          ) : currentSubCategories.length === 0 ? (
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
              <h3 className="text-base font-semibold text-gray-800">No Sub-Categories in This Suite</h3>
              <p className="text-xs text-gray-500 max-w-sm">
                None of {selectedCategory?.name || 'this category'}&apos;s sub-categories have a service in the &quot;{subCategorySuiteFilterLabel}&quot; suite.
              </p>
              <Button
                onClick={() => setSubCategorySuiteFilter('all')}
                size="sm"
                variant="outline"
                className="mt-2"
              >
                Clear Suite Filter
              </Button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left border-collapse min-w-[500px]">
                  <thead>
                    <tr className="bg-[#FAF5F0] text-gray-700 text-xs font-semibold uppercase tracking-wider border-b border-[#F2E5D9]">
                      <th className="py-4 px-4 sm:px-6">Sub-Categories</th>
                      <th className="py-4 px-4 sm:px-6 text-center">Services</th>
                      <th className="py-4 px-4 sm:px-6 text-center">Suites</th>
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

                        {/* Status Badge */}
                        <td className="py-4 px-4 sm:px-6 text-center">
                          <Badge variant={sub.isActive !== false ? "active" : "inactive"}>
                            {sub.isActive !== false ? 'Active' : 'Inactive'}
                          </Badge>
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
                              onClick={() => handleDeleteSubCategory(sub.id)}
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

              {/* Footer Pagination */}
              <div className="px-4 sm:px-6 py-4 bg-white border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                <span>Showing 1 to {filteredSubCategories.length} of {filteredSubCategories.length} sub-categories</span>
                <div className="flex items-center gap-2">
                  <button className="w-8 h-8 rounded-full bg-gray-200 text-gray-400 flex items-center justify-center cursor-not-allowed">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button className="w-8 h-8 rounded-full bg-[#1C1512] text-white flex items-center justify-center shadow-xs hover:bg-black transition-colors">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
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
