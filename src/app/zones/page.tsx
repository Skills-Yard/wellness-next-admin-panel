'use client';

import { useCatalogue } from '../../contexts/CatalogueContext';
import ZonesView from '../../components/zones/ZonesView';
import ZoneDetailView from '../../components/zones/ZoneDetailView';

export default function ZonesPage() {
  const { selectedZone } = useCatalogue();

  return selectedZone ? <ZoneDetailView /> : <ZonesView />;
}
