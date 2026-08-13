'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Plus, Edit3, Pencil, Trash2, Copy, Upload, ChevronDown, Loader2 } from 'lucide-react';
import { useCatalogue } from '../../contexts/CatalogueContext';
import { uploadFileToR2 } from '../../lib/uploadToR2';
import { toast } from 'react-toastify';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import DurationModal from './DurationModal';
import PackModal from './PackModal';
import AddOnModal from './AddOnModal';
import ZoneOverrideModal from './ZoneOverrideModal';
import ImageCardModal from './ImageCardModal';
import TextItemModal from './TextItemModal';
import FaqModal from './FaqModal';
import AddSectionModal from './AddSectionModal';
import LibraryPickerModal from './LibraryPickerModal';
import {
  useLibrarySections,
  LibrarySectionKey,
  ServiceLibraryPayload,
  TextLibraryPayload,
  ImageLibraryPayload,
  DurationLibraryPayload,
  PackLibraryPayload,
  AddOnLibraryPayload,
} from '../../hooks/useLibrarySections';
import {
  FaqItem,
  ImageCardItem,
  MediaType,
  ReviewItem,
  OperationalZone,
  ServiceDuration,
  ServicePackage,
  ServiceAddOn,
} from '../../types/catalogue';

// Lightweight slug preview — the backend re-normalizes the slug itself on save either way.
function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Unsaved local draft (see handleCreateNewService) — nothing exists on the backend yet, so
// there's nothing for duplicateServiceItem to fetch/clone.
function isDraftServiceId(id?: string | null): boolean {
  return !!id && id.startsWith('srv-');
}

export default function ServiceDetailView() {
  const {
    categories,
    subCategories,
    genders,
    suites,
    selectedSubCategory,
    serviceItems,
    selectedServiceItem,
    setSelectedServiceItem,
    saveServiceItem,
    deleteServiceItem,
    duplicateServiceItem,
    serviceDurations,
    servicePackages,
    serviceAddOns,
    serviceDurationsLoading,
    servicePackagesLoading,
    serviceAddOnsLoading,
    addDurationToService,
    updateDurationInService,
    deleteDurationFromService,
    addPackageToService,
    updatePackageInService,
    deletePackageFromService,
    addAddOnToService,
    updateAddOnInService,
    deleteAddOnFromService,
    loadAllServiceDurations,
    loadAllServiceAddOns,
    loadAllServicePackages,
    zones,
    zoneServiceItemConfigs,
    deleteZoneServiceItemConfig,
  } = useCatalogue();

  // Core Form states
  const [serviceName, setServiceName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [categoryId, setCategoryId] = useState('');
  const [subCategoryId, setSubCategoryId] = useState('');
  const [genderId, setGenderId] = useState('');
  const [suiteId, setSuiteId] = useState('');
  const [cardSubtitle, setCardSubtitle] = useState('');
  // "Main Card" toggle — reuses the existing cardTemplate column (no dedicated isMainCard field
  // on ServiceItem): ON maps to 'PREMIUM', OFF maps to 'REGULAR'.
  const [isMainCard, setIsMainCard] = useState(false);
  const [displayOrder, setDisplayOrder] = useState('1');
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [thumbnailType, setThumbnailType] = useState<MediaType>('IMAGE');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const reviewFileInputRef = useRef<HTMLInputElement | null>(null);

  // Dynamic sections — these map 1:1 onto real ServiceItem JSON columns (see catalog.prisma /
  // CreateServiceItemDto). A few columns on the model have no editor here (freeGifts,
  // includedItems, ambienceItems, hygieneEssentials, careItems, thingsToKnow, beforeYouBook) —
  // left alone rather than guessed at.
  const [features, setFeatures] = useState<string[]>([]);
  const [overviewText, setOverviewText] = useState('');
  const [overviewGallery, setOverviewGallery] = useState<ImageCardItem[]>([]);
  const [procedureSteps, setProcedureSteps] = useState<ImageCardItem[]>([]);
  const [disclaimer, setDisclaimer] = useState<string[]>([]);
  const [itemsUsed, setItemsUsed] = useState<ImageCardItem[]>([]);
  const [skilledPros, setSkilledPros] = useState<string[]>([]);
  const [prePostCare, setPrePostCare] = useState<string[]>([]);
  const [whatsIncluded, setWhatsIncluded] = useState<ImageCardItem[]>([]);
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [trustedLoved, setTrustedLoved] = useState<string[]>([]);

  // Review form state
  const [reviewName, setReviewName] = useState('');
  const [reviewContent, setReviewContent] = useState('');
  const [reviewOrder, setReviewOrder] = useState('1');
  const [reviewImage, setReviewImage] = useState<string | null>(null);
  const [reviewUploading, setReviewUploading] = useState(false);
  const [reviewsList, setReviewsList] = useState<ReviewItem[]>([]);
  const [showReviewForm, setShowReviewForm] = useState(true);
  const [editingReviewIndex, setEditingReviewIndex] = useState<number | null>(null);

  // Modals state
  const [durationModalOpen, setDurationModalOpen] = useState(false);
  const [editingDuration, setEditingDuration] = useState<ServiceDuration | null>(null);
  const [packModalOpen, setPackModalOpen] = useState(false);
  const [editingPack, setEditingPack] = useState<ServicePackage | null>(null);
  const [addOnModalOpen, setAddOnModalOpen] = useState(false);
  const [editingAddOn, setEditingAddOn] = useState<ServiceAddOn | null>(null);
  const [zoneModalOpen, setZoneModalOpen] = useState(false);
  const [zoneForModal, setZoneForModal] = useState<OperationalZone | null>(null);
  const [zonePickerId, setZonePickerId] = useState('');

  // Add -> Create/Library wizard (see AddSectionModal). One popup, tab-switched, drives all 13
  // sections — renderCreate is set per-button-click to whatever embedded Create form that
  // section needs; the Library tab is generic, driven purely by sectionKey (see
  // useLibrarySections + handleLibrarySave below).
  const [addSection, setAddSection] = useState<{
    isOpen: boolean;
    sectionKey: LibrarySectionKey;
    label: string;
    renderCreate: () => React.ReactNode;
  } | null>(null);
  const librarySections = useLibrarySections();

  const openAddSection = (sectionKey: LibrarySectionKey, label: string, renderCreate: () => React.ReactNode) => {
    setAddSection({ isOpen: true, sectionKey, label, renderCreate });
  };
  const closeAddSection = () => setAddSection(null);

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
    targetSection: 'features' | 'pros' | 'care' | 'disclaimer' | 'trusted';
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

  // Sub-categories available under whichever category is currently picked in the form.
  const subCategoryOptions = subCategories.filter(s => s.categoryId === categoryId);
  // Suites are scoped to a category too (see ServiceSuite in catalog.prisma) — same filtering
  // as subCategoryOptions above. Genders are global, so no filtering needed for those.
  const suiteOptions = suites.filter(s => s.categoryId === categoryId);

  // Cross-service duration/add-on catalogs power the "pick from existing" selector inside those
  // modals — load them once when this form mounts so the popups open with data already in hand
  // instead of re-fetching (and showing a loading state) on every "+ Add" click. Packs no longer
  // have a cross-service picker — their price is derived from this service's own durations.
  useEffect(() => {
    loadAllServiceDurations();
    loadAllServiceAddOns();
    loadAllServicePackages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedServiceItem) {
      setServiceName(selectedServiceItem.name || '');
      setSlug(selectedServiceItem.slug || '');
      setSlugTouched(true);
      setCardSubtitle(selectedServiceItem.cardSubtitle || '');
      setIsMainCard(selectedServiceItem.cardTemplate === 'PREMIUM');
      setDisplayOrder(String(selectedServiceItem.displayOrder || 1));
      setThumbnailUrl(selectedServiceItem.thumbnailKey || null);
      setThumbnailType(selectedServiceItem.thumbnailType || 'IMAGE');

      const parentCategoryId = subCategories.find(s => s.id === selectedServiceItem.subCategoryId)?.categoryId || '';
      setCategoryId(parentCategoryId);
      setSubCategoryId(selectedServiceItem.subCategoryId || '');
      setGenderId(selectedServiceItem.genderId || '');
      setSuiteId(selectedServiceItem.suiteId || '');

      setFeatures(Array.isArray(selectedServiceItem.features) ? selectedServiceItem.features : []);
      setOverviewText(selectedServiceItem.overview?.text || '');
      setOverviewGallery(Array.isArray(selectedServiceItem.overview?.gallery) ? selectedServiceItem.overview!.gallery! : []);
      setProcedureSteps(Array.isArray(selectedServiceItem.procedureSteps) ? selectedServiceItem.procedureSteps : []);
      setDisclaimer(Array.isArray(selectedServiceItem.disclaimer) ? selectedServiceItem.disclaimer : []);
      setItemsUsed(Array.isArray(selectedServiceItem.itemsUsed) ? selectedServiceItem.itemsUsed : []);
      setSkilledPros(Array.isArray(selectedServiceItem.skilledPros) ? selectedServiceItem.skilledPros : []);
      setPrePostCare(Array.isArray(selectedServiceItem.prePostCare) ? selectedServiceItem.prePostCare : []);
      setWhatsIncluded(Array.isArray(selectedServiceItem.whatsIncluded) ? selectedServiceItem.whatsIncluded : []);
      setFaqs(Array.isArray(selectedServiceItem.faqs) ? selectedServiceItem.faqs : []);
      setTrustedLoved(Array.isArray(selectedServiceItem.trustedLoved) ? selectedServiceItem.trustedLoved : []);
      setReviewsList(
        Array.isArray(selectedServiceItem.customReviews)
          ? selectedServiceItem.customReviews
          : Array.isArray(selectedServiceItem.reviews)
          ? selectedServiceItem.reviews
          : []
      );
    }
  }, [selectedServiceItem, subCategories]);

  const handleNameChange = (value: string) => {
    setServiceName(value);
    if (!slugTouched) setSlug(slugify(value));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size cannot exceed 5MB');
      return;
    }

    setUploading(true);
    try {
      const result = await uploadFileToR2(file, 'services', slug || 'service-item');
      setThumbnailUrl(result.url);
      setThumbnailType(file.type.startsWith('video/') ? 'VIDEO' : 'IMAGE');
    } catch (err: any) {
      toast.error(`Upload error: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleReviewFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size cannot exceed 5MB');
      return;
    }

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

    const newReview: ReviewItem = {
      id: editingReviewIndex !== null && reviewsList[editingReviewIndex]?.id ? reviewsList[editingReviewIndex].id : `rev-${Date.now()}`,
      name: reviewName.trim() || 'Anonymous Reviewer',
      content: reviewContent.trim() || 'Great service!',
      displayOrder: Number(reviewOrder) || 1,
      image: reviewImage || undefined,
    };

    let updatedList: ReviewItem[];
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

    if (selectedServiceItem) {
      await saveServiceItem({ name: serviceName || selectedServiceItem.name, reviews: updatedList, customReviews: updatedList });
    }
  };

  const handleSave = async (isPublished = true) => {
    if (!serviceName.trim()) {
      toast.error('Please enter a service name');
      return;
    }
    if (!subCategoryId) {
      toast.error('Please select a sub-category');
      return;
    }
    if (!genderId) {
      toast.error('Please select a gender');
      return;
    }
    if (!suiteId) {
      toast.error('Please select a suite');
      return;
    }

    setSaving(true);
    try {
      const res = await saveServiceItem({
        name: serviceName,
        slug: slugify(slug || serviceName),
        subCategoryId,
        genderId,
        suiteId,
        cardTitle: serviceName,
        cardSubtitle,
        cardTemplate: isMainCard ? 'PREMIUM' : 'REGULAR',
        displayOrder: Number(displayOrder) || 1,
        isPublished,
        thumbnailKey: thumbnailUrl || undefined,
        thumbnailType,
        features,
        overview: { text: overviewText, gallery: overviewGallery },
        procedureSteps,
        disclaimer,
        itemsUsed,
        skilledPros,
        prePostCare,
        whatsIncluded,
        faqs,
        trustedLoved,
        reviews: reviewsList,
        customReviews: reviewsList,
      });

      if (res.ok) {
        toast.success(isPublished ? 'Service published to database!' : 'Saved draft to database!');
      } else {
        toast.error(`Failed to save: ${res.message || 'Server error'}`);
      }
    } catch (err: any) {
      toast.error(`Failed to save: ${err.message || 'Error occurred'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateNewService = () => {
    if (!selectedSubCategory) {
      toast.error('Select a sub-category first');
      return;
    }
    const newService = {
      id: `srv-${Date.now()}`,
      subCategoryId: selectedSubCategory.id,
      name: 'New Service Item',
      slug: `new-service-${Date.now()}`,
      cardTitle: 'New Service Item',
      cardSubtitle: 'Enter subtitle',
      isActive: true,
      isPublished: false,
      displayOrder: filteredServices.length + 1,
    };
    setSelectedServiceItem(newService as any);
    toast.info('Created new service draft!');
  };

  const handleDeleteService = async (id: string) => {
    try {
      const res = await deleteServiceItem(id);
      if (res.ok) {
        toast.success('Service item deleted!');
      } else {
        toast.error(`Failed to delete: ${res.message || 'Error occurred'}`);
      }
    } catch (err: any) {
      toast.error(`Failed to delete: ${err.message}`);
    }
  };

  const handleDuplicateService = async (id: string) => {
    setDuplicatingId(id);
    try {
      // Always land the clone in whichever sub-category is currently active — a no-op for the
      // per-row Duplicate button (its source already lives there) and what makes the "+ Add
      // Service -> Duplicate Existing" picker below usable for cross-sub-category templates.
      const res = await duplicateServiceItem(id, selectedSubCategory?.id);
      if (res.ok) {
        toast.success('Service item duplicated!');
      } else {
        toast.error(`Failed to duplicate: ${res.message || 'Error occurred'}`);
      }
    } catch (err: any) {
      toast.error(`Failed to duplicate: ${err.message}`);
    } finally {
      setDuplicatingId(null);
    }
  };

  const handleImageCardAdd = async (
    item: { title: string; subtitle?: string; description?: string; image: string },
    // Set when saving straight from the Library picker (see handleLibrarySave) — bypasses
    // imageModalConfig entirely since there's no modal/edit-index involved in that flow.
    sectionOverride?: 'overview' | 'procedure' | 'items' | 'included'
  ) => {
    const section = sectionOverride ?? imageModalConfig.targetSection;
    const editIndex = sectionOverride ? undefined : imageModalConfig.editIndex;
    const card: ImageCardItem = { id: `${section}-${Date.now()}`, title: item.title, subtitle: item.subtitle, image: item.image };

    if (section === 'overview') {
      const updated = editIndex !== undefined ? overviewGallery.map((s, i) => (i === editIndex ? { ...s, ...card } : s)) : [...overviewGallery, card];
      setOverviewGallery(updated);
      toast.success(editIndex !== undefined ? 'Overview item updated!' : 'Overview item added!');
      if (selectedServiceItem) await saveServiceItem({ name: serviceName || selectedServiceItem.name, overview: { text: overviewText, gallery: updated } });
    } else if (section === 'procedure') {
      const updated = editIndex !== undefined ? procedureSteps.map((s, i) => (i === editIndex ? { ...s, ...card } : s)) : [...procedureSteps, card];
      setProcedureSteps(updated);
      toast.success(editIndex !== undefined ? 'Procedure step updated!' : 'Procedure step added!');
      if (selectedServiceItem) await saveServiceItem({ name: serviceName || selectedServiceItem.name, procedureSteps: updated });
    } else if (section === 'items') {
      const updated = editIndex !== undefined ? itemsUsed.map((s, i) => (i === editIndex ? { ...s, ...card } : s)) : [...itemsUsed, card];
      setItemsUsed(updated);
      toast.success(editIndex !== undefined ? 'Item updated!' : 'Item added!');
      if (selectedServiceItem) await saveServiceItem({ name: serviceName || selectedServiceItem.name, itemsUsed: updated });
    } else if (section === 'included') {
      const updated = editIndex !== undefined ? whatsIncluded.map((s, i) => (i === editIndex ? { ...s, ...card } : s)) : [...whatsIncluded, card];
      setWhatsIncluded(updated);
      toast.success(editIndex !== undefined ? 'Included item updated!' : 'Included item added!');
      if (selectedServiceItem) await saveServiceItem({ name: serviceName || selectedServiceItem.name, whatsIncluded: updated });
    }
  };

  const handleTextItemAdd = async (
    text: string,
    // Set when saving straight from the Library picker (see handleLibrarySave).
    sectionOverride?: 'features' | 'pros' | 'care' | 'disclaimer' | 'trusted'
  ) => {
    const section = sectionOverride ?? textModalConfig.targetSection;
    const editIdx = sectionOverride ? undefined : textModalConfig.editIndex;

    if (section === 'features') {
      const updated = editIdx !== undefined ? features.map((f, i) => (i === editIdx ? text : f)) : [...features, text];
      setFeatures(updated);
      toast.success(editIdx !== undefined ? 'Feature updated!' : 'Feature added!');
      if (selectedServiceItem) await saveServiceItem({ name: serviceName || selectedServiceItem.name, features: updated });
    } else if (section === 'pros') {
      const updated = editIdx !== undefined ? skilledPros.map((p, i) => (i === editIdx ? text : p)) : [...skilledPros, text];
      setSkilledPros(updated);
      toast.success(editIdx !== undefined ? 'Highlight updated!' : 'Highlight added!');
      if (selectedServiceItem) await saveServiceItem({ name: serviceName || selectedServiceItem.name, skilledPros: updated });
    } else if (section === 'care') {
      const updated = editIdx !== undefined ? prePostCare.map((c, i) => (i === editIdx ? text : c)) : [...prePostCare, text];
      setPrePostCare(updated);
      toast.success(editIdx !== undefined ? 'Care instruction updated!' : 'Care instruction added!');
      if (selectedServiceItem) await saveServiceItem({ name: serviceName || selectedServiceItem.name, prePostCare: updated });
    } else if (section === 'disclaimer') {
      const updated = editIdx !== undefined ? disclaimer.map((d, i) => (i === editIdx ? text : d)) : [...disclaimer, text];
      setDisclaimer(updated);
      toast.success(editIdx !== undefined ? 'Disclaimer point updated!' : 'Disclaimer point added!');
      if (selectedServiceItem) await saveServiceItem({ name: serviceName || selectedServiceItem.name, disclaimer: updated });
    } else if (section === 'trusted') {
      const updated = editIdx !== undefined ? trustedLoved.map((t, i) => (i === editIdx ? text : t)) : [...trustedLoved, text];
      setTrustedLoved(updated);
      toast.success(editIdx !== undefined ? 'Highlight point updated!' : 'Highlight point added!');
      if (selectedServiceItem) await saveServiceItem({ name: serviceName || selectedServiceItem.name, trustedLoved: updated });
    }
  };

  const handleFaqAdd = async (faq: FaqItem) => {
    const updated = [...faqs, faq];
    setFaqs(updated);
    toast.success('FAQ added!');
    if (selectedServiceItem) await saveServiceItem({ name: serviceName || selectedServiceItem.name, faqs: updated });
  };

  const handleFaqFieldBlur = async () => {
    if (selectedServiceItem) await saveServiceItem({ name: serviceName || selectedServiceItem.name, faqs });
  };

  // Batch counterparts of handleTextItemAdd/handleImageCardAdd/handleFaqAdd for the Library tab's
  // multi-select (see handleLibrarySave below). These merge every picked item into the array in
  // ONE setState + ONE saveServiceItem call rather than calling the single-item handlers in a
  // loop — looping them would have each iteration read the same pre-loop array off its closure
  // (React doesn't re-render mid-loop) and overwrite, silently dropping every item but the last.
  const handleTextItemsBatchAdd = async (
    section: 'features' | 'pros' | 'care' | 'disclaimer' | 'trusted',
    texts: string[]
  ) => {
    if (texts.length === 0 || !selectedServiceItem) return;
    const label = {
      features: 'Feature', pros: 'Highlight', care: 'Care instruction', disclaimer: 'Disclaimer point', trusted: 'Highlight point',
    }[section];
    const name = serviceName || selectedServiceItem.name;
    if (section === 'features') {
      const updated = [...features, ...texts];
      setFeatures(updated);
      await saveServiceItem({ name, features: updated });
    } else if (section === 'pros') {
      const updated = [...skilledPros, ...texts];
      setSkilledPros(updated);
      await saveServiceItem({ name, skilledPros: updated });
    } else if (section === 'care') {
      const updated = [...prePostCare, ...texts];
      setPrePostCare(updated);
      await saveServiceItem({ name, prePostCare: updated });
    } else if (section === 'disclaimer') {
      const updated = [...disclaimer, ...texts];
      setDisclaimer(updated);
      await saveServiceItem({ name, disclaimer: updated });
    } else if (section === 'trusted') {
      const updated = [...trustedLoved, ...texts];
      setTrustedLoved(updated);
      await saveServiceItem({ name, trustedLoved: updated });
    }
    toast.success(`${texts.length} ${label}${texts.length === 1 ? '' : 's'} added!`);
  };

  const handleImageCardsBatchAdd = async (
    section: 'overview' | 'procedure' | 'items' | 'included',
    items: { title: string; subtitle?: string; image: string }[]
  ) => {
    if (items.length === 0 || !selectedServiceItem) return;
    // Index-suffixed so ids stay unique even though every card in the batch shares a Date.now().
    const cards: ImageCardItem[] = items.map((item, i) => ({
      id: `${section}-${Date.now()}-${i}`, title: item.title, subtitle: item.subtitle, image: item.image,
    }));
    const name = serviceName || selectedServiceItem.name;
    if (section === 'overview') {
      const updated = [...overviewGallery, ...cards];
      setOverviewGallery(updated);
      await saveServiceItem({ name, overview: { text: overviewText, gallery: updated } });
    } else if (section === 'procedure') {
      const updated = [...procedureSteps, ...cards];
      setProcedureSteps(updated);
      await saveServiceItem({ name, procedureSteps: updated });
    } else if (section === 'items') {
      const updated = [...itemsUsed, ...cards];
      setItemsUsed(updated);
      await saveServiceItem({ name, itemsUsed: updated });
    } else if (section === 'included') {
      const updated = [...whatsIncluded, ...cards];
      setWhatsIncluded(updated);
      await saveServiceItem({ name, whatsIncluded: updated });
    }
    toast.success(`${cards.length} item${cards.length === 1 ? '' : 's'} added!`);
  };

  const handleFaqsBatchAdd = async (newFaqs: FaqItem[]) => {
    if (newFaqs.length === 0 || !selectedServiceItem) return;
    const updated = [...faqs, ...newFaqs];
    setFaqs(updated);
    await saveServiceItem({ name: serviceName || selectedServiceItem.name, faqs: updated });
    toast.success(`${newFaqs.length} FAQ${newFaqs.length === 1 ? '' : 's'} added!`);
  };

  // Fires when "Save Selected" is clicked in the Library tab — routes every picked row's payload
  // (see useLibrarySections) to the same save path its section's Create form would use, so a
  // library pick behaves like manually re-typing those same items. Duration/Pack/Add-On/Service
  // each create an independent backend row per item, so those loop with a sequential await
  // (each add already re-fetches its list from the server, so there's no stale-closure risk);
  // the JSON-array sections batch through handle*BatchAdd above instead, for the reason in its
  // comment.
  const handleLibrarySave = async (sectionKey: LibrarySectionKey, payloads: unknown[]) => {
    if (payloads.length === 0) return;
    switch (sectionKey) {
      case 'service': {
        if (!selectedSubCategory) break;
        let succeeded = 0;
        for (const { id: sourceId } of payloads as ServiceLibraryPayload[]) {
          const res = await duplicateServiceItem(sourceId, selectedSubCategory.id);
          if (res.ok) succeeded++;
          else toast.error(`Failed to duplicate: ${res.message || 'Error occurred'}`);
        }
        if (succeeded > 0) toast.success(`${succeeded} service${succeeded === 1 ? '' : 's'} duplicated!`);
        break;
      }
      case 'features':
      case 'pros':
      case 'care':
      case 'disclaimer':
      case 'trusted':
        await handleTextItemsBatchAdd(sectionKey, (payloads as TextLibraryPayload[]).map((p) => p.text));
        break;
      case 'overview':
      case 'procedure':
      case 'items':
      case 'included':
        await handleImageCardsBatchAdd(sectionKey, payloads as ImageLibraryPayload[]);
        break;
      case 'faqs':
        await handleFaqsBatchAdd(payloads as FaqItem[]);
        break;
      case 'duration': {
        if (!selectedServiceItem) break;
        let succeeded = 0;
        for (const d of payloads as DurationLibraryPayload[]) {
          const res = await addDurationToService(selectedServiceItem.id, {
            label: d.label,
            durationMinutes: d.durationMinutes,
            price: d.price,
            discountedPrice: d.discountedPrice,
          });
          if (res.ok) succeeded++;
          else toast.error(`Failed to add "${d.label}": ${res.message || 'Error occurred'}`);
        }
        if (succeeded > 0) toast.success(`${succeeded} timeslot${succeeded === 1 ? '' : 's'} added!`);
        break;
      }
      case 'pack': {
        if (!selectedServiceItem) break;
        // Same rule as PackModal: price always derives from THIS service's own default
        // duration x sessions, adjusted by savingsPercent — a library pack only carries over
        // its sessions/discount shape, never its absolute price from wherever it came from.
        const baseDuration = serviceDurations.find((d) => d.isDefault) ?? serviceDurations[0] ?? null;
        if (!baseDuration) {
          toast.error('Add a duration to this service first — packs are priced off its duration price.');
          break;
        }
        let succeeded = 0;
        for (const p of payloads as PackLibraryPayload[]) {
          const basePrice = baseDuration.price * p.sessions;
          const finalPrice = Math.round(basePrice * (1 + p.savingsPercent / 100));
          const pricePerSession = p.sessions > 0 ? Math.round(finalPrice / p.sessions) : 0;
          const res = await addPackageToService(selectedServiceItem.id, {
            label: p.label,
            sessions: p.sessions,
            price: finalPrice,
            pricePerSession,
            originalPrice: basePrice,
            savingsPercent: p.savingsPercent,
          });
          if (res.ok) succeeded++;
          else toast.error(`Failed to add "${p.label}": ${res.message || 'Error occurred'}`);
        }
        if (succeeded > 0) toast.success(`${succeeded} session pack${succeeded === 1 ? '' : 's'} added!`);
        break;
      }
      case 'addon': {
        if (!selectedServiceItem) break;
        let succeeded = 0;
        for (const a of payloads as AddOnLibraryPayload[]) {
          const res = await addAddOnToService(selectedServiceItem.id, {
            name: a.name,
            price: a.price,
            imageKey: a.imageKey,
            description: a.description,
            extraMinutes: a.extraMinutes,
            isActive: a.isActive ?? true,
          });
          if (res.ok) succeeded++;
          else toast.error(`Failed to add "${a.name}": ${res.message || 'Error occurred'}`);
        }
        if (succeeded > 0) toast.success(`${succeeded} add-on${succeeded === 1 ? '' : 's'} added!`);
        break;
      }
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 lg:pb-4 animate-in fade-in duration-300 w-full">

      {/* Hidden file inputs */}
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

        {/* LEFT COLUMN: SERVICES LIST TABLE — sticky and independently scrollable from lg: up,
            so it stays in view while the much longer edit form on the right scrolls past it. */}
        <div className="lg:col-span-4 space-y-4 w-full lg:sticky lg:top-6 lg:self-start lg:max-h-[calc(100vh-15rem)] lg:overflow-y-auto">
          <Card className="w-full">

            {/* Header with '+' Button — pinned within the list's own scroll box (see the sticky
                wrapper above) so it stays visible while a long services list scrolls under it. */}
            <div className="bg-[#FAF5F0] px-4 sm:px-6 py-4 border-b border-[#F2E5D9] flex items-center justify-between lg:sticky lg:top-0 lg:z-10">
              <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Services</span>
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Action</span>
                <Button
                  size="icon"
                  onClick={() => {
                    if (!selectedSubCategory) {
                      toast.error('Select a sub-category first');
                      return;
                    }
                    openAddSection('service', 'Service', () => (
                      <div className="flex flex-col items-center justify-center text-center gap-4 py-8">
                        <p className="text-sm text-gray-500 max-w-xs">
                          Starts a blank draft under{' '}
                          <span className="font-semibold text-gray-800">{selectedSubCategory.name}</span> — you'll
                          fill in its name, pricing, and content in the edit form.
                        </p>
                        <Button
                          onClick={() => {
                            handleCreateNewService();
                            closeAddSection();
                          }}
                          className="bg-[#1C1512] text-white hover:bg-black"
                        >
                          <Plus className="w-4 h-4" />
                          Create Blank Service
                        </Button>
                      </div>
                    ));
                  }}
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
                          variant="outline"
                          size="icon"
                          onClick={() => handleDuplicateService(service.id)}
                          disabled={duplicatingId === service.id || isDraftServiceId(service.id)}
                          className="w-7 h-7"
                          title="Duplicate Service"
                        >
                          {duplicatingId === service.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
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

        {/* RIGHT COLUMN: EDIT SERVICE FORM & ALL SECTIONS — the header (title + Save as
            Draft/Publish) is pinned; only the form body below it scrolls, independently from
            the page and from the sticky services list on the left. */}
        <Card className="lg:col-span-8 w-full lg:h-[calc(100vh-15rem)] flex flex-col overflow-hidden">

          {/* Top Form Header & Save Buttons */}
          <div className="flex-shrink-0 bg-white lg:sticky lg:top-0 lg:z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 px-4 sm:px-6 md:px-8 pt-4 sm:pt-6 md:pt-8 pb-5">
            <h2 className="text-xl font-bold text-gray-900">Edit Service</h2>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                disabled={saving}
                onClick={() => handleSave(false)}
              >
                Save as Draft
              </Button>
              <Button
                disabled={saving}
                onClick={() => handleSave(true)}
                className="bg-[#221812] text-white hover:bg-black"
              >
                {saving ? 'Saving...' : 'Publish'}
              </Button>
            </div>
          </div>

          {/* Scrollable form body */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 md:px-8 py-6 md:py-8 space-y-8 md:space-y-10">

          {/* Service Name, Slug, Upload Row */}
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
                ) : thumbnailUrl ? (
                  <div className="w-full h-full relative flex items-center justify-center">
                    {thumbnailType === 'VIDEO' ? (
                      <video src={thumbnailUrl} className="max-h-32 object-contain" muted />
                    ) : (
                      <img src={thumbnailUrl} alt="Service Preview" className="max-h-32 object-contain" />
                    )}
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
                    <span className="text-[11px] text-gray-400">PNG, JPG up to 5MB</span>
                  </>
                )}
              </div>
            </div>

            {/* Inputs: Service Name, Slug */}
            <div className="md:col-span-8 space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-700 mb-1.5 block">
                  Service Name<span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter service name"
                  value={serviceName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C68A4C]/30 focus:border-[#C68A4C]"
                />
              </div>

              <div className="flex items-end gap-4">
                <div className="flex-1">
                  <label className="text-xs font-semibold text-gray-700 mb-1.5 block">
                    Slug
                  </label>
                  <input
                    type="text"
                    placeholder="auto-generated-from-name"
                    value={slug}
                    onChange={(e) => {
                      setSlugTouched(true);
                      setSlug(e.target.value);
                    }}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C68A4C]/30 focus:border-[#C68A4C]"
                  />
                </div>
                <div className="flex items-center gap-2 pb-2.5 flex-shrink-0">
                  <span className="text-xs font-semibold text-gray-700">Main Card</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={isMainCard}
                    onClick={() => setIsMainCard((v) => !v)}
                    className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 cursor-pointer ${isMainCard ? 'bg-[#1C1512]' : 'bg-gray-200'
                      }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${isMainCard ? 'translate-x-5' : ''
                        }`}
                    />
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
                  value={categoryId}
                  onChange={(e) => {
                    const newCategoryId = e.target.value;
                    setCategoryId(newCategoryId);
                    const firstSub = subCategories.find(s => s.categoryId === newCategoryId);
                    setSubCategoryId(firstSub?.id || '');
                    // Suites are scoped to the category too — a suite picked under the old
                    // category won't exist in the new one's options, so reset it the same way.
                    const firstSuite = suites.find(s => s.categoryId === newCategoryId);
                    setSuiteId(firstSuite?.id || '');
                  }}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-[#C68A4C]/30 focus:border-[#C68A4C] bg-white cursor-pointer"
                >
                  <option value="" disabled>Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
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
                  value={subCategoryId}
                  onChange={(e) => setSubCategoryId(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-[#C68A4C]/30 focus:border-[#C68A4C] bg-white cursor-pointer"
                >
                  <option value="" disabled>Select a sub-category</option>
                  {subCategoryOptions.map((sub) => (
                    <option key={sub.id} value={sub.id}>{sub.name}</option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Gender & Suite Dropdowns (see ServiceGender/ServiceSuite in catalog.prisma) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-xs font-semibold text-gray-700 mb-1.5 block">
                Gender<span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={genderId}
                  onChange={(e) => setGenderId(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-[#C68A4C]/30 focus:border-[#C68A4C] bg-white cursor-pointer"
                >
                  <option value="" disabled>Select a gender</option>
                  {genders.map((g) => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
              {genders.length === 0 && (
                <p className="text-xs text-gray-400 mt-1.5">No genders yet — add one from the Genders section above.</p>
              )}
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 mb-1.5 block">
                Suite<span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={suiteId}
                  onChange={(e) => setSuiteId(e.target.value)}
                  disabled={!categoryId}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-[#C68A4C]/30 focus:border-[#C68A4C] bg-white cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="" disabled>Select a suite</option>
                  {suiteOptions.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
              {categoryId && suiteOptions.length === 0 && (
                <p className="text-xs text-gray-400 mt-1.5">No suites for this category yet — add one from the Categories page.</p>
              )}
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
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                Select Duration (timeslots)
                {serviceDurationsLoading && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#C68A4C] normal-case">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Updating...
                  </span>
                )}
              </h3>
              <Button
                size="sm"
                disabled={!selectedServiceItem || serviceDurationsLoading}
                onClick={() => openAddSection('duration', 'Duration', () => (
                  <DurationModal
                    embedded
                    isOpen
                    initialData={null}
                    onClose={closeAddSection}
                    onAdd={async (dur) => {
                      if (!selectedServiceItem) return;
                      const res = await addDurationToService(selectedServiceItem.id, dur);
                      if (res.ok) toast.success('Duration timeslot added!');
                      else toast.error(`Failed to add timeslot: ${res.message || 'Error occurred'}`);
                    }}
                  />
                ))}
                className="bg-[#1C1512] text-white hover:bg-black h-8 px-3"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </Button>
            </div>

            <div className="border border-gray-100 rounded-2xl overflow-x-auto w-full">
              <table className="w-full text-left border-collapse min-w-[560px]">
                <thead>
                  <tr className="bg-[#FAF5F0] text-gray-700 text-xs font-semibold uppercase tracking-wider border-b border-[#F2E5D9]">
                    <th className="py-3 px-4 sm:px-6">Duration</th>
                    <th className="py-3 px-4 sm:px-6 text-center">Original Price (₹)</th>
                    <th className="py-3 px-4 sm:px-6 text-center">Discounted Price (₹)</th>
                    <th className="py-3 px-4 sm:px-6 text-center">Discount</th>
                    <th className="py-3 px-4 sm:px-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                  {serviceDurationsLoading ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-xs text-gray-400">
                        <span className="inline-flex items-center gap-1.5">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          {serviceDurations.length > 0 ? 'Updating...' : 'Loading...'}
                        </span>
                      </td>
                    </tr>
                  ) : serviceDurations.length > 0 ? (
                    serviceDurations.map((dur) => {
                      const hasDiscount = dur.discountedPrice != null && dur.discountedPrice < dur.price;
                      const discountPercent = hasDiscount
                        ? Math.round(((dur.price - (dur.discountedPrice as number)) / dur.price) * 100)
                        : 0;
                      return (
                      <tr key={dur.id} className="hover:bg-gray-50/50">
                        <td className="py-3 px-4 sm:px-6 font-medium">{dur.label}</td>
                        <td className={`py-3 px-4 sm:px-6 text-center font-semibold ${hasDiscount ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                          {dur.price.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 sm:px-6 text-center font-semibold text-gray-900">
                          {hasDiscount ? dur.discountedPrice!.toLocaleString() : '-'}
                        </td>
                        <td className="py-3 px-4 sm:px-6 text-center">
                          {hasDiscount ? (
                            <span className="inline-flex px-2.5 py-1 rounded-full text-[11px] font-semibold bg-green-50 text-green-700">
                              {discountPercent}% off
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 sm:px-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => { setEditingDuration(dur); setDurationModalOpen(true); }}
                              className="w-7 h-7"
                              title="Edit Timeslot"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="icon"
                              onClick={async () => {
                                if (!selectedServiceItem) return;
                                const res = await deleteDurationFromService(selectedServiceItem.id, dur.id);
                                if (res.ok) {
                                  toast.success('Timeslot removed');
                                } else {
                                  toast.error(`Failed to remove timeslot: ${res.message || 'Error occurred'}`);
                                }
                              }}
                              className="w-7 h-7 bg-red-50 text-red-500 hover:bg-red-100 border-none"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-xs text-gray-400">
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
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                Select a pack
                {servicePackagesLoading && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#C68A4C] normal-case">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Updating...
                  </span>
                )}
              </h3>
              <Button
                size="sm"
                disabled={!selectedServiceItem || servicePackagesLoading}
                onClick={() => openAddSection('pack', 'Pack', () => (
                  <PackModal
                    embedded
                    isOpen
                    initialData={null}
                    durations={serviceDurations}
                    onClose={closeAddSection}
                    onAdd={async (pkg) => {
                      if (!selectedServiceItem) return;
                      const res = await addPackageToService(selectedServiceItem.id, pkg);
                      if (res.ok) toast.success('Session pack added!');
                      else toast.error(`Failed to add session pack: ${res.message || 'Error occurred'}`);
                    }}
                  />
                ))}
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
                    <th className="py-3 px-4 sm:px-6 text-center">Multiplier</th>
                    <th className="py-3 px-4 sm:px-6 text-center">Discount (%)</th>
                    <th className="py-3 px-4 sm:px-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                  {servicePackagesLoading ? (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-xs text-gray-400">
                        <span className="inline-flex items-center gap-1.5">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          {servicePackages.length > 0 ? 'Updating...' : 'Loading...'}
                        </span>
                      </td>
                    </tr>
                  ) : servicePackages.length > 0 ? (
                    servicePackages.map((pkg) => {
                      // The backend derives price/originalPrice from sessions + savingsPercent (see
                      // ServicePackagePayload in lib/server-actions/package.ts) and echoes savingsPercent
                      // back directly — use it instead of re-deriving from price/originalPrice, which
                      // isn't guaranteed to round-trip cleanly.
                      const discountPercent = pkg.savingsPercent != null
                        ? Math.round(pkg.savingsPercent)
                        : (() => {
                          const base = pkg.originalPrice ?? pkg.price;
                          return base > 0 ? Math.round(((pkg.price - base) / base) * 100) : 0;
                        })();
                      return (
                      <tr key={pkg.id} className="hover:bg-[#FAF9F6]/50">
                        <td className="py-3 px-4 sm:px-6 font-semibold text-gray-900">{pkg.label} ({pkg.sessions})</td>
                        <td className="py-3 px-4 sm:px-6 text-center font-semibold text-gray-900">
                          ×{pkg.sessions}
                        </td>
                        <td className="py-3 px-4 sm:px-6 text-center">
                          {discountPercent !== 0 ? (
                            <span className="inline-flex px-2.5 py-1 rounded-full text-[11px] font-semibold bg-green-50 text-green-700">
                              {discountPercent}%
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 sm:px-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => { setEditingPack(pkg); setPackModalOpen(true); }}
                              className="w-7 h-7"
                              title="Edit Session Pack"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="icon"
                              onClick={async () => {
                                if (!selectedServiceItem) return;
                                const res = await deletePackageFromService(selectedServiceItem.id, pkg.id);
                                if (res.ok) {
                                  toast.success('Session pack removed');
                                } else {
                                  toast.error(`Failed to remove session pack: ${res.message || 'Error occurred'}`);
                                }
                              }}
                              className="w-7 h-7 bg-red-50 text-red-500 hover:bg-red-100 border-none"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-xs text-gray-400">
                        {serviceDurations.length === 0
                          ? 'Add a duration first, then create session packs from it.'
                          : 'No session packs added yet. Click "+ Add" to add one.'}
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
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                Add-ons
                {serviceAddOnsLoading && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#C68A4C] normal-case">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Updating...
                  </span>
                )}
              </h3>
              <Button
                size="sm"
                disabled={!selectedServiceItem || serviceAddOnsLoading}
                onClick={() => openAddSection('addon', 'Add-On', () => (
                  <AddOnModal
                    embedded
                    isOpen
                    initialData={null}
                    onClose={closeAddSection}
                    onAdd={async (addon) => {
                      if (!selectedServiceItem) return;
                      const res = await addAddOnToService(selectedServiceItem.id, addon);
                      if (res.ok) toast.success('Add-on added!');
                      else toast.error(`Failed to add add-on: ${res.message || 'Error occurred'}`);
                    }}
                  />
                ))}
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
                  {serviceAddOnsLoading ? (
                    <tr>
                      <td colSpan={3} className="py-6 text-center text-xs text-gray-400">
                        <span className="inline-flex items-center gap-1.5">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          {serviceAddOns.length > 0 ? 'Updating...' : 'Loading...'}
                        </span>
                      </td>
                    </tr>
                  ) : serviceAddOns.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="py-6 text-center text-xs text-gray-400">
                        No add-ons created yet. Click "+ Add" to create one.
                      </td>
                    </tr>
                  ) : (
                    serviceAddOns.map((addon) => (
                      <tr key={addon.id} className="hover:bg-gray-50/50">
                        <td className="py-3.5 px-4 sm:px-6 font-semibold text-gray-900 flex items-center gap-2.5">
                          {addon.imageKey && (
                            <img src={addon.imageKey} alt={addon.name} className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
                          )}
                          {addon.name}
                        </td>
                        <td className="py-3.5 px-4 sm:px-6 text-center font-bold text-gray-900">{addon.price}</td>
                        <td className="py-3.5 px-4 sm:px-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => { setEditingAddOn(addon); setAddOnModalOpen(true); }}
                              className="w-7 h-7"
                              title="Edit Add-on"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="icon"
                              onClick={async () => {
                                if (!selectedServiceItem) return;
                                const res = await deleteAddOnFromService(selectedServiceItem.id, addon.id);
                                if (res.ok) {
                                  toast.success('Add-on removed');
                                } else {
                                  toast.error(`Failed to remove add-on: ${res.message || 'Error occurred'}`);
                                }
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

          {/* SECTION 3.5: Zone Availability & Pricing */}
          <div className="space-y-3 pt-4 border-t border-gray-100 w-full">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Zone Availability & Pricing</h3>
                <p className="text-xs text-gray-400 mt-0.5">Zones are managed outside this panel — pick one to control availability and price overrides for this service here.</p>
              </div>
              {selectedServiceItem && (() => {
                const configuredZoneIds = new Set(
                  zoneServiceItemConfigs.filter(c => c.serviceItemId === selectedServiceItem.id).map(c => c.zoneId)
                );
                const availableZones = zones.filter(z => !configuredZoneIds.has(z.id));
                return (
                  <div className="flex items-center gap-2">
                    <select
                      value={zonePickerId}
                      onChange={(e) => setZonePickerId(e.target.value)}
                      className="px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#C68A4C]/30 focus:border-[#C68A4C] bg-white"
                    >
                      <option value="">Select a zone...</option>
                      {availableZones.map(z => (
                        <option key={z.id} value={z.id}>{z.name} ({z.city})</option>
                      ))}
                    </select>
                    <Button
                      size="sm"
                      disabled={!zonePickerId}
                      onClick={() => {
                        const z = zones.find(zone => zone.id === zonePickerId);
                        if (!z) return;
                        setZoneForModal(z);
                        setZoneModalOpen(true);
                        setZonePickerId('');
                      }}
                      className="bg-[#1C1512] text-white hover:bg-black h-8 px-3"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Zone</span>
                    </Button>
                  </div>
                );
              })()}
            </div>

            <div className="border border-gray-100 rounded-2xl overflow-x-auto w-full">
              <table className="w-full text-left border-collapse min-w-[500px]">
                <thead>
                  <tr className="bg-[#FAF5F0] text-gray-700 text-xs font-semibold uppercase tracking-wider border-b border-[#F2E5D9]">
                    <th className="py-3 px-4 sm:px-6">Zone</th>
                    <th className="py-3 px-4 sm:px-6 text-center">Available</th>
                    <th className="py-3 px-4 sm:px-6 text-center">Surge</th>
                    <th className="py-3 px-4 sm:px-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                  {!selectedServiceItem || zoneServiceItemConfigs.filter(c => c.serviceItemId === selectedServiceItem.id).length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-xs text-gray-400">
                        No zone overrides yet. Pick a zone above to configure availability and pricing.
                      </td>
                    </tr>
                  ) : (
                    zoneServiceItemConfigs
                      .filter(c => c.serviceItemId === selectedServiceItem.id)
                      .map(cfg => {
                        const z = zones.find(zone => zone.id === cfg.zoneId);
                        if (!z) return null;
                        return (
                          <tr key={cfg.id} className="hover:bg-gray-50/50">
                            <td className="py-3 px-4 sm:px-6 font-medium">{z.name} <span className="text-gray-400">({z.city})</span></td>
                            <td className="py-3 px-4 sm:px-6 text-center">
                              <span className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-semibold ${cfg.isAvailable ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                {cfg.isAvailable ? 'Available' : 'Unavailable'}
                              </span>
                            </td>
                            <td className="py-3 px-4 sm:px-6 text-center font-semibold text-gray-900">{cfg.surgeMultiplier}x</td>
                            <td className="py-3 px-4 sm:px-6 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => { setZoneForModal(z); setZoneModalOpen(true); }}
                                  className="h-7 px-3 text-xs"
                                >
                                  Edit
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="icon"
                                  onClick={async () => {
                                    const res = await deleteZoneServiceItemConfig(cfg.id);
                                    if (res.ok) toast.success('Zone override removed');
                                    else toast.error(`Failed to remove zone override: ${res.message || 'Error occurred'}`);
                                  }}
                                  className="w-7 h-7 bg-red-50 text-red-500 hover:bg-red-100 border-none"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
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
                onClick={() => openAddSection('features', 'Feature', () => (
                  <TextItemModal
                    embedded
                    isOpen
                    titleText="Create Feature"
                    placeholderText="Enter feature content..."
                    onClose={closeAddSection}
                    onAdd={(text) => handleTextItemAdd(text, 'features')}
                  />
                ))}
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
                onClick={() => openAddSection('overview', 'Overview', () => (
                  <ImageCardModal
                    embedded
                    isOpen
                    titleText="Create Overview"
                    hasSubtitle={false}
                    onClose={closeAddSection}
                    onAdd={(item) => handleImageCardAdd(item, 'overview')}
                  />
                ))}
                className="bg-[#1C1512] text-white hover:bg-black h-8 px-3"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </Button>
            </div>

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
                onClick={() => openAddSection('procedure', 'Procedure', () => (
                  <ImageCardModal
                    embedded
                    isOpen
                    titleText="Create Procedure"
                    hasSubtitle={true}
                    onClose={closeAddSection}
                    onAdd={(item) => handleImageCardAdd(item, 'procedure')}
                  />
                ))}
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
                    <div className="text-[11px] text-gray-500 line-clamp-2">{step.subtitle}</div>
                    <div className="flex items-center justify-end gap-1.5 pt-0.5">
                      <button
                        type="button"
                        onClick={() => setImageModalConfig({ isOpen: true, title: 'Edit Procedure Step', hasSubtitle: true, targetSection: 'procedure', editIndex: idx, initialData: { title: step.title, subtitle: step.subtitle, image: step.image } })}
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
                onClick={() => openAddSection('disclaimer', 'Disclaimer', () => (
                  <TextItemModal
                    embedded
                    isOpen
                    titleText="Create Disclaimer"
                    placeholderText="Enter disclaimer point..."
                    onClose={closeAddSection}
                    onAdd={(text) => handleTextItemAdd(text, 'disclaimer')}
                  />
                ))}
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
                onClick={() => openAddSection('items', 'Items', () => (
                  <ImageCardModal
                    embedded
                    isOpen
                    titleText="Create Items"
                    hasSubtitle={false}
                    onClose={closeAddSection}
                    onAdd={(item) => handleImageCardAdd(item, 'items')}
                  />
                ))}
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
                onClick={() => openAddSection('pros', 'Expertise', () => (
                  <TextItemModal
                    embedded
                    isOpen
                    titleText="Create Expertise"
                    placeholderText="Enter professional highlight..."
                    onClose={closeAddSection}
                    onAdd={(text) => handleTextItemAdd(text, 'pros')}
                  />
                ))}
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
                onClick={() => openAddSection('care', 'Pre & Post Care', () => (
                  <TextItemModal
                    embedded
                    isOpen
                    titleText="Create Pre & Post Care"
                    placeholderText="Enter care instruction..."
                    onClose={closeAddSection}
                    onAdd={(text) => handleTextItemAdd(text, 'care')}
                  />
                ))}
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
                onClick={() => openAddSection('included', "What's Included", () => (
                  <ImageCardModal
                    embedded
                    isOpen
                    titleText="Create What's Included"
                    hasSubtitle={true}
                    onClose={closeAddSection}
                    onAdd={(item) => handleImageCardAdd(item, 'included')}
                  />
                ))}
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
                onClick={() => openAddSection('faqs', 'FAQ', () => (
                  <FaqModal
                    embedded
                    isOpen
                    titleText="Create FAQ"
                    onClose={closeAddSection}
                    onAdd={handleFaqAdd}
                  />
                ))}
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
                  <div key={index} className="p-4 border border-gray-100 rounded-2xl bg-white shadow-2xs space-y-2">
                    <div className="flex items-start gap-2">
                      <input
                        type="text"
                        placeholder="Question"
                        value={faq.question}
                        onChange={(e) => {
                          const updated = [...faqs];
                          updated[index] = { ...updated[index], question: e.target.value };
                          setFaqs(updated);
                        }}
                        onBlur={handleFaqFieldBlur}
                        className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#C68A4C]/30 focus:border-[#C68A4C] bg-white text-gray-900"
                      />
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
                        className="w-8 h-8 rounded-lg border border-red-100 bg-white hover:bg-red-50 flex items-center justify-center text-red-400 transition-colors shadow-2xs cursor-pointer flex-shrink-0"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                      </button>
                    </div>
                    <textarea
                      rows={2}
                      placeholder="Answer"
                      value={faq.answer}
                      onChange={(e) => {
                        const updated = [...faqs];
                        updated[index] = { ...updated[index], answer: e.target.value };
                        setFaqs(updated);
                      }}
                      onBlur={handleFaqFieldBlur}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#C68A4C]/30 focus:border-[#C68A4C] bg-white text-gray-700"
                    />
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
                onClick={() => openAddSection('trusted', 'Trusted & Loved', () => (
                  <TextItemModal
                    embedded
                    isOpen
                    titleText="Create Trusted & Loved"
                    placeholderText="Enter point..."
                    onClose={closeAddSection}
                    onAdd={(text) => handleTextItemAdd(text, 'trusted')}
                  />
                ))}
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

          {/* SECTION 13: Reviews */}
          <div className="space-y-4 pt-4 border-t border-gray-100 w-full">
            <div className="flex items-center justify-between">
              <h3 className="text-[20px] font-bold text-gray-900 tracking-tight">Reviews</h3>
              <Button
                size="sm"
                onClick={() => setShowReviewForm(!showReviewForm)}
                className="bg-[#1C1512] text-white hover:bg-black h-8 px-3.5 rounded-xl text-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Review</span>
              </Button>
            </div>

            {showReviewForm && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs">

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
                          <span className="text-[10px] text-gray-400">PNG, JPG up to 5MB</span>
                        </>
                      )}
                    </div>

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
                            setEditingReviewIndex(null);
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
                              await saveServiceItem({ name: serviceName || selectedServiceItem.name, reviews: updated, customReviews: updated });
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

          </div>

        </Card>

      </div>

      {/* Styled Modal Dialogs */}
      {selectedServiceItem && (
        <>
          <DurationModal
            isOpen={durationModalOpen}
            onClose={() => { setDurationModalOpen(false); setEditingDuration(null); }}
            initialData={editingDuration}
            onAdd={async (dur) => {
              const res = editingDuration
                ? await updateDurationInService(selectedServiceItem.id, editingDuration.id, dur)
                : await addDurationToService(selectedServiceItem.id, dur);
              if (res.ok) {
                toast.success(editingDuration ? 'Duration timeslot updated!' : 'Duration timeslot added!');
              } else {
                toast.error(`Failed to ${editingDuration ? 'update' : 'add'} timeslot: ${res.message || 'Error occurred'}`);
              }
              setEditingDuration(null);
            }}
          />

          <PackModal
            isOpen={packModalOpen}
            onClose={() => { setPackModalOpen(false); setEditingPack(null); }}
            initialData={editingPack}
            durations={serviceDurations}
            onAdd={async (pkg) => {
              const res = editingPack
                ? await updatePackageInService(selectedServiceItem.id, editingPack.id, pkg)
                : await addPackageToService(selectedServiceItem.id, pkg);
              if (res.ok) {
                toast.success(editingPack ? 'Session pack updated!' : 'Session pack added!');
              } else {
                toast.error(`Failed to ${editingPack ? 'update' : 'add'} session pack: ${res.message || 'Error occurred'}`);
              }
              setEditingPack(null);
            }}
          />

          <AddOnModal
            isOpen={addOnModalOpen}
            onClose={() => { setAddOnModalOpen(false); setEditingAddOn(null); }}
            initialData={editingAddOn}
            onAdd={async (addon) => {
              const res = editingAddOn
                ? await updateAddOnInService(selectedServiceItem.id, editingAddOn.id, addon)
                : await addAddOnToService(selectedServiceItem.id, addon);
              if (res.ok) {
                toast.success(editingAddOn ? 'Add-on updated!' : 'Add-on added!');
              } else {
                toast.error(`Failed to ${editingAddOn ? 'update' : 'add'} add-on: ${res.message || 'Error occurred'}`);
              }
              setEditingAddOn(null);
            }}
          />

          <ZoneOverrideModal
            isOpen={zoneModalOpen}
            onClose={() => { setZoneModalOpen(false); setZoneForModal(null); }}
            zone={zoneForModal}
            serviceItem={selectedServiceItem}
          />

          <ImageCardModal
            isOpen={imageModalConfig.isOpen}
            titleText={imageModalConfig.title}
            hasSubtitle={imageModalConfig.hasSubtitle}
            initialData={imageModalConfig.initialData}
            showLibraryCheckbox={imageModalConfig.editIndex === undefined}
            onClose={() => setImageModalConfig(prev => ({ ...prev, isOpen: false, editIndex: undefined, initialData: undefined }))}
            onAdd={handleImageCardAdd}
          />

          <TextItemModal
            isOpen={textModalConfig.isOpen}
            titleText={textModalConfig.title}
            placeholderText={textModalConfig.placeholder}
            initialValue={textModalConfig.initialValue}
            showLibraryCheckbox={textModalConfig.editIndex === undefined}
            onClose={() => setTextModalConfig(prev => ({ ...prev, isOpen: false, editIndex: undefined, initialValue: undefined }))}
            onAdd={handleTextItemAdd}
          />

        </>
      )}

      {/* Add -> Create/Library wizard shell — see openAddSection/handleLibrarySave above. FAQ has
          no separate "edit" modal (edits happen inline in its list), so it only ever needs the
          embedded instance rendered inside this shell — no standalone <FaqModal> here. */}
      <AddSectionModal
        isOpen={!!addSection?.isOpen}
        label={addSection?.label ?? ''}
        onClose={closeAddSection}
        renderCreate={addSection?.renderCreate ?? (() => null)}
        renderLibrary={() => {
          if (!addSection) return null;
          const section = librarySections[addSection.sectionKey];
          return (
            <LibraryPickerModal
              embedded
              isOpen
              label={section.label}
              columns={section.columns}
              rows={section.rows}
              categories={section.categories}
              loading={section.loading}
              emptyMessage={section.emptyMessage}
              onClose={closeAddSection}
              onSave={(payloads) => handleLibrarySave(addSection.sectionKey, payloads)}
            />
          );
        }}
      />

    </div>
  );
}
