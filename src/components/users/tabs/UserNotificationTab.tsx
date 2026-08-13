'use client';

import React, { useState } from 'react';
import { MessageSquare, Mail, Bell, Megaphone, Info } from 'lucide-react';
import { User, UserNotificationPreference } from '../../../types/user';
import { Card } from '../../ui/card';

interface UserNotificationTabProps {
  user: User;
  onUpdatePreferences?: (prefs: Partial<UserNotificationPreference>) => Promise<void>;
}

export default function UserNotificationTab({
  user,
  onUpdatePreferences,
}: UserNotificationTabProps) {
  const prefs = user.preferences || {
    whatsappOptIn: true,
    emailOptIn: true,
    pushOptIn: true,
    promotionalOptIn: true,
  };

  const [whatsapp, setWhatsapp] = useState(prefs.whatsappOptIn);
  const [email, setEmail] = useState(prefs.emailOptIn);
  const [push, setPush] = useState(prefs.pushOptIn);
  const [promotional, setPromotional] = useState(prefs.promotionalOptIn);
  const [saving, setSaving] = useState(false);

  const handleToggle = async (key: string, currentValue: boolean) => {
    const newValue = !currentValue;
    if (key === 'whatsappOptIn') setWhatsapp(newValue);
    if (key === 'emailOptIn') setEmail(newValue);
    if (key === 'pushOptIn') setPush(newValue);
    if (key === 'promotionalOptIn') setPromotional(newValue);

    setSaving(true);
    try {
      if (onUpdatePreferences) {
        await onUpdatePreferences({ [key]: newValue });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="p-6 bg-white border-gray-100 shadow-xs space-y-6 max-w-3xl">
        <h3 className="text-sm font-bold text-gray-900">Notification Preferences</h3>

        <div className="space-y-6">
          {/* WhatsApp */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                <MessageSquare className="w-5 h-5 fill-emerald-100" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-900">WhatsApp</p>
                <p className="text-xs text-gray-500 mt-0.5">Receive notification on WhatsApp</p>
              </div>
            </div>

            <button
              onClick={() => handleToggle('whatsappOptIn', whatsapp)}
              className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-200 cursor-pointer ${
                whatsapp ? 'bg-emerald-500 justify-end' : 'bg-gray-200 justify-start'
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-white shadow-md transform transition-transform" />
            </button>
          </div>

          {/* Email */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-900">Email</p>
                <p className="text-xs text-gray-500 mt-0.5">Receive notification on Email</p>
              </div>
            </div>

            <button
              onClick={() => handleToggle('emailOptIn', email)}
              className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-200 cursor-pointer ${
                email ? 'bg-emerald-500 justify-end' : 'bg-gray-200 justify-start'
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-white shadow-md transform transition-transform" />
            </button>
          </div>

          {/* Push Notifications */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center flex-shrink-0">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-900">Push Notifications</p>
                <p className="text-xs text-gray-500 mt-0.5">Receive push notifications on Mobile</p>
              </div>
            </div>

            <button
              onClick={() => handleToggle('pushOptIn', push)}
              className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-200 cursor-pointer ${
                push ? 'bg-emerald-500 justify-end' : 'bg-gray-200 justify-start'
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-white shadow-md transform transition-transform" />
            </button>
          </div>

          {/* Promotional */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center flex-shrink-0">
                <Megaphone className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-900">Promotional</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Receiver promotional offers and update. You will still receive important account and booking updates.
                </p>
              </div>
            </div>

            <button
              onClick={() => handleToggle('promotionalOptIn', promotional)}
              className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-200 cursor-pointer ${
                promotional ? 'bg-emerald-500 justify-end' : 'bg-gray-200 justify-start'
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-white shadow-md transform transition-transform" />
            </button>
          </div>
        </div>
      </Card>

      {/* Info Notice */}
      <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium px-1">
        <Info className="w-4 h-4 text-gray-400" />
        <span>{saving ? 'Saving changes...' : 'Changes are saved automatically'}</span>
      </div>
    </div>
  );
}
