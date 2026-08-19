'use client';

import React from 'react';
import { Settings } from 'lucide-react';
import ComingSoon from '../../components/common/ComingSoon';

export default function SettingsPage() {
  return (
    <ComingSoon
      icon={Settings}
      title="Settings"
      description="Admin panel configuration, notification preferences, and system settings are on the way."
    />
  );
}
