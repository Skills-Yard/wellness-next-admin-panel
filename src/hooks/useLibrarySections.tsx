'use client';

import { useMemo } from 'react';
import { useCatalogue } from '../contexts/CatalogueContext';
import { ServiceItem, ImageCardItem, ServiceDuration, ServicePackage, ServiceAddOn, FaqItem } from '../types/catalogue';
import { LibraryColumn, LibraryRow } from '../components/catalogue/LibraryPickerModal';

export type LibrarySectionKey =
  | 'duration' | 'pack' | 'addon'
  | 'features' | 'overview' | 'procedure' | 'disclaimer' | 'items'
  | 'pros' | 'care' | 'included' | 'faqs' | 'trusted';

export interface LibrarySection {
  label: string;
  columns: LibraryColumn[];
  rows: LibraryRow[];
  categories: { id: string; name: string }[];
  loading: boolean;
  emptyMessage: string;
}

// Payload shapes each section's LibraryRow.payload carries — what handleLibrarySave (in
// ServiceDetailView) receives back when a row is picked and "Save Selected" is clicked.
export interface TextLibraryPayload { text: string }
export interface ImageLibraryPayload { title: string; subtitle?: string; image: string }
export interface FaqLibraryPayload { question: string; answer: string }
export interface DurationLibraryPayload { label: string; durationMinutes: number; price: number; discountedPrice?: number }
export interface PackLibraryPayload { label: string; sessions: number; savingsPercent: number }
export interface AddOnLibraryPayload {
  name: string; price: number; imageKey: string; description?: string; extraMinutes?: number; isActive?: boolean;
}

// There's no backend "content library" table for these 10 JSON-column sections — this aggregates
// real, already-loaded data instead of inventing any: every service's features/overview/etc are
// scanned, de-duplicated (case-insensitive), and counted into "Used in N services". Duration/Pack/
// Add-On reuse the existing cross-service admin "get all" lists (allServiceDurations etc.) the
// same way the old "pick from existing" dropdowns did. No Badge column anywhere — that's not a
// real DB field, so (per instruction) it's simply left out rather than faked.
export function useLibrarySections(): Record<LibrarySectionKey, LibrarySection> {
  const {
    serviceItems,
    categories,
    subCategories,
    allServiceDurations,
    allServicePackages,
    allServiceAddOns,
    allServiceDurationsLoading,
    allServicePackagesLoading,
    allServiceAddOnsLoading,
  } = useCatalogue();

  return useMemo(() => {
    const categoryOptions = categories.map((c) => ({ id: c.id, name: c.name }));

    // serviceItemId -> categoryId, via subCategory -> category (neither list is embedded on the
    // duration/package/add-on rows themselves, so this is built the same way the rest of this
    // file already resolves a service's category).
    const serviceCategoryMap = new Map<string, string>();
    serviceItems.forEach((si) => {
      const sub = subCategories.find((s) => s.id === si.subCategoryId);
      if (sub) serviceCategoryMap.set(si.id, sub.categoryId);
    });

    const categoryIdsFor = (serviceItemId?: string): string[] => {
      if (!serviceItemId) return [];
      const catId = serviceCategoryMap.get(serviceItemId);
      return catId ? [catId] : [];
    };

    // ---- Text sections (features, skilledPros, prePostCare, disclaimer, trustedLoved) ----
    const collectText = (pick: (si: ServiceItem) => string[] | undefined) => {
      const byKey = new Map<string, { text: string; usedIn: number; categoryIds: Set<string> }>();
      serviceItems.forEach((si) => {
        const arr = pick(si) || [];
        const catId = serviceCategoryMap.get(si.id);
        const seenInThisItem = new Set<string>();
        arr.forEach((raw) => {
          const text = (raw || '').trim();
          if (!text) return;
          const key = text.toLowerCase();
          if (!byKey.has(key)) byKey.set(key, { text, usedIn: 0, categoryIds: new Set() });
          const entry = byKey.get(key)!;
          if (!seenInThisItem.has(key)) {
            entry.usedIn += 1;
            seenInThisItem.add(key);
          }
          if (catId) entry.categoryIds.add(catId);
        });
      });
      return byKey;
    };

    const textColumns = (label: string): LibraryColumn[] => [
      { key: 'text', label },
      { key: 'usedIn', label: 'Used in', align: 'right' },
    ];

    const textRows = (byKey: Map<string, { text: string; usedIn: number; categoryIds: Set<string> }>): LibraryRow[] =>
      Array.from(byKey.entries()).map(([key, entry]) => ({
        id: key,
        categoryIds: Array.from(entry.categoryIds),
        searchText: entry.text,
        cells: {
          text: entry.text,
          usedIn: `${entry.usedIn} Service${entry.usedIn === 1 ? '' : 's'}`,
        },
        payload: { text: entry.text } as TextLibraryPayload,
      }));

    // ---- Image sections (overview gallery, procedureSteps, itemsUsed, whatsIncluded) ----
    const collectImage = (pick: (si: ServiceItem) => ImageCardItem[] | undefined) => {
      const byKey = new Map<string, { title: string; subtitle?: string; image: string; usedIn: number; categoryIds: Set<string> }>();
      serviceItems.forEach((si) => {
        const arr = pick(si) || [];
        const catId = serviceCategoryMap.get(si.id);
        const seenInThisItem = new Set<string>();
        arr.forEach((item) => {
          const title = (item?.title || '').trim();
          const image = item?.image || '';
          if (!title || !image) return;
          const key = `${title.toLowerCase()}::${image}`;
          if (!byKey.has(key)) byKey.set(key, { title, subtitle: item.subtitle, image, usedIn: 0, categoryIds: new Set() });
          const entry = byKey.get(key)!;
          if (!seenInThisItem.has(key)) {
            entry.usedIn += 1;
            seenInThisItem.add(key);
          }
          if (catId) entry.categoryIds.add(catId);
        });
      });
      return byKey;
    };

    const imageThumb = (image: string, title: string) => (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={image} alt={title} className="w-9 h-9 rounded-lg object-cover border border-gray-100" />
    );

    const imageRowsWithUsedIn = (
      byKey: Map<string, { title: string; subtitle?: string; image: string; usedIn: number; categoryIds: Set<string> }>
    ): LibraryRow[] =>
      Array.from(byKey.entries()).map(([key, entry]) => ({
        id: key,
        categoryIds: Array.from(entry.categoryIds),
        searchText: entry.title,
        cells: {
          image: imageThumb(entry.image, entry.title),
          title: entry.title,
          usedIn: `${entry.usedIn} Service${entry.usedIn === 1 ? '' : 's'}`,
        },
        payload: { title: entry.title, image: entry.image } as ImageLibraryPayload,
      }));

    const imageRowsWithSubtitle = (
      byKey: Map<string, { title: string; subtitle?: string; image: string; usedIn: number; categoryIds: Set<string> }>
    ): LibraryRow[] =>
      Array.from(byKey.entries()).map(([key, entry]) => ({
        id: key,
        categoryIds: Array.from(entry.categoryIds),
        searchText: `${entry.title} ${entry.subtitle || ''}`,
        cells: {
          image: imageThumb(entry.image, entry.title),
          title: entry.title,
          subtitle: <span className="text-gray-500 text-xs">{entry.subtitle}</span>,
        },
        payload: { title: entry.title, subtitle: entry.subtitle, image: entry.image } as ImageLibraryPayload,
      }));

    // ---- FAQs ----
    const faqByKey = new Map<string, { question: string; answer: string; usedIn: number; categoryIds: Set<string> }>();
    serviceItems.forEach((si) => {
      const arr = (si.faqs || []) as FaqItem[];
      const catId = serviceCategoryMap.get(si.id);
      const seenInThisItem = new Set<string>();
      arr.forEach((faq) => {
        const question = (faq?.question || '').trim();
        if (!question) return;
        const key = question.toLowerCase();
        if (!faqByKey.has(key)) faqByKey.set(key, { question, answer: faq.answer || '', usedIn: 0, categoryIds: new Set() });
        const entry = faqByKey.get(key)!;
        if (!seenInThisItem.has(key)) {
          entry.usedIn += 1;
          seenInThisItem.add(key);
        }
        if (catId) entry.categoryIds.add(catId);
      });
    });
    const faqRows: LibraryRow[] = Array.from(faqByKey.entries()).map(([key, entry]) => ({
      id: key,
      categoryIds: Array.from(entry.categoryIds),
      searchText: `${entry.question} ${entry.answer}`,
      cells: {
        question: entry.question,
        usedIn: `${entry.usedIn} Service${entry.usedIn === 1 ? '' : 's'}`,
      },
      payload: { question: entry.question, answer: entry.answer } as FaqLibraryPayload,
    }));

    // ---- Duration / Pack / Add-On (real DB rows via the admin "get all" endpoints) ----
    const durationRows: LibraryRow[] = allServiceDurations.map((d: ServiceDuration) => {
      const hasDiscount = d.discountedPrice != null && d.discountedPrice < d.price;
      return {
        id: d.id,
        categoryIds: categoryIdsFor(d.serviceItem?.id),
        searchText: `${d.label} ${d.serviceItem?.name || ''}`,
        cells: {
          duration: d.label,
          price: hasDiscount ? (
            <span>
              ₹{d.discountedPrice!.toLocaleString()}{' '}
              <span className="text-gray-400 line-through text-xs">₹{d.price.toLocaleString()}</span>
            </span>
          ) : (
            `₹${d.price.toLocaleString()}`
          ),
        },
        payload: {
          label: d.label,
          durationMinutes: d.durationMinutes,
          price: d.price,
          discountedPrice: d.discountedPrice ?? undefined,
        } as DurationLibraryPayload,
      };
    });

    const packRows: LibraryRow[] = allServicePackages.map((p: ServicePackage) => ({
      id: p.id,
      categoryIds: categoryIdsFor(p.serviceItem?.id),
      searchText: `${p.label} ${p.serviceItem?.name || ''}`,
      cells: {
        session: p.sessions,
        price: `₹${p.price.toLocaleString()}`,
        savings: p.savings != null && p.savings > 0 ? `₹${p.savings.toLocaleString()} (${p.savingsPercent ?? 0}%)` : '–',
      },
      payload: {
        label: p.label,
        sessions: p.sessions,
        savingsPercent: p.savingsPercent ?? 0,
      } as PackLibraryPayload,
    }));

    const addonRows: LibraryRow[] = allServiceAddOns.map((a: ServiceAddOn) => ({
      id: a.id,
      categoryIds: categoryIdsFor(a.serviceItem?.id),
      searchText: `${a.name} ${a.serviceItem?.name || ''}`,
      cells: {
        name: (
          <span className="flex items-center gap-2.5">
            {a.imageKey && imageThumb(a.imageKey, a.name)}
            {a.name}
          </span>
        ),
        price: `₹${a.price.toLocaleString()}`,
        duration: a.extraMinutes ? `${a.extraMinutes} min` : '–',
      },
      payload: {
        name: a.name,
        price: a.price,
        imageKey: a.imageKey,
        description: a.description,
        extraMinutes: a.extraMinutes,
        isActive: a.isActive,
      } as AddOnLibraryPayload,
    }));

    return {
      duration: {
        label: 'Duration',
        columns: [
          { key: 'duration', label: 'Duration' },
          { key: 'price', label: 'Price (₹)', align: 'right' },
        ],
        rows: durationRows,
        categories: categoryOptions,
        loading: allServiceDurationsLoading,
        emptyMessage: 'No durations in the library yet.',
      },
      pack: {
        label: 'Pack',
        columns: [
          { key: 'session', label: 'Session' },
          { key: 'price', label: 'Price (₹)', align: 'right' },
          { key: 'savings', label: 'Savings' },
        ],
        rows: packRows,
        categories: categoryOptions,
        loading: allServicePackagesLoading,
        emptyMessage: 'No packs in the library yet.',
      },
      addon: {
        label: 'Add-On',
        columns: [
          { key: 'name', label: 'Add-on Name' },
          { key: 'price', label: 'Price (₹)', align: 'right' },
          { key: 'duration', label: 'Duration' },
        ],
        rows: addonRows,
        categories: categoryOptions,
        loading: allServiceAddOnsLoading,
        emptyMessage: 'No add-ons in the library yet.',
      },
      features: {
        label: 'Feature',
        columns: textColumns('Feature'),
        rows: textRows(collectText((si) => si.features)),
        categories: categoryOptions,
        loading: false,
        emptyMessage: 'No features in the library yet.',
      },
      overview: {
        label: 'Overview',
        columns: [
          { key: 'image', label: 'Image' },
          { key: 'title', label: 'Title' },
          { key: 'usedIn', label: 'Used in', align: 'right' },
        ],
        rows: imageRowsWithUsedIn(collectImage((si) => si.overview?.gallery)),
        categories: categoryOptions,
        loading: false,
        emptyMessage: 'No overview items in the library yet.',
      },
      procedure: {
        label: 'Procedure',
        columns: [
          { key: 'image', label: 'Image' },
          { key: 'title', label: 'Title' },
          { key: 'subtitle', label: 'Subtitle' },
        ],
        rows: imageRowsWithSubtitle(collectImage((si) => si.procedureSteps)),
        categories: categoryOptions,
        loading: false,
        emptyMessage: 'No procedure steps in the library yet.',
      },
      disclaimer: {
        label: 'Disclaimer',
        columns: textColumns('Disclaimer'),
        rows: textRows(collectText((si) => si.disclaimer)),
        categories: categoryOptions,
        loading: false,
        emptyMessage: 'No disclaimers in the library yet.',
      },
      items: {
        label: 'Items',
        columns: [
          { key: 'image', label: 'Image' },
          { key: 'title', label: 'Title' },
          { key: 'usedIn', label: 'Used in', align: 'right' },
        ],
        rows: imageRowsWithUsedIn(collectImage((si) => si.itemsUsed)),
        categories: categoryOptions,
        loading: false,
        emptyMessage: 'No items in the library yet.',
      },
      pros: {
        label: 'Expertise',
        columns: textColumns('Expertise'),
        rows: textRows(collectText((si) => si.skilledPros)),
        categories: categoryOptions,
        loading: false,
        emptyMessage: 'No expertise highlights in the library yet.',
      },
      care: {
        label: 'Pre & Post Care',
        columns: textColumns('Pre & Post Care'),
        rows: textRows(collectText((si) => si.prePostCare)),
        categories: categoryOptions,
        loading: false,
        emptyMessage: 'No pre & post care points in the library yet.',
      },
      included: {
        label: "What's Included",
        columns: [
          { key: 'image', label: 'Image' },
          { key: 'title', label: 'Title' },
          { key: 'subtitle', label: 'Subtitle' },
        ],
        rows: imageRowsWithSubtitle(collectImage((si) => si.whatsIncluded)),
        categories: categoryOptions,
        loading: false,
        emptyMessage: "No included items in the library yet.",
      },
      faqs: {
        label: 'FAQ',
        columns: [
          { key: 'question', label: 'Question' },
          { key: 'usedIn', label: 'Used in', align: 'right' },
        ],
        rows: faqRows,
        categories: categoryOptions,
        loading: false,
        emptyMessage: 'No FAQs in the library yet.',
      },
      trusted: {
        label: 'Trusted & Loved',
        columns: textColumns('Highlight'),
        rows: textRows(collectText((si) => si.trustedLoved)),
        categories: categoryOptions,
        loading: false,
        emptyMessage: 'No highlights in the library yet.',
      },
    };
  }, [
    serviceItems,
    categories,
    subCategories,
    allServiceDurations,
    allServicePackages,
    allServiceAddOns,
    allServiceDurationsLoading,
    allServicePackagesLoading,
    allServiceAddOnsLoading,
  ]);
}
