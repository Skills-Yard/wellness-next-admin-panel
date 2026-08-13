'use client';

import React, { useState } from 'react';
import { Info } from 'lucide-react';
import { User, UserDeviceToken } from '../../../types/user';
import { Card } from '../../ui/card';

interface UserDevicesTabProps {
  user: User;
  onRevokeDevice?: (tokenId: string) => Promise<void>;
}

export default function UserDevicesTab({ user, onRevokeDevice }: UserDevicesTabProps) {
  const defaultDevices: UserDeviceToken[] = [
    {
      id: 'dev-1',
      userId: user.id,
      fcmToken: 'fcm-1',
      deviceType: 'IOS',
      deviceName: 'iPhone 14',
      deviceModel: 'I Phone 14 Pro',
      isActive: true,
      lastUsedAt: '2026-05-10T10:30:00Z',
      createdAt: '2026-05-10T10:30:00Z',
      updatedAt: '2026-05-10T10:30:00Z',
    },
    {
      id: 'dev-2',
      userId: user.id,
      fcmToken: 'fcm-2',
      deviceType: 'Web',
      deviceName: 'Safari on Mac',
      deviceModel: 'MacBook Air',
      isActive: true,
      lastUsedAt: '2026-05-10T10:30:00Z',
      createdAt: '2026-05-10T10:30:00Z',
      updatedAt: '2026-05-10T10:30:00Z',
    },
    {
      id: 'dev-3',
      userId: user.id,
      fcmToken: 'fcm-3',
      deviceType: 'Android',
      deviceName: 'Redmi Note 13',
      deviceModel: 'Redmi Note 13',
      isActive: false,
      lastUsedAt: '2026-05-10T10:30:00Z',
      createdAt: '2026-05-10T10:30:00Z',
      updatedAt: '2026-05-10T10:30:00Z',
    },
  ];

  const devices = user.devices && user.devices.length > 0 ? user.devices : defaultDevices;
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const handleRevoke = async (id: string) => {
    if (!confirm('Are you sure you want to revoke this device session?')) return;
    setRevokingId(id);
    try {
      if (onRevokeDevice) {
        await onRevokeDevice(id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRevokingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="p-6 bg-white border-gray-100 shadow-xs space-y-6">
        <h3 className="text-sm font-bold text-gray-900">Signed In Devices</h3>

        <div className="overflow-x-auto border border-gray-100 rounded-xl">
          <table className="w-full text-left border-collapse min-w-[750px]">
            <thead>
              <tr className="bg-[#FAF8F5] border-b border-gray-100 text-[11px] font-semibold text-gray-600 tracking-wider">
                <th className="py-3 px-4">Device</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Device Name</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Last Used</th>
                <th className="py-3 px-4">Added On</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {devices.map((device) => {
                const dateLastUsed = device.lastUsedAt
                  ? new Date(device.lastUsedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                  : '—';
                const dateAddedOn = device.createdAt
                  ? new Date(device.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                  : '—';

                return (
                  <tr key={device.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-4 px-4 font-bold text-gray-900">
                      {device.deviceName || 'Unknown Device'}
                    </td>
                    <td className="py-4 px-4 text-gray-500 font-medium">
                      {device.deviceType || 'Mobile'}
                    </td>
                    <td className="py-4 px-4 text-gray-600">
                      {device.deviceModel || device.deviceName}
                    </td>
                    <td className="py-4 px-4">
                      {device.isActive ? (
                        <span className="inline-flex px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 bg-emerald-100/70 rounded-full border border-emerald-200/50">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex px-2.5 py-0.5 text-[11px] font-semibold text-rose-700 bg-rose-100/70 rounded-full border border-rose-200/50">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-gray-600">
                      {dateLastUsed}
                    </td>
                    <td className="py-4 px-4 text-gray-600">
                      {dateAddedOn}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <button
                        onClick={() => handleRevoke(device.id)}
                        disabled={revokingId === device.id}
                        className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer disabled:opacity-50"
                      >
                        {revokingId === device.id ? 'Revoking...' : 'Revoke'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Warning note */}
      <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium px-1">
        <Info className="w-4 h-4 text-gray-400" />
        <span>Revoking a device will sign the user out from that session.</span>
      </div>
    </div>
  );
}
