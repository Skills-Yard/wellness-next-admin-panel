'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Bell } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import BroadcastHistoryTable from '../../../components/notifications/BroadcastHistoryTable';

export default function NotificationsHistoryPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#FAF5F0] text-[#C68A4C] flex items-center justify-center">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Notification history</h1>
            <p className="text-xs text-gray-500">Past broadcasts sent to users and partners.</p>
          </div>
        </div>
        <Link href="/notifications">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-3.5 h-3.5" />
            Compose
          </Button>
        </Link>
      </div>

      <BroadcastHistoryTable />
    </div>
  );
}
