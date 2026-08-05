'use client';

import { CampaignProvider } from '../../contexts/CampaignContext';
import CampaignsView from '../../components/campaigns/CampaignsView';
import CampaignModal from '../../components/campaigns/CampaignModal';

export default function CampaignsPage() {
  return (
    <CampaignProvider>
      <CampaignsView />
      <CampaignModal />
    </CampaignProvider>
  );
}
