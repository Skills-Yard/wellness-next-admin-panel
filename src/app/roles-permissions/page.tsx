'use client';

import React from 'react';
import { Shield } from 'lucide-react';
import ComingSoon from '../../components/common/ComingSoon';

export default function RolesPermissionsPage() {
  return (
    <ComingSoon
      icon={Shield}
      title="Roles & Permissions"
      description="Fine-grained admin roles and permission controls are coming soon."
    />
  );
}
