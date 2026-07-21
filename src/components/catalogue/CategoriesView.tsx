'use client';

import React, { useState } from 'react';
import { Plus, Edit3, Trash2, ChevronDown, ChevronLeft, ChevronRight, Loader2, FolderPlus } from 'lucide-react';
import { useCatalogue } from '../../contexts/CatalogueContext';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card } from '../ui/card';
import { toast } from 'react-toastify';

export default function CategoriesView() {
  const { 
    loading,
    categories, 
    subCategories, 
    selectedCategory, 
    setSelectedCategory, 
    openCategoryModal, 
    navigateToServiceDetail,
    deleteCategory,
    deleteSubCategory
  } = useCatalogue();

  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);

  // Filter subcategories by active category
  const currentSubCategories = subCategories.filter(
    s => s.categoryId === selectedCategory?.id
  );

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

  return (
    <div className="space-y-8 md:space-y-10 max-w-7xl mx-auto pb-12 animate-in fade-in duration-300 w-full">
      
      {/* SECTION 1: MAIN CATEGORIES */}
      <div className="space-y-4 w-full">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">Vellora</h1>
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
                                src={category.iconKey || 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=120&q=80'}
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
                          {category.subCategoriesCount || subCategories.filter(s => s.categoryId === category.id).length}
                        </td>

                        {/* Services count */}
                        <td className="py-4 px-4 sm:px-6 text-center font-medium text-gray-600">
                          {category.servicesCount || 0}
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

          <Button
            onClick={() => openCategoryModal('subcategory')}
            className="self-start sm:self-auto bg-[#1C1512] hover:bg-black text-white rounded-xl shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add Sub-Category</span>
          </Button>
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
          ) : (
            <>
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left border-collapse min-w-[500px]">
                  <thead>
                    <tr className="bg-[#FAF5F0] text-gray-700 text-xs font-semibold uppercase tracking-wider border-b border-[#F2E5D9]">
                      <th className="py-4 px-4 sm:px-6">Sub-Categories</th>
                      <th className="py-4 px-4 sm:px-6 text-center">Services</th>
                      <th className="py-4 px-4 sm:px-6 text-center">Status</th>
                      <th className="py-4 px-4 sm:px-6 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                    {currentSubCategories.map((sub) => (
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
                          {sub.servicesCount || 0}
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
                <span>Showing 1 to {currentSubCategories.length} of {currentSubCategories.length} sub-categories</span>
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

    </div>
  );
}
