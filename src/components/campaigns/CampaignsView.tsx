'use client';

import React from 'react';
import { Plus, Edit3, Trash2, Loader2, Megaphone } from 'lucide-react';
import { useCampaign } from '../../contexts/CampaignContext';
import { useCatalogue } from '../../contexts/CatalogueContext';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card } from '../ui/card';
import { toast } from 'react-toastify';
import { PromotionalCampaign } from '../../types/catalogue';

const TARGET_LABEL: Record<PromotionalCampaign['targetType'], string> = {
  GLOBAL: 'Global',
  CATEGORY: 'Category',
  SUBCATEGORY: 'Sub-Category',
};

export default function CampaignsView() {
  const { loading, campaigns, openCreateModal, openEditModal, updateCampaignStatus, deleteCampaign } = useCampaign();
  const { categories, subCategories, serviceItems, zones } = useCatalogue();

  const resolveTarget = (c: PromotionalCampaign) => {
    if (c.targetType === 'CATEGORY') {
      return categories.find(cat => cat.id === c.categoryId)?.name || 'Unknown category';
    }
    if (c.targetType === 'SUBCATEGORY') {
      return subCategories.find(s => s.id === c.subCategoryId)?.name || 'Unknown sub-category';
    }
    return 'All categories';
  };

  const resolveServiceItem = (c: PromotionalCampaign) =>
    c.serviceItemId ? serviceItems.find(s => s.id === c.serviceItemId)?.name : null;

  const resolveZone = (c: PromotionalCampaign) =>
    c.zoneId ? zones.find(z => z.id === c.zoneId) : null;

  const handleToggleStatus = async (c: PromotionalCampaign) => {
    const res = await updateCampaignStatus(c.id, !c.isActive);
    if (res.ok) {
      toast.success(c.isActive ? 'Campaign paused' : 'Campaign activated');
    } else {
      toast.error(`Failed to update status: ${res.message || 'Error occurred'}`);
    }
  };

  const handleDelete = async (c: PromotionalCampaign) => {
    const res = await deleteCampaign(c.id);
    if (res.ok) {
      toast.success('Campaign deleted');
    } else {
      toast.error(`Failed to delete campaign: ${res.message || 'Error occurred'}`);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12 animate-in fade-in duration-300 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">Campaigns</h1>
          <p className="text-xs md:text-sm text-gray-500 mt-0.5">
            Promotional banners targeted at categories, sub-categories or service items — optionally scoped to a zone.
          </p>
        </div>
        <Button onClick={openCreateModal} className="self-start sm:self-auto bg-[#1C1512] hover:bg-black text-white rounded-xl shadow-xs">
          <Plus className="w-4 h-4" />
          <span>New Campaign</span>
        </Button>
      </div>

      <Card className="w-full">
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center text-gray-400 gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-[#C68A4C]" />
            <span className="text-sm">Loading campaigns from backend...</span>
          </div>
        ) : campaigns.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center text-center p-6 space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#FAF5F0] text-[#C68A4C] flex items-center justify-center">
              <Megaphone className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-gray-800">No Campaigns Yet</h3>
            <p className="text-xs text-gray-500 max-w-sm">
              Create a promotional banner to spotlight a category, sub-category or service item — optionally in one zone only.
            </p>
            <Button onClick={openCreateModal} size="sm" className="mt-2 bg-[#1C1512] text-white">
              + Create Campaign
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-[#FAF5F0] text-gray-700 text-xs font-semibold uppercase tracking-wider border-b border-[#F2E5D9]">
                  <th className="py-4 px-4 sm:px-6">Campaign</th>
                  <th className="py-4 px-4 sm:px-6">Type</th>
                  <th className="py-4 px-4 sm:px-6">Target</th>
                  <th className="py-4 px-4 sm:px-6">Zone</th>
                  <th className="py-4 px-4 sm:px-6 text-center">Order</th>
                  <th className="py-4 px-4 sm:px-6 text-center">Status</th>
                  <th className="py-4 px-4 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                {campaigns.map((c) => {
                  const zone = resolveZone(c);
                  const serviceItemName = resolveServiceItem(c);
                  return (
                    <tr key={c.id} className="hover:bg-gray-50/50">
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          {c.cdnUrl && c.mediaType === 'IMAGE' ? (
                            <img src={c.cdnUrl} alt={c.title || 'Campaign'} className="w-12 h-9 rounded-lg object-cover shrink-0 border border-gray-100" />
                          ) : (
                            <div className="w-12 h-9 rounded-lg bg-[#FAF5F0] flex items-center justify-center text-[#C68A4C] shrink-0">
                              <Megaphone className="w-4 h-4" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 truncate">{c.title || 'Untitled campaign'}</p>
                            {c.subtitle && <p className="text-xs text-gray-400 truncate">{c.subtitle}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 sm:px-6 text-xs font-medium text-gray-600">{c.type.replace(/_/g, ' ')}</td>
                      <td className="py-3.5 px-4 sm:px-6">
                        <p className="text-xs font-medium text-gray-800">{TARGET_LABEL[c.targetType]}: {resolveTarget(c)}</p>
                        {serviceItemName && <p className="text-[11px] text-gray-400">Service: {serviceItemName}</p>}
                      </td>
                      <td className="py-3.5 px-4 sm:px-6 text-xs text-gray-600">
                        {zone ? `${zone.name} (${zone.city})` : 'All zones'}
                      </td>
                      <td className="py-3.5 px-4 sm:px-6 text-center text-gray-500">{c.displayOrder}</td>
                      <td className="py-3.5 px-4 sm:px-6 text-center">
                        <button onClick={() => handleToggleStatus(c)}>
                          <Badge variant={c.isActive ? 'active' : 'inactive'}>{c.isActive ? 'Active' : 'Paused'}</Badge>
                        </button>
                      </td>
                      <td className="py-3.5 px-4 sm:px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="outline" size="icon" onClick={() => openEditModal(c)} className="w-7 h-7">
                            <Edit3 className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => handleDelete(c)}
                            className="w-7 h-7 bg-red-50 text-red-500 hover:bg-red-100 border-none"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
