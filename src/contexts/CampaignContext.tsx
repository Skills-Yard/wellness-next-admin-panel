'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { PromotionalCampaign } from '../types/catalogue';
import { useAuth } from './AuthContext';
import {
  getCampaignsServerAction,
  saveCampaignServerAction,
  updateCampaignStatusServerAction,
  deleteCampaignServerAction,
  CampaignPayload,
} from '../lib/server-actions/campaign';

type ActionResponse = { ok: boolean; message?: string };

interface CampaignContextType {
  loading: boolean;
  campaigns: PromotionalCampaign[];
  refreshCampaigns: () => Promise<void>;

  modalOpen: boolean;
  editingCampaign: PromotionalCampaign | null;
  openCreateModal: () => void;
  openEditModal: (campaign: PromotionalCampaign) => void;
  closeModal: () => void;

  saveCampaign: (id: string | null, payload: CampaignPayload) => Promise<ActionResponse>;
  updateCampaignStatus: (id: string, isActive: boolean) => Promise<ActionResponse>;
  deleteCampaign: (id: string) => Promise<ActionResponse>;
}

const CampaignContext = createContext<CampaignContextType | undefined>(undefined);

export const CampaignProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<PromotionalCampaign[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<PromotionalCampaign | null>(null);

  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const refreshCampaigns = async () => {
    setLoading(true);
    try {
      const data = await getCampaignsServerAction();
      setCampaigns(data);
    } catch (err) {
      console.error('Error fetching campaigns:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (isAuthenticated) {
      refreshCampaigns();
    } else {
      setCampaigns([]);
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, authLoading]);

  const openCreateModal = () => {
    setEditingCampaign(null);
    setModalOpen(true);
  };

  const openEditModal = (campaign: PromotionalCampaign) => {
    setEditingCampaign(campaign);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingCampaign(null);
  };

  // Each patches just this one campaign locally from the response the write already returns —
  // no refetch of the whole list, and no page-wide skeleton flash from `loading` flipping.
  const saveCampaign = async (id: string | null, payload: CampaignPayload): Promise<ActionResponse> => {
    const res = await saveCampaignServerAction(id, payload);
    if (res.ok) {
      setCampaigns(prev => (id ? prev.map(c => (c.id === id ? res.data : c)) : [...prev, res.data]));
      return { ok: true };
    }
    return { ok: false, message: res.message };
  };

  const updateCampaignStatus = async (id: string, isActive: boolean): Promise<ActionResponse> => {
    const res = await updateCampaignStatusServerAction(id, isActive);
    if (res.ok) {
      setCampaigns(prev => prev.map(c => (c.id === id ? { ...c, isActive } : c)));
      return { ok: true };
    }
    return { ok: false, message: res.message };
  };

  const deleteCampaign = async (id: string): Promise<ActionResponse> => {
    const res = await deleteCampaignServerAction(id);
    if (res.ok) {
      setCampaigns(prev => prev.filter(c => c.id !== id));
      return { ok: true };
    }
    return { ok: false, message: res.message };
  };

  return (
    <CampaignContext.Provider value={{
      loading,
      campaigns,
      refreshCampaigns,
      modalOpen,
      editingCampaign,
      openCreateModal,
      openEditModal,
      closeModal,
      saveCampaign,
      updateCampaignStatus,
      deleteCampaign,
    }}>
      {children}
    </CampaignContext.Provider>
  );
};

export const useCampaign = () => {
  const context = useContext(CampaignContext);
  if (!context) throw new Error('useCampaign must be used within CampaignProvider');
  return context;
};
