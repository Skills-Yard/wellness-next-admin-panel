'use client';

import React from 'react';
import { LayoutGrid, ListTree, Sparkles, CheckCircle2 } from 'lucide-react';
import { Card } from '../ui/card';
import { useCatalogue } from '../../contexts/CatalogueContext';

// Catalogue composition doesn't need its own fetch — CatalogueContext already loads categories/
// sub-categories/service items for the whole app on mount, so this is free.
export default function CatalogueSnapshot() {
  const { categories, subCategories, serviceItems } = useCatalogue();

  const activeServices = serviceItems.filter((s) => s.isActive).length;

  const chips = [
    { label: 'Categories', value: categories.length, icon: LayoutGrid },
    { label: 'Sub-Categories', value: subCategories.length, icon: ListTree },
    { label: 'Total Services', value: serviceItems.length, icon: Sparkles },
    { label: 'Active Services', value: activeServices, icon: CheckCircle2 },
  ];

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Catalogue Snapshot</h3>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {chips.map((c) => (
          <div key={c.label} className="flex items-center gap-2.5 rounded-xl bg-[#FAF5F0] border border-[#F2E5D9] px-3 py-2.5">
            <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center text-[#C68A4C] flex-shrink-0">
              <c.icon className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-bold text-gray-900 leading-tight">{c.value.toLocaleString('en-IN')}</div>
              <div className="text-[10px] text-gray-400 truncate">{c.label}</div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
