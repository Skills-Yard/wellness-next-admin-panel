'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Plus, Edit3, Pencil, Trash2, Upload, ChevronDown, Loader2 } from 'lucide-react';
import { useCatalogue } from '../../contexts/CatalogueContext';
import { uploadFileToR2 } from '../../lib/uploadToR2';
import { toast } from 'react-toastify';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import DurationModal from './DurationModal';
import PackModal from './PackModal';
import AddOnModal from './AddOnModal';
import ImageCardModal from './ImageCardModal';
import TextItemModal from './TextItemModal';

export default function ServiceDetailView() {
  const {
    categories,
    subCategories,
    selectedSubCategory,
    serviceItems,
    selectedServiceItem,
    setSelectedServiceItem,
    saveServiceItem,
    deleteServiceItem,
    addDurationToService,
    deleteDurationFromService,
    addPackageToService,
    deletePackageFromService,
  } = useCatalogue();

  // Core Form states
  const [serviceName, setServiceName] = useState('');
  const [slug, setSlug] = useState('');
  const [mainCategory, setMainCategory] = useState('Spa');
  const [subCategoryName, setSubCategoryName] = useState('Skin care scrub');
  const [cardSubtitle, setCardSubtitle] = useState('');
  const [displayOrder, setDisplayOrder] = useState('1');
  const [isMainCard, setIsMainCard] = useState(true);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const reviewFileInputRef = useRef<HTMLInputElement | null>(null);

  // Dynamic Section States connected with Backend
  const [addOns, setAddOns] = useState<any[]>([]);
  const [features, setFeatures] = useState<string[]>([]);
  const [overviewText, setOverviewText] = useState('');
  const [overviewGallery, setOverviewGallery] = useState<any[]>([]);
  const [procedureSteps, setProcedureSteps] = useState<any[]>([]);
  const [itemsUsed, setItemsUsed] = useState<any[]>([]);
  const [skilledPros, setSkilledPros] = useState<string[]>([]);
  const [prePostCare, setPrePostCare] = useState<string[]>([]);
  const [disclaimer, setDisclaimer] = useState<string[]>([]);
  const [whatsIncluded, setWhatsIncluded] = useState<any[]>([]);
  const [faqs, setFaqs] = useState<string[]>([]);
  const [trustedLoved, setTrustedLoved] = useState<string[]>([]);

  // Review Form state
  const [reviewName, setReviewName] = useState('');
  const [reviewContent, setReviewContent] = useState('');
  const [reviewOrder, setReviewOrder] = useState('1');
  const [reviewImage, setReviewImage] = useState<string | null>(null);
  const [reviewUploading, setReviewUploading] = useState(false);
  const [reviewsList, setReviewsList] = useState<any[]>([]);
  const [showReviewForm, setShowReviewForm] = useState(true);
  const [editingReviewIndex, setEditingReviewIndex] = useState<number | null>(null);

  // Modals state
  const [durationModalOpen, setDurationModalOpen] = useState(false);
  const [packModalOpen, setPackModalOpen] = useState(false);
  const [addOnModalOpen, setAddOnModalOpen] = useState(false);

  // Generic Image Card Modal State
  const [imageModalConfig, setImageModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    hasSubtitle: boolean;
    targetSection: 'overview' | 'procedure' | 'items' | 'included';
    editIndex?: number;
    initialData?: { title: string; subtitle?: string; image?: string };
  }>({
    isOpen: false,
    title: '',
    hasSubtitle: false,
    targetSection: 'overview',
  });

  // Generic Text Item Modal State
  const [textModalConfig, setTextModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    placeholder: string;
    targetSection: 'features' | 'pros' | 'care' | 'faqs' | 'trusted' | 'disclaimer';
    editIndex?: number;
    initialValue?: string;
  }>({
    isOpen: false,
    title: '',
    placeholder: '',
    targetSection: 'features',
  });

  // Filter services by active subcategory
  const filteredServices = serviceItems.filter(
    s => s.subCategoryId === selectedSubCategory?.id
  );

  useEffect(() => {
    if (selectedServiceItem) {
      setServiceName(selectedServiceItem.name || '');
      setSlug(selectedServiceItem.slug || '');
      setCardSubtitle(selectedServiceItem.cardSubtitle || '');
      setDisplayOrder(String(selectedServiceItem.displayOrder || 1));
      setIsMainCard(selectedServiceItem.isMainCard !== false);
      setImageUrl(selectedServiceItem.thumbnailKey || null);

      const raw = selectedServiceItem as any;
      setFeatures(Array.isArray(raw.features) ? raw.features : []);
      if (raw.overview) {
        if (typeof raw.overview === 'string') {
          setOverviewText(raw.overview);
        } else {
          setOverviewText(raw.overview.text || '');
          setOverviewGallery(Array.isArray(raw.overview.gallery) ? raw.overview.gallery : []);
        }
      } else {
        setOverviewText('');
        setOverviewGallery([]);
      }
      setProcedureSteps(Array.isArray(raw.procedureSteps) ? raw.procedureSteps : []);
      setItemsUsed(Array.isArray(raw.itemsUsed) ? raw.itemsUsed : []);
      setSkilledPros(Array.isArray(raw.skilledPros) ? raw.skilledPros : []);
      setPrePostCare(Array.isArray(raw.prePostCare) ? raw.prePostCare : []);
      setDisclaimer(Array.isArray(raw.disclaimer) ? raw.disclaimer : []);
      setWhatsIncluded(Array.isArray(raw.whatsIncluded) ? raw.whatsIncluded : []);
      setFaqs(Array.isArray(raw.faqs) ? raw.faqs : []);
      setTrustedLoved(Array.isArray(raw.trustedLoved) ? raw.trustedLoved : []);
      setAddOns(Array.isArray(raw.addOns) ? raw.addOns : []);
      setReviewsList(
        Array.isArray(raw.customReviews)
          ? raw.customReviews
          : Array.isArray(raw.reviews)
          ? raw.reviews
          : []
      );
    }
  }, [selectedServiceItem]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const result = await uploadFileToR2(file, 'services', slug || 'service-item');
      setImageUrl(result.url);
    } catch (err: any) {
      toast.error(`Upload error: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleReviewFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setReviewUploading(true);
    try {
      const result = await uploadFileToR2(file, 'services', 'review-avatar');
      setReviewImage(result.url);
    } catch (err: any) {
      toast.error(`Upload error: ${err.message}`);
    } finally {
      setReviewUploading(false);
    }
  };

  const handleAddReview = async () => {
    if (!reviewName.trim() && !reviewContent.trim()) {
      toast.error('Please enter review name or content');
      return;
    }

    const newReview = {
      id: editingReviewIndex !== null && reviewsList[editingReviewIndex]?.id ? reviewsList[editingReviewIndex].id : `rev-${Date.now()}`,
      name: reviewName.trim() || 'Anonymous Reviewer',
      content: reviewContent.trim() || 'Great service!',
      displayOrder: Number(reviewOrder) || 1,
      image: reviewImage || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    };

    let updatedList: any[];
    if (editingReviewIndex !== null && editingReviewIndex >= 0) {
      updatedList = [...reviewsList];
      updatedList[editingReviewIndex] = newReview;
      setEditingReviewIndex(null);
    } else {
      updatedList = [...reviewsList, newReview];
    }
    setReviewsList(updatedList);
    setReviewName('');
    setReviewContent('');
    setReviewOrder('1');
    setReviewImage(null);
    toast.success('Review saved successfully!');

    // Persist to backend
    if (selectedServiceItem) {
      await saveServiceItem({
        name: serviceName || selectedServiceItem.name,
        reviews: updatedList,
        customReviews: updatedList,
      });
    }
  };

  const handleSave = async (isPublished = true) => {
    if (!serviceName.trim()) {
      toast.error('Please enter a service name');
      return;
    }

    try {
      const payload: any = {
        name: serviceName,
        slug,
        cardTitle: serviceName,
        cardSubtitle,
        displayOrder: Number(displayOrder) || 1,
        isMainCard,
        isPublished,
        thumbnailKey: imageUrl || undefined,
        features,
        overview: { text: overviewText, gallery: overviewGallery },
        procedureSteps,
        itemsUsed,
        skilledPros,
        prePostCare,
        disclaimer,
        whatsIncluded,
        faqs,
        trustedLoved,
        reviews: reviewsList,
        customReviews: reviewsList,
      };

      const res = await saveServiceItem(payload);

      if (res.ok) {
        toast.success(isPublished ? 'Service published to database!' : 'Saved draft to database!');
      } else {
        toast.error(`Failed to save: ${res.message || 'Server error'}`);
      }
    } catch (err: any) {
      toast.error(`Failed to save: ${err.message || 'Error occurred'}`);
    }
  };

  const handleCreateNewService = () => {
    const newService = {
      id: `srv-${Date.now()}`,
      subCategoryId: selectedSubCategory?.id || '',
      name: 'New Service Item',
      slug: `new-service-${Date.now()}`,
      cardTitle: 'New Service Item',
      cardSubtitle: 'Enter subtitle',
      isActive: true,
      isPublished: false,
      displayOrder: filteredServices.length + 1,
      durations: [],
      packages: [],
    };
    setSelectedServiceItem(newService);
    toast.info('Created new service draft!');
  };

  const handleDeleteService = async (id: string) => {
    try {
      const res = await deleteServiceItem(id);
      if (res.ok) {
        toast.success('Service item deleted from database!');
      } else {
        toast.error(`Failed to delete: ${res.message || 'Error occurred'}`);
      }
    } catch (err: any) {
      toast.error(`Failed to delete: ${err.message}`);
    }
  };

  const handleImageCardAdd = async (item: { title: string; subtitle?: string; description?: string; image: string }) => {
    const section = imageModalConfig.targetSection;
    if (section === 'overview') {
      const updated = [...overviewGallery, { id: `ov-${Date.now()}`, title: item.title, image: item.image }];
      setOverviewGallery(updated);
      toast.success('Overview step added!');
      if (selectedServiceItem) {
        await saveServiceItem({ name: serviceName || selectedServiceItem.name, overview: { text: overviewText, gallery: updated } });
      }
    } else if (section === 'procedure') {
      const updated = [...procedureSteps, { id: `pr-${Date.now()}`, title: item.title, description: item.subtitle || '', image: item.image }];
      setProcedureSteps(updated);
      toast.success('Procedure step added!');
      if (selectedServiceItem) {
        await saveServiceItem({ name: serviceName || selectedServiceItem.name, procedureSteps: updated });
      }
    } else if (section === 'items') {
      const updated = [...itemsUsed, { id: `iu-${Date.now()}`, title: item.title, image: item.image }];
      setItemsUsed(updated);
      toast.success('Item added!');
      if (selectedServiceItem) {
        await saveServiceItem({ name: serviceName || selectedServiceItem.name, itemsUsed: updated });
      }
    } else if (section === 'included') {
      const updated = [...whatsIncluded, { id: `inc-${Date.now()}`, title: item.title, subtitle: item.subtitle || '', image: item.image }];
      setWhatsIncluded(updated);
      toast.success('Included item added!');
      if (selectedServiceItem) {
        await saveServiceItem({ name: serviceName || selectedServiceItem.name, whatsIncluded: updated });
      }
    }
  };

  const handleTextItemAdd = async (text: string) => {
    const section = textModalConfig.targetSection;
    const editIdx = textModalConfig.editIndex;

    if (section === 'features') {
      let updated: string[];
      if (editIdx !== undefined && editIdx >= 0) {
        updated = [...features];
        updated[editIdx] = text;
      } else {
        updated = [...features, text];
      }
      setFeatures(updated);
      toast.success(editIdx !== undefined ? 'Feature updated!' : 'Feature added!');
      if (selectedServiceItem) {
        await saveServiceItem({ name: serviceName || selectedServiceItem.name, features: updated });
      }
    } else if (section === 'pros') {
      let updated: string[];
      if (editIdx !== undefined && editIdx >= 0) {
        updated = [...skilledPros];
        updated[editIdx] = text;
      } else {
        updated = [...skilledPros, text];
      }
      setSkilledPros(updated);
      toast.success(editIdx !== undefined ? 'Skilled professional highlight updated!' : 'Skilled professional highlight added!');
      if (selectedServiceItem) {
        await saveServiceItem({ name: serviceName || selectedServiceItem.name, skilledPros: updated });
      }
    } else if (section === 'care') {
      let updated: string[];
      if (editIdx !== undefined && editIdx >= 0) {
        updated = [...prePostCare];
        updated[editIdx] = text;
      } else {
        updated = [...prePostCare, text];
      }
      setPrePostCare(updated);
      toast.success(editIdx !== undefined ? 'Pre & Post care instruction updated!' : 'Pre & Post care instruction added!');
      if (selectedServiceItem) {
        await saveServiceItem({ name: serviceName || selectedServiceItem.name, prePostCare: updated });
      }
    } else if (section === 'disclaimer') {
      let updated: string[];
      if (editIdx !== undefined && editIdx >= 0) {
        updated = [...disclaimer];
        updated[editIdx] = text;
      } else {
        updated = [...disclaimer, text];
      }
      setDisclaimer(updated);
      toast.success(editIdx !== undefined ? 'Disclaimer instruction updated!' : 'Disclaimer instruction added!');
      if (selectedServiceItem) {
        await saveServiceItem({ name: serviceName || selectedServiceItem.name, disclaimer: updated });
      }
    } else if (section === 'faqs') {
      let updated: string[];
      if (editIdx !== undefined && editIdx >= 0) {
        updated = [...faqs];
        updated[editIdx] = text;
      } else {
        updated = [...faqs, text];
      }
      setFaqs(updated);
      toast.success(editIdx !== undefined ? 'FAQ question updated!' : 'FAQ question added!');
      if (selectedServiceItem) {
        await saveServiceItem({ name: serviceName || selectedServiceItem.name, faqs: updated });
      }
    } else if (section === 'trusted') {
      let updated: string[];
      if (editIdx !== undefined && editIdx >= 0) {
        updated = [...trustedLoved];
        updated[editIdx] = text;
      } else {
        updated = [...trustedLoved, text];
      }
      setTrustedLoved(updated);
      toast.success(editIdx !== undefined ? 'Highlight point updated!' : 'Highlight point added!');
      if (selectedServiceItem) {
        await saveServiceItem({ name: serviceName || selectedServiceItem.name, trustedLoved: updated });
      }
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-in fade-in duration-300 w-full">

      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*,video/*"
        className="hidden"
        onChange={handleFileChange}
      />

      <input
        type="file"
        ref={reviewFileInputRef}
        accept="image/*"
        className="hidden"
        onChange={handleReviewFileChange}
      />

      {/* Title Bar */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
          {selectedSubCategory?.name || 'Service Details'}
        </h1>
      </div>

      {/* Main 2-Column Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 items-start w-full">

        {/* LEFT COLUMN: SERVICES LIST TABLE */}
        <div className="lg:col-span-4 space-y-4 w-full">
          <Card className="w-full">

            {/* Header with '+' Button */}
            <div className="bg-[#FAF5F0] px-4 sm:px-6 py-4 border-b border-[#F2E5D9] flex items-center justify-between">
              <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Services</span>
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Action</span>
                <Button
                  size="icon"
                  onClick={handleCreateNewService}
                  className="w-7 h-7 bg-[#1C1512] text-white hover:bg-black"
                  title="Add Service"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* List Rows */}
            <div className="divide-y divide-gray-100">
              {filteredServices.length === 0 ? (
                <div className="p-6 text-center text-xs text-gray-400">
                  No services created in database yet. Click "+" above to add one.
                </div>
              ) : (
                filteredServices.map((service, index) => {
                  const isSelected = selectedServiceItem?.id === service.id;
                  return (
                    <div
                      key={service.id}
                      onClick={() => setSelectedServiceItem(service)}
                      className={`px-4 sm:px-6 py-4 flex items-center justify-between transition-colors cursor-pointer ${isSelected ? 'bg-[#FAF5F0]/60 font-semibold' : 'hover:bg-gray-50'
                        }`}
                    >
                      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                        <span className="text-xs font-bold text-gray-400 w-4">{index + 1}</span>
                        <span className="text-sm font-medium text-gray-900 truncate">
                          {service.name}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setSelectedServiceItem(service)}
                          className="w-7 h-7"
                          title="Edit Service"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => handleDeleteService(service.id)}
                          className="w-7 h-7 bg-red-50 text-red-500 hover:bg-red-100 border-none"
                          title="Delete Service"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

          </Card>
        </div>

        {/* RIGHT COLUMN: EDIT SERVICE FORM & ALL SECTIONS */}
        <Card className="lg:col-span-8 p-4 sm:p-6 md:p-8 space-y-8 md:space-y-10 w-full">

          {/* Top Form Header & Save Buttons */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5">
            <h2 className="text-xl font-bold text-gray-900">Edit Service</h2>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => handleSave(false)}
              >
                Save as Draft
              </Button>
              <Button
                onClick={() => handleSave(true)}
                className="bg-[#221812] text-white hover:bg-black"
              >
                Publish
              </Button>
            </div>
          </div>

          {/* Service Name, Slug, Upload & Toggle Row */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">

            {/* Upload Box */}
            <div className="md:col-span-4">
              <div
                className="h-40 bg-[#FAF5F0] rounded-2xl border border-[#F2E5D9] flex flex-col items-center justify-center text-center p-4 cursor-pointer hover:border-[#D4A373] transition-colors relative overflow-hidden group"
                onClick={() => fileInputRef.current?.click()}
              >
                {uploading ? (
                  <div className="flex flex-col items-center justify-center text-[#D4A373] gap-2">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span className="text-xs font-semibold">Uploading to R2...</span>
                  </div>
                ) : imageUrl ? (
                  <div className="w-full h-full relative flex items-center justify-center">
                    <img src={imageUrl} alt="Service Preview" className="max-h-32 object-contain" />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-xl">
                      <span className="text-xs text-white bg-black/60 px-3 py-1.5 rounded-md">Change Image</span>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#D4A373] mb-2 shadow-xs">
                      <Upload className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-semibold text-gray-800 mb-0.5">Upload Image</span>
                    <span className="text-[11px] text-gray-400">PNG, JPG up to 2MB</span>
                  </>
                )}
              </div>
            </div>

            {/* Inputs: Service Name, Slug + Main Card toggle */}
            <div className="md:col-span-8 space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-700 mb-1.5 block">
                  Service Name<span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter service name"
                  value={serviceName}
                  onChange={(e) => setServiceName(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C68A4C]/30 focus:border-[#C68A4C]"
                />
              </div>

              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="text-xs font-semibold text-gray-700 mb-1.5 block">
                    Slug<span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter slug"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C68A4C]/30 focus:border-[#C68A4C]"
                  />
                </div>

                {/* Main Card Toggle */}
                <div className="flex flex-col items-center justify-center pt-5">
                  <span className="text-xs font-semibold text-gray-700 mb-1">Main Card</span>
                  <button
                    type="button"
                    onClick={() => setIsMainCard(!isMainCard)}
                    className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out ${isMainCard ? 'bg-[#9C8271]' : 'bg-gray-300'
                      }`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform duration-200 ease-in-out ${isMainCard ? 'translate-x-6' : 'translate-x-0'
                      }`} />
                  </button>
                </div>
              </div>
            </div>

          </div>

          {/* Main Category & Sub Category Dropdowns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-xs font-semibold text-gray-700 mb-1.5 block">
                Main Category<span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={mainCategory}
                  onChange={(e) => setMainCategory(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-[#C68A4C]/30 focus:border-[#C68A4C] bg-white cursor-pointer"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 mb-1.5 block">
                Sub Category<span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={subCategoryName}
                  onChange={(e) => setSubCategoryName(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-[#C68A4C]/30 focus:border-[#C68A4C] bg-white cursor-pointer"
                >
                  {subCategories.map((sub) => (
                    <option key={sub.id} value={sub.name}>{sub.name}</option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Card Subtitle & Display Order */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-xs font-semibold text-gray-700 mb-1.5 block">Card Subtitle</label>
              <input
                type="text"
                placeholder="Enter subtitle"
                value={cardSubtitle}
                onChange={(e) => setCardSubtitle(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C68A4C]/30 focus:border-[#C68A4C]"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 mb-1.5 block">Display Order</label>
              <input
                type="number"
                placeholder="1"
                value={displayOrder}
                onChange={(e) => setDisplayOrder(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C68A4C]/30 focus:border-[#C68A4C]"
              />
            </div>
          </div>

          {/* SECTION 1: Select Duration (timeslots) */}
          <div className="space-y-3 pt-2 w-full">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900">Select Duration (timeslots)</h3>
              <Button
                size="sm"
                onClick={() => setDurationModalOpen(true)}
                className="bg-[#1C1512] text-white hover:bg-black h-8 px-3"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </Button>
            </div>

            <div className="border border-gray-100 rounded-2xl overflow-x-auto w-full">
              <table className="w-full text-left border-collapse min-w-[400px]">
                <thead>
                  <tr className="bg-[#FAF5F0] text-gray-700 text-xs font-semibold uppercase tracking-wider border-b border-[#F2E5D9]">
                    <th className="py-3 px-4 sm:px-6">Duration</th>
                    <th className="py-3 px-4 sm:px-6 text-center">Price (₹)</th>
                    <th className="py-3 px-4 sm:px-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                  {selectedServiceItem?.durations && selectedServiceItem.durations.length > 0 ? (
                    selectedServiceItem.durations.map((dur) => (
                      <tr key={dur.id} className="hover:bg-gray-50/50">
                        <td className="py-3 px-4 sm:px-6 font-medium">{dur.label}</td>
                        <td className="py-3 px-4 sm:px-6 text-center font-semibold text-gray-900">
                          {dur.price.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 sm:px-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="outline" size="icon" className="w-7 h-7">
                              <Edit3 className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="icon"
                              onClick={() => {
                                deleteDurationFromService(selectedServiceItem.id, dur.id);
                                toast.info('Timeslot removed');
                              }}
                              className="w-7 h-7 bg-red-50 text-red-500 hover:bg-red-100 border-none"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="py-6 text-center text-xs text-gray-400">
                        No duration timeslots added yet. Click "+ Add" to add one.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* SECTION 2: Select a pack */}
          <div className="space-y-3 pt-2 w-full">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900">Select a pack</h3>
              <Button
                size="sm"
                onClick={() => setPackModalOpen(true)}
                className="bg-[#1C1512] text-white hover:bg-black h-8 px-3"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </Button>
            </div>

            <div className="border border-gray-100 rounded-2xl overflow-x-auto w-full">
              <table className="w-full text-left border-collapse min-w-[500px]">
                <thead>
                  <tr className="bg-[#FAF5F0] text-gray-700 text-xs font-semibold uppercase tracking-wider border-b border-[#F2E5D9]">
                    <th className="py-3 px-4 sm:px-6">Session</th>
                    <th className="py-3 px-4 sm:px-6 text-center">Price (₹)</th>
                    <th className="py-3 px-4 sm:px-6 text-center">Original Price</th>
                    <th className="py-3 px-4 sm:px-6 text-center">Savings</th>
                    <th className="py-3 px-4 sm:px-6 text-center">Savings (%)</th>
                    <th className="py-3 px-4 sm:px-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                  {selectedServiceItem?.packages && selectedServiceItem.packages.length > 0 ? (
                    selectedServiceItem.packages.map((pkg) => (
                      <tr key={pkg.id} className="hover:bg-[#FAF9F6]/50">
                        <td className="py-3 px-4 sm:px-6 font-semibold text-gray-900">{pkg.sessions}</td>
                        <td className="py-3 px-4 sm:px-6 text-center font-semibold text-gray-900">
                          {pkg.price.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 sm:px-6 text-center text-gray-500">
                          {pkg.originalPrice ? pkg.originalPrice.toLocaleString() : '-'}
                        </td>
                        <td className="py-3 px-4 sm:px-6 text-center text-gray-500">
                          {pkg.savings ? pkg.savings.toLocaleString() : '-'}
                        </td>
                        <td className="py-3 px-4 sm:px-6 text-center text-gray-500 font-medium">
                          {pkg.savingsPercent ? `${pkg.savingsPercent}%` : '-'}
                        </td>
                        <td className="py-3 px-4 sm:px-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="outline" size="icon" className="w-7 h-7">
                              <Edit3 className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="icon"
                              onClick={() => {
                                deletePackageFromService(selectedServiceItem.id, pkg.id);
                                toast.info('Pack removed');
                              }}
                              className="w-7 h-7 bg-red-50 text-red-500 hover:bg-red-100 border-none"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-xs text-gray-400">
                        No session packs added yet. Click "+ Add" to add one.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* SECTION 3: Add-ons Table */}
          <div className="space-y-3 pt-4 border-t border-gray-100 w-full">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900">Add-ons</h3>
              <Button
                size="sm"
                onClick={() => setAddOnModalOpen(true)}
                className="bg-[#1C1512] text-white hover:bg-black h-8 px-3"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </Button>
            </div>

            <div className="border border-gray-100 rounded-2xl overflow-x-auto w-full">
              <table className="w-full text-left border-collapse min-w-[400px]">
                <thead>
                  <tr className="bg-[#FAF5F0] text-gray-700 text-xs font-semibold uppercase tracking-wider border-b border-[#F2E5D9]">
                    <th className="py-3 px-4 sm:px-6">Add-ons</th>
                    <th className="py-3 px-4 sm:px-6 text-center">Price (₹)</th>
                    <th className="py-3 px-4 sm:px-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                  {addOns.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="py-6 text-center text-xs text-gray-400">
                        No add-ons created yet. Click "+ Add" to create one.
                      </td>
                    </tr>
                  ) : (
                    addOns.map((addon, i) => (
                      <tr key={addon.id || i} className="hover:bg-gray-50/50">
                        <td className="py-3.5 px-4 sm:px-6 font-semibold text-gray-900">{addon.name}</td>
                        <td className="py-3.5 px-4 sm:px-6 text-center font-bold text-gray-900">{addon.price}</td>
                        <td className="py-3.5 px-4 sm:px-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="outline" size="icon" className="w-7 h-7">
                              <Edit3 className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="icon"
                              onClick={() => {
                                setAddOns(prev => prev.filter((_, idx) => idx !== i));
                                toast.info('Add-on removed');
                              }}
                              className="w-7 h-7 bg-red-50 text-red-500 hover:bg-red-100 border-none"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* SECTION 4: Features */}
          <div className="space-y-3 pt-4 border-t border-gray-100 w-full">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900">Features</h3>
              <Button
                size="sm"
                onClick={() => setTextModalConfig({ isOpen: true, title: 'Add Feature', placeholder: 'Enter feature content...', targetSection: 'features' })}
                className="bg-[#1C1512] text-white hover:bg-black h-8 px-3"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </Button>
            </div>

            <div className="space-y-3">
              {features.length === 0 ? (
                <div className="p-4 border border-dashed border-gray-200 rounded-xl text-center text-xs text-gray-400">
                  No features added yet. Click "+ Add" to add a feature.
                </div>
              ) : (
                features.map((feat, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={feat}
                      onChange={(e) => {
                        const updated = [...features];
                        updated[index] = e.target.value;
                        setFeatures(updated);
                      }}
                      onBlur={async () => {
                        if (selectedServiceItem) {
                          await saveServiceItem({ name: serviceName || selectedServiceItem.name, features });
                        }
                      }}
                      className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C68A4C]/30 focus:border-[#C68A4C] bg-white text-gray-900"
                    />
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => setTextModalConfig({ isOpen: true, title: 'Edit Feature', placeholder: 'Enter feature content...', targetSection: 'features', editIndex: index, initialValue: feat })}
                        className="w-8 h-8 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 flex items-center justify-center text-gray-400 hover:text-gray-900 transition-colors shadow-2xs cursor-pointer"
                        title="Edit"
                      >
                        <Pencil className="w-3.5 h-3.5 text-gray-500" />
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          const updated = features.filter((_, i) => i !== index);
                          setFeatures(updated);
                          toast.info('Feature removed');
                          if (selectedServiceItem) {
                            await saveServiceItem({ name: serviceName || selectedServiceItem.name, features: updated });
                          }
                        }}
                        className="w-8 h-8 rounded-lg border border-red-100 bg-white hover:bg-red-50 flex items-center justify-center text-red-400 transition-colors shadow-2xs cursor-pointer"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* SECTION 5: Overview Text & Overview Image Gallery */}
          <div className="space-y-4 pt-4 border-t border-gray-100 w-full">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900">Overview</h3>
              <Button
                size="sm"
                onClick={() => setImageModalConfig({ isOpen: true, title: 'Add Overview Step Item', hasSubtitle: false, targetSection: 'overview' })}
                className="bg-[#1C1512] text-white hover:bg-black h-8 px-3"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </Button>
            </div>

            {/* Main Overview Text Box */}
            <div className="flex items-start gap-3">
              <textarea
                rows={3}
                placeholder="Enter overview description..."
                value={overviewText}
                onChange={(e) => setOverviewText(e.target.value)}
                onBlur={async () => {
                  if (selectedServiceItem) {
                    await saveServiceItem({ name: serviceName || selectedServiceItem.name, overview: { text: overviewText, gallery: overviewGallery } });
                  }
                }}
                className="flex-1 p-4 border border-gray-200 rounded-2xl bg-white text-sm text-gray-700 leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#C68A4C]/30 focus:border-[#C68A4C]"
              />
              <div className="flex items-center gap-1.5 flex-shrink-0 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    const textarea = document.querySelector('textarea[placeholder="Enter overview description..."]') as HTMLTextAreaElement;
                    textarea?.focus();
                  }}
                  className="w-8 h-8 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 flex items-center justify-center text-gray-400 hover:text-gray-900 transition-colors shadow-2xs cursor-pointer"
                  title="Edit Overview Text"
                >
                  <Pencil className="w-3.5 h-3.5 text-gray-500" />
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    setOverviewText('');
                    toast.info('Overview text cleared');
                    if (selectedServiceItem) {
                      await saveServiceItem({ name: serviceName || selectedServiceItem.name, overview: { text: '', gallery: overviewGallery } });
                    }
                  }}
                  className="w-8 h-8 rounded-lg border border-red-100 bg-white hover:bg-red-50 flex items-center justify-center text-red-400 transition-colors shadow-2xs cursor-pointer"
                  title="Clear Overview Text"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-400" />
                </button>
              </div>
            </div>

            {/* Overview Steps Image Cards Grid */}
            {overviewGallery.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                {overviewGallery.map((item, idx) => (
                  <div key={item.id || idx} className="space-y-2 group p-2 rounded-2xl border border-gray-100 bg-white shadow-2xs">
                    <div className="h-32 rounded-xl overflow-hidden bg-gray-50 flex items-center justify-center p-1 border border-gray-100">
                      <img src={item.image} alt={item.title} className="w-full h-full object-cover rounded-lg" />
                    </div>
                    <div className="font-semibold text-xs text-gray-900 tracking-tight line-clamp-1">{item.title}</div>
                    <div className="flex items-center justify-end gap-1.5 pt-0.5">
                      <button
                        type="button"
                        onClick={() => setImageModalConfig({ isOpen: true, title: 'Edit Overview Step', hasSubtitle: false, targetSection: 'overview', editIndex: idx, initialData: { title: item.title, image: item.image } })}
                        className="w-8 h-8 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 flex items-center justify-center text-gray-400 hover:text-gray-900 transition-colors shadow-2xs cursor-pointer"
                        title="Edit"
                      >
                        <Pencil className="w-3.5 h-3.5 text-gray-500" />
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          const updated = overviewGallery.filter((_, i) => i !== idx);
                          setOverviewGallery(updated);
                          toast.info('Item removed');
                          if (selectedServiceItem) {
                            await saveServiceItem({ name: serviceName || selectedServiceItem.name, overview: { text: overviewText, gallery: updated } });
                          }
                        }}
                        className="w-8 h-8 rounded-lg border border-red-100 bg-white hover:bg-red-50 flex items-center justify-center text-red-400 transition-colors shadow-2xs cursor-pointer"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SECTION 6: Procedure */}
          <div className="space-y-4 pt-4 border-t border-gray-100 w-full">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900">Procedure</h3>
              <Button
                size="sm"
                onClick={() => setImageModalConfig({ isOpen: true, title: 'Add Procedure Step', hasSubtitle: true, targetSection: 'procedure' })}
                className="bg-[#1C1512] text-white hover:bg-black h-8 px-3"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </Button>
            </div>

            {procedureSteps.length === 0 ? (
              <div className="p-4 border border-dashed border-gray-200 rounded-xl text-center text-xs text-gray-400">
                No procedure steps added yet.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {procedureSteps.map((step, idx) => (
                  <div key={step.id || idx} className="space-y-2 p-2 rounded-2xl border border-gray-100 bg-white shadow-2xs">
                    <div className="h-32 rounded-xl border border-gray-100 overflow-hidden bg-gray-50 flex items-center justify-center p-1">
                      <img src={step.image} alt={step.title} className="w-full h-full object-cover rounded-lg" />
                    </div>
                    <div className="font-semibold text-xs text-gray-900">{step.title}</div>
                    <div className="text-[11px] text-gray-500 line-clamp-2">{step.description}</div>
                    <div className="flex items-center justify-end gap-1.5 pt-0.5">
                      <button
                        type="button"
                        onClick={() => setImageModalConfig({ isOpen: true, title: 'Edit Procedure Step', hasSubtitle: true, targetSection: 'procedure', editIndex: idx, initialData: { title: step.title, subtitle: step.description, image: step.image } })}
                        className="w-8 h-8 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 flex items-center justify-center text-gray-400 hover:text-gray-900 transition-colors shadow-2xs cursor-pointer"
                        title="Edit"
                      >
                        <Pencil className="w-3.5 h-3.5 text-gray-500" />
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          const updated = procedureSteps.filter((_, i) => i !== idx);
                          setProcedureSteps(updated);
                          toast.info('Procedure step removed');
                          if (selectedServiceItem) {
                            await saveServiceItem({ name: serviceName || selectedServiceItem.name, procedureSteps: updated });
                          }
                        }}
                        className="w-8 h-8 rounded-lg border border-red-100 bg-white hover:bg-red-50 flex items-center justify-center text-red-400 transition-colors shadow-2xs cursor-pointer"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SECTION: Disclaimer */}
          <div className="space-y-3 pt-4 border-t border-gray-100 w-full">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900">Disclaimer</h3>
              <Button
                size="sm"
                onClick={() => setTextModalConfig({ isOpen: true, title: 'Add Disclaimer Instruction', placeholder: 'Enter disclaimer point...', targetSection: 'disclaimer' })}
                className="bg-[#1C1512] text-white hover:bg-black h-8 px-3"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </Button>
            </div>

            <div className="space-y-3">
              {disclaimer.length === 0 ? (
                <div className="p-4 border border-dashed border-gray-200 rounded-xl text-center text-xs text-gray-400">
                  No disclaimer instructions added yet. Click "+ Add" to add one.
                </div>
              ) : (
                disclaimer.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => {
                        const updated = [...disclaimer];
                        updated[index] = e.target.value;
                        setDisclaimer(updated);
                      }}
                      onBlur={async () => {
                        if (selectedServiceItem) {
                          await saveServiceItem({ name: serviceName || selectedServiceItem.name, disclaimer });
                        }
                      }}
                      className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C68A4C]/30 focus:border-[#C68A4C] bg-white text-gray-900"
                    />
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => setTextModalConfig({ isOpen: true, title: 'Edit Disclaimer Point', placeholder: 'Enter disclaimer point...', targetSection: 'disclaimer', editIndex: index, initialValue: item })}
                        className="w-8 h-8 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 flex items-center justify-center text-gray-400 hover:text-gray-900 transition-colors shadow-2xs cursor-pointer"
                        title="Edit"
                      >
                        <Pencil className="w-3.5 h-3.5 text-gray-500" />
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          const updated = disclaimer.filter((_, i) => i !== index);
                          setDisclaimer(updated);
                          toast.info('Disclaimer point removed');
                          if (selectedServiceItem) {
                            await saveServiceItem({ name: serviceName || selectedServiceItem.name, disclaimer: updated });
                          }
                        }}
                        className="w-8 h-8 rounded-lg border border-red-100 bg-white hover:bg-red-50 flex items-center justify-center text-red-400 transition-colors shadow-2xs cursor-pointer"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* SECTION 7: Item Used */}
          <div className="space-y-4 pt-4 border-t border-gray-100 w-full">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900">Item Used</h3>
              <Button
                size="sm"
                onClick={() => setImageModalConfig({ isOpen: true, title: 'Add Item Used', hasSubtitle: false, targetSection: 'items' })}
                className="bg-[#1C1512] text-white hover:bg-black h-8 px-3"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item</span>
              </Button>
            </div>

            {itemsUsed.length === 0 ? (
              <div className="p-4 border border-dashed border-gray-200 rounded-xl text-center text-xs text-gray-400">
                No items added yet. Click "+ Add Item" to add one.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                {itemsUsed.map((item, idx) => (
                  <div key={item.id || idx} className="space-y-2 p-2 rounded-2xl border border-gray-100 bg-white shadow-2xs flex flex-col items-center">
                    <div className="h-28 w-full rounded-xl bg-[#FAF5F0] border border-[#F2E5D9] flex items-center justify-center p-2 overflow-hidden">
                      <img src={item.image} alt={item.title} className="max-h-20 object-contain" />
                    </div>
                    <div className="font-semibold text-xs text-gray-800 text-center">{item.title}</div>
                    <div className="flex items-center justify-center gap-1.5 pt-0.5">
                      <button
                        type="button"
                        onClick={() => setImageModalConfig({ isOpen: true, title: 'Edit Item Used', hasSubtitle: false, targetSection: 'items', editIndex: idx, initialData: { title: item.title, image: item.image } })}
                        className="w-8 h-8 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 flex items-center justify-center text-gray-400 hover:text-gray-900 transition-colors shadow-2xs cursor-pointer"
                        title="Edit"
                      >
                        <Pencil className="w-3.5 h-3.5 text-gray-500" />
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          const updated = itemsUsed.filter((_, i) => i !== idx);
                          setItemsUsed(updated);
                          toast.info('Item removed');
                          if (selectedServiceItem) {
                            await saveServiceItem({ name: serviceName || selectedServiceItem.name, itemsUsed: updated });
                          }
                        }}
                        className="w-8 h-8 rounded-lg border border-red-100 bg-white hover:bg-red-50 flex items-center justify-center text-red-400 transition-colors shadow-2xs cursor-pointer"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SECTION 8: Our Skilled Professionals */}
          <div className="space-y-3 pt-4 border-t border-gray-100 w-full">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900">Our Skilled Professionals</h3>
              <Button
                size="sm"
                onClick={() => setTextModalConfig({ isOpen: true, title: 'Add Professional Highlight', placeholder: 'Enter professional highlight...', targetSection: 'pros' })}
                className="bg-[#1C1512] text-white hover:bg-black h-8 px-3"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </Button>
            </div>

            <div className="space-y-3">
              {skilledPros.length === 0 ? (
                <div className="p-4 border border-dashed border-gray-200 rounded-xl text-center text-xs text-gray-400">
                  No professional highlights added yet.
                </div>
              ) : (
                skilledPros.map((pro, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={pro}
                      onChange={(e) => {
                        const updated = [...skilledPros];
                        updated[index] = e.target.value;
                        setSkilledPros(updated);
                      }}
                      onBlur={async () => {
                        if (selectedServiceItem) {
                          await saveServiceItem({ name: serviceName || selectedServiceItem.name, skilledPros });
                        }
                      }}
                      className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C68A4C]/30 focus:border-[#C68A4C] bg-white text-gray-900"
                    />
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => setTextModalConfig({ isOpen: true, title: 'Edit Professional Highlight', placeholder: 'Enter professional highlight...', targetSection: 'pros', editIndex: index, initialValue: pro })}
                        className="w-8 h-8 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 flex items-center justify-center text-gray-400 hover:text-gray-900 transition-colors shadow-2xs cursor-pointer"
                        title="Edit"
                      >
                        <Pencil className="w-3.5 h-3.5 text-gray-500" />
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          const updated = skilledPros.filter((_, i) => i !== index);
                          setSkilledPros(updated);
                          toast.info('Item removed');
                          if (selectedServiceItem) {
                            await saveServiceItem({ name: serviceName || selectedServiceItem.name, skilledPros: updated });
                          }
                        }}
                        className="w-8 h-8 rounded-lg border border-red-100 bg-white hover:bg-red-50 flex items-center justify-center text-red-400 transition-colors shadow-2xs cursor-pointer"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* SECTION 9: Pre & Post Care */}
          <div className="space-y-3 pt-4 border-t border-gray-100 w-full">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900">Pre & Post Care</h3>
              <Button
                size="sm"
                onClick={() => setTextModalConfig({ isOpen: true, title: 'Add Pre & Post Care Instruction', placeholder: 'Enter care instruction...', targetSection: 'care' })}
                className="bg-[#1C1512] text-white hover:bg-black h-8 px-3"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </Button>
            </div>

            <div className="space-y-3">
              {prePostCare.length === 0 ? (
                <div className="p-4 border border-dashed border-gray-200 rounded-xl text-center text-xs text-gray-400">
                  No care instructions added yet.
                </div>
              ) : (
                prePostCare.map((care, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={care}
                      onChange={(e) => {
                        const updated = [...prePostCare];
                        updated[index] = e.target.value;
                        setPrePostCare(updated);
                      }}
                      onBlur={async () => {
                        if (selectedServiceItem) {
                          await saveServiceItem({ name: serviceName || selectedServiceItem.name, prePostCare });
                        }
                      }}
                      className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C68A4C]/30 focus:border-[#C68A4C] bg-white text-gray-900"
                    />
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => setTextModalConfig({ isOpen: true, title: 'Edit Care Instruction', placeholder: 'Enter care instruction...', targetSection: 'care', editIndex: index, initialValue: care })}
                        className="w-8 h-8 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 flex items-center justify-center text-gray-400 hover:text-gray-900 transition-colors shadow-2xs cursor-pointer"
                        title="Edit"
                      >
                        <Pencil className="w-3.5 h-3.5 text-gray-500" />
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          const updated = prePostCare.filter((_, i) => i !== index);
                          setPrePostCare(updated);
                          toast.info('Instruction removed');
                          if (selectedServiceItem) {
                            await saveServiceItem({ name: serviceName || selectedServiceItem.name, prePostCare: updated });
                          }
                        }}
                        className="w-8 h-8 rounded-lg border border-red-100 bg-white hover:bg-red-50 flex items-center justify-center text-red-400 transition-colors shadow-2xs cursor-pointer"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* SECTION 10: What's Included */}
          <div className="space-y-4 pt-4 border-t border-gray-100 w-full">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900">What's Included</h3>
              <Button
                size="sm"
                onClick={() => setImageModalConfig({ isOpen: true, title: "Add What's Included Product", hasSubtitle: true, targetSection: 'included' })}
                className="bg-[#1C1512] text-white hover:bg-black h-8 px-3"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </Button>
            </div>

            {whatsIncluded.length === 0 ? (
              <div className="p-4 border border-dashed border-gray-200 rounded-xl text-center text-xs text-gray-400">
                No items added yet. Click "+ Add" to add one.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {whatsIncluded.map((inc, idx) => (
                  <div key={inc.id || idx} className="space-y-2 p-3 border border-gray-100 rounded-2xl bg-white shadow-2xs flex flex-col justify-between">
                    <div className="space-y-1.5">
                      <div className="font-semibold text-xs text-gray-900">{inc.title}</div>
                      <div className="h-36 bg-[#FAF5F0] rounded-xl flex items-center justify-center p-2 overflow-hidden border border-[#F2E5D9]">
                        <img src={inc.image} alt={inc.title} className="max-h-28 object-contain" />
                      </div>
                      <div className="text-[11px] text-gray-500 leading-snug">{inc.subtitle}</div>
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setImageModalConfig({ isOpen: true, title: "Edit What's Included Product", hasSubtitle: true, targetSection: 'included', editIndex: idx, initialData: { title: inc.title, subtitle: inc.subtitle, image: inc.image } })}
                        className="w-8 h-8 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 flex items-center justify-center text-gray-400 hover:text-gray-900 transition-colors shadow-2xs cursor-pointer"
                        title="Edit"
                      >
                        <Pencil className="w-3.5 h-3.5 text-gray-500" />
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          const updated = whatsIncluded.filter((_, i) => i !== idx);
                          setWhatsIncluded(updated);
                          toast.info('Item removed');
                          if (selectedServiceItem) {
                            await saveServiceItem({ name: serviceName || selectedServiceItem.name, whatsIncluded: updated });
                          }
                        }}
                        className="w-8 h-8 rounded-lg border border-red-100 bg-white hover:bg-red-50 flex items-center justify-center text-red-400 transition-colors shadow-2xs cursor-pointer"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SECTION 11: FAQs */}
          <div className="space-y-3 pt-4 border-t border-gray-100 w-full">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900">FAQs</h3>
              <Button
                size="sm"
                onClick={() => setTextModalConfig({ isOpen: true, title: 'Add FAQ Question', placeholder: 'Enter FAQ question...', targetSection: 'faqs' })}
                className="bg-[#1C1512] text-white hover:bg-black h-8 px-3"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </Button>
            </div>

            <div className="space-y-3">
              {faqs.length === 0 ? (
                <div className="p-4 border border-dashed border-gray-200 rounded-xl text-center text-xs text-gray-400">
                  No FAQs added yet.
                </div>
              ) : (
                faqs.map((faq, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={faq}
                      onChange={(e) => {
                        const updated = [...faqs];
                        updated[index] = e.target.value;
                        setFaqs(updated);
                      }}
                      onBlur={async () => {
                        if (selectedServiceItem) {
                          await saveServiceItem({ name: serviceName || selectedServiceItem.name, faqs });
                        }
                      }}
                      className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C68A4C]/30 focus:border-[#C68A4C] bg-white text-gray-900"
                    />
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => setTextModalConfig({ isOpen: true, title: 'Edit FAQ Question', placeholder: 'Enter FAQ question...', targetSection: 'faqs', editIndex: index, initialValue: faq })}
                        className="w-8 h-8 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 flex items-center justify-center text-gray-400 hover:text-gray-900 transition-colors shadow-2xs cursor-pointer"
                        title="Edit"
                      >
                        <Pencil className="w-3.5 h-3.5 text-gray-500" />
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          const updated = faqs.filter((_, i) => i !== index);
                          setFaqs(updated);
                          toast.info('FAQ removed');
                          if (selectedServiceItem) {
                            await saveServiceItem({ name: serviceName || selectedServiceItem.name, faqs: updated });
                          }
                        }}
                        className="w-8 h-8 rounded-lg border border-red-100 bg-white hover:bg-red-50 flex items-center justify-center text-red-400 transition-colors shadow-2xs cursor-pointer"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* SECTION 12: Trusted & Loved */}
          <div className="space-y-3 pt-4 border-t border-gray-100 w-full">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900">Trusted & Loved</h3>
              <Button
                size="sm"
                onClick={() => setTextModalConfig({ isOpen: true, title: 'Add Trusted & Loved Point', placeholder: 'Enter point...', targetSection: 'trusted' })}
                className="bg-[#1C1512] text-white hover:bg-black h-8 px-3"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </Button>
            </div>

            <div className="space-y-3">
              {trustedLoved.length === 0 ? (
                <div className="p-4 border border-dashed border-gray-200 rounded-xl text-center text-xs text-gray-400">
                  No points added yet.
                </div>
              ) : (
                trustedLoved.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => {
                        const updated = [...trustedLoved];
                        updated[index] = e.target.value;
                        setTrustedLoved(updated);
                      }}
                      onBlur={async () => {
                        if (selectedServiceItem) {
                          await saveServiceItem({ name: serviceName || selectedServiceItem.name, trustedLoved });
                        }
                      }}
                      className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C68A4C]/30 focus:border-[#C68A4C] bg-white text-gray-900"
                    />
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => setTextModalConfig({ isOpen: true, title: 'Edit Point', placeholder: 'Enter point...', targetSection: 'trusted', editIndex: index, initialValue: item })}
                        className="w-8 h-8 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 flex items-center justify-center text-gray-400 hover:text-gray-900 transition-colors shadow-2xs cursor-pointer"
                        title="Edit"
                      >
                        <Pencil className="w-3.5 h-3.5 text-gray-500" />
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          const updated = trustedLoved.filter((_, i) => i !== index);
                          setTrustedLoved(updated);
                          toast.info('Highlight removed');
                          if (selectedServiceItem) {
                            await saveServiceItem({ name: serviceName || selectedServiceItem.name, trustedLoved: updated });
                          }
                        }}
                        className="w-8 h-8 rounded-lg border border-red-100 bg-white hover:bg-red-50 flex items-center justify-center text-red-400 transition-colors shadow-2xs cursor-pointer"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* SECTION 13: Reviews Form (Matching Figma Screenshot Exactly) */}
          <div className="space-y-4 pt-4 border-t border-gray-100 w-full">
            <div className="flex items-center justify-between">
              <h3 className="text-[20px] font-bold text-gray-900 tracking-tight">Reviews</h3>
              <Button
                size="sm"
                onClick={() => setShowReviewForm(!showReviewForm)}
                className="bg-[#1C1512] text-white hover:bg-black h-8 px-3.5 rounded-xl text-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add FAQ</span>
              </Button>
            </div>

            {/* Figma Review Form Layout */}
            {showReviewForm && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs">

                {/* Left Column: Name & Image Upload & Display Order */}
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-800 mb-1.5 block">Name</label>
                    <input
                      type="text"
                      placeholder="Enter Name"
                      value={reviewName}
                      onChange={(e) => setReviewName(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C68A4C]/30 focus:border-[#C68A4C] bg-white placeholder-gray-400"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 items-center">
                    {/* Image Upload Box */}
                    <div
                      onClick={() => reviewFileInputRef.current?.click()}
                      className="h-32 bg-[#FAF5F0] rounded-2xl border border-[#F2E5D9] flex flex-col items-center justify-center text-center p-2 cursor-pointer hover:border-[#D4A373] transition-colors relative overflow-hidden group"
                    >
                      {reviewUploading ? (
                        <div className="flex flex-col items-center justify-center text-[#D4A373] gap-1">
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span className="text-[10px]">Uploading...</span>
                        </div>
                      ) : reviewImage ? (
                        <div className="w-full h-full relative flex items-center justify-center">
                          <img src={reviewImage} alt="Avatar" className="max-h-24 object-contain rounded-xl" />
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-xl">
                            <span className="text-[10px] text-white bg-black/60 px-2 py-0.5 rounded">Change</span>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-[#D4A373] mb-1 shadow-xs">
                            <Upload className="w-4 h-4" />
                          </div>
                          <span className="text-xs font-bold text-gray-800">Upload Image</span>
                          <span className="text-[10px] text-gray-400">PNG, JPG up to 2MB</span>
                        </>
                      )}
                    </div>

                    {/* Display Order & Cancel/Save Buttons */}
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs font-semibold text-gray-800 mb-1.5 block">Display Order</label>
                        <input
                          type="number"
                          placeholder="1"
                          value={reviewOrder}
                          onChange={(e) => setReviewOrder(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#C68A4C]/30 focus:border-[#C68A4C]"
                        />
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setReviewName('');
                            setReviewContent('');
                            setReviewOrder('1');
                            setReviewImage(null);
                          }}
                          className="flex-1 text-xs rounded-xl border-gray-300"
                        >
                          Cancel
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          onClick={handleAddReview}
                          className="flex-1 bg-[#221812] text-white hover:bg-black text-xs rounded-xl"
                        >
                          Save
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column: Content Textarea */}
                <div>
                  <label className="text-xs font-semibold text-gray-800 mb-1.5 block">Content</label>
                  <div className="relative">
                    <textarea
                      rows={6}
                      maxLength={100}
                      placeholder="Enter review"
                      value={reviewContent}
                      onChange={(e) => setReviewContent(e.target.value)}
                      className="w-full p-4 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C68A4C]/30 focus:border-[#C68A4C] bg-white resize-none placeholder-gray-400"
                    />
                    <span className="absolute bottom-3 right-4 text-xs text-gray-400 font-medium">
                      {reviewContent.length}/100
                    </span>
                  </div>
                </div>

              </div>
            )}

            {/* List of Saved Reviews */}
            {reviewsList.length > 0 && (
              <div className="space-y-3 pt-2">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Saved Reviews ({reviewsList.length})</span>
                <div className="grid grid-cols-1 gap-3">
                  {reviewsList.map((rev, idx) => (
                    <div key={rev.id || idx} className="p-4 border border-gray-100 rounded-2xl bg-white shadow-2xs flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden flex-shrink-0">
                          <img src={rev.image || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'} alt={rev.name} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <div className="font-bold text-sm text-gray-900">{rev.name}</div>
                          <div className="text-xs text-gray-500 mt-0.5 line-clamp-1">{rev.content}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setReviewName(rev.name || '');
                            setReviewContent(rev.content || '');
                            setReviewOrder(String(rev.displayOrder || 1));
                            setReviewImage(rev.image || null);
                            setEditingReviewIndex(idx);
                            setShowReviewForm(true);
                          }}
                          className="w-8 h-8 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 flex items-center justify-center text-gray-400 hover:text-gray-900 transition-colors shadow-2xs cursor-pointer"
                          title="Edit Review"
                        >
                          <Pencil className="w-3.5 h-3.5 text-gray-500" />
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            const updated = reviewsList.filter((_, i) => i !== idx);
                            setReviewsList(updated);
                            toast.info('Review removed');
                            if (selectedServiceItem) {
                              await saveServiceItem({
                                name: serviceName || selectedServiceItem.name,
                                reviews: updated,
                                customReviews: updated,
                              });
                            }
                          }}
                          className="w-8 h-8 rounded-lg border border-red-100 bg-white hover:bg-red-50 flex items-center justify-center text-red-400 transition-colors shadow-2xs cursor-pointer"
                          title="Delete Review"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-400" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

        </Card>

      </div>

      {/* Styled Modal Dialogs */}
      {selectedServiceItem && (
        <>
          <DurationModal
            isOpen={durationModalOpen}
            onClose={() => setDurationModalOpen(false)}
            onAdd={(dur) => {
              addDurationToService(selectedServiceItem.id, dur);
              toast.success('Duration timeslot added!');
            }}
          />

          <PackModal
            isOpen={packModalOpen}
            onClose={() => setPackModalOpen(false)}
            onAdd={(pkg) => {
              addPackageToService(selectedServiceItem.id, pkg);
              toast.success('Session pack added!');
            }}
          />

          <AddOnModal
            isOpen={addOnModalOpen}
            onClose={() => setAddOnModalOpen(false)}
            onAdd={(addon) => {
              setAddOns(prev => [...prev, { id: `add-${Date.now()}`, ...addon }]);
              toast.success('Add-on added!');
            }}
          />

          <ImageCardModal
            isOpen={imageModalConfig.isOpen}
            titleText={imageModalConfig.title}
            hasSubtitle={imageModalConfig.hasSubtitle}
            initialData={imageModalConfig.initialData}
            onClose={() => setImageModalConfig(prev => ({ ...prev, isOpen: false, editIndex: undefined, initialData: undefined }))}
            onAdd={handleImageCardAdd}
          />

          <TextItemModal
            isOpen={textModalConfig.isOpen}
            titleText={textModalConfig.title}
            placeholderText={textModalConfig.placeholder}
            initialValue={textModalConfig.initialValue}
            onClose={() => setTextModalConfig(prev => ({ ...prev, isOpen: false, editIndex: undefined, initialValue: undefined }))}
            onAdd={handleTextItemAdd}
          />
        </>
      )}

    </div>
  );
}
