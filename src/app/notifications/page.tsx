'use client';

import React, { useRef, useState } from 'react';
import Link from 'next/link';
import { Bell, History, ImagePlus, Loader2, Send } from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import AudienceBuilder, { AudienceSelection } from '../../components/notifications/AudienceBuilder';
import { useConfirm } from '../../components/ui/confirm-dialog';
import { toast } from '../../components/ui/toast';
import { uploadFileToR2 } from '../../lib/uploadToR2';
import { createBroadcastServerAction } from '../../lib/server-actions/notification';

const textareaClass =
  'flex w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C68A4C]/30 focus-visible:border-[#C68A4C] transition-all duration-150 shadow-2xs resize-none';

export default function NotificationsComposePage() {
  const confirm = useConfirm();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [deeplink, setDeeplink] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageKey, setImageKey] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const [audience, setAudience] = useState<AudienceSelection | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image cannot exceed 5MB');
      return;
    }
    setUploading(true);
    try {
      // Reuses the campaigns R2 bucket rather than adding a new upload-url
      // `module` value for a day-one feature — see broadcast.module.ts on
      // the backend for the same call.
      const result = await uploadFileToR2(file, 'campaigns', title || 'broadcast');
      setImageUrl(result.url);
      setImageKey(result.r2Key || result.url);
    } catch (err: any) {
      toast.error(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setBody('');
    setDeeplink('');
    setImageUrl(null);
    setImageKey(null);
  };

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) {
      toast.error('Please fill in both a title and a message');
      return;
    }
    if (!audience) return;
    if (audience.mode === 'SELECTED' && audience.recipientIds.length === 0) {
      toast.error(`Please choose at least one ${audience.role === 'USERS' ? 'user' : 'partner'}`);
      return;
    }

    const count = audience.previewCount ?? 0;
    const audienceLabel = audience.role === 'USERS' ? 'user(s)' : 'partner(s)';
    const ok = await confirm({
      title: 'Send this notification?',
      description: `This will push "${title}" to ${count} ${audienceLabel}. This can't be undone.`,
      confirmText: 'Send now',
      variant: 'default',
    });
    if (!ok) return;

    setSending(true);
    try {
      const res = await createBroadcastServerAction({
        title: title.trim(),
        body: body.trim(),
        deeplink: deeplink.trim() || undefined,
        imageKey: imageKey || undefined,
        audienceType: audience.audienceType,
        audienceFilter: audience.mode === 'SEGMENT' ? audience.filter : undefined,
        recipientIds: audience.mode === 'SELECTED' ? audience.recipientIds : undefined,
      });
      if (res.ok) {
        toast.success('Notification queued for sending — track its progress in History.');
        resetForm();
      } else {
        toast.error(res.message || 'Failed to send notification');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to send notification');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#FAF5F0] text-[#C68A4C] flex items-center justify-center">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Notifications</h1>
            <p className="text-xs text-gray-500">Send a custom push notification to users or partners.</p>
          </div>
        </div>
        <Link href="/notifications/history">
          <Button variant="outline" size="sm">
            <History className="w-3.5 h-3.5" />
            History
          </Button>
        </Link>
      </div>

      <Card className="p-6 space-y-5">
        <h2 className="text-sm font-bold text-gray-900">Message</h2>

        <div className="space-y-1.5">
          <Label htmlFor="bc-title">Title <span className="text-rose-500">*</span></Label>
          <Input
            id="bc-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. New year, new you 🎉"
            maxLength={80}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="bc-body">Message <span className="text-rose-500">*</span></Label>
          <textarea
            id="bc-body"
            className={textareaClass}
            rows={3}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="e.g. Flat 20% off all wellness sessions this week."
            maxLength={200}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="bc-deeplink">Deep link (optional)</Label>
            <Input
              id="bc-deeplink"
              value={deeplink}
              onChange={(e) => setDeeplink(e.target.value)}
              placeholder="e.g. myapp://offers/new-year"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Image (optional)</Label>
            <input type="file" ref={fileInputRef} accept="image/*" className="hidden" onChange={handleFileChange} />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-11 rounded-xl border border-dashed border-gray-300 hover:border-[#C68A4C] transition-colors flex items-center justify-center gap-2 text-xs font-medium text-gray-500"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading…
                </>
              ) : imageUrl ? (
                <>
                  <img src={imageUrl} alt="" className="h-7 w-7 object-cover rounded-md" />
                  Change image
                </>
              ) : (
                <>
                  <ImagePlus className="w-3.5 h-3.5" /> Upload image
                </>
              )}
            </button>
          </div>
        </div>
      </Card>

      <Card className="p-6 space-y-5">
        <h2 className="text-sm font-bold text-gray-900">Audience</h2>
        <AudienceBuilder onChange={setAudience} />
      </Card>

      <div className="flex items-center justify-end gap-3 pb-4">
        <Button variant="outline" onClick={resetForm} disabled={sending}>
          Clear
        </Button>
        <Button onClick={handleSend} disabled={sending}>
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          {sending ? 'Sending…' : 'Send notification'}
        </Button>
      </div>
    </div>
  );
}
