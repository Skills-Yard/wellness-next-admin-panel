'use client';

/**
 * App-wide notification toasts.
 *
 * Thin wrapper over `react-toastify` that renders every toast as a titled card:
 * a tinted icon badge, a bold heading, and the message as a muted sub-line
 * (matching the notification style in the design). The `<ToastContainer>` lives
 * in `src/app/layout.tsx`.
 *
 * Existing call sites keep working unchanged — `toast.success('Saved!')` now
 * shows a "Success" heading with "Saved!" underneath. Import `toast` from here
 * instead of from 'react-toastify'. For a custom heading, pass an object:
 * `toast.error({ title: 'Payment failed', description: 'Try again.' })` or use
 * the `notify` helper.
 */

import React from 'react';
import {
  toast as rtToast,
  type Id,
  type ToastOptions,
  type CloseButtonProps,
} from 'react-toastify';
import { CircleCheck, CircleX, Info, TriangleAlert, X } from 'lucide-react';

type NotifyType = 'success' | 'error' | 'info' | 'warning';

/** A plain message (the heading is filled in from the type), or an explicit title + description. */
export type NotifyInput = string | { title?: string; description?: React.ReactNode };

const META: Record<
  NotifyType,
  {
    heading: string;
    Icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
    badge: string;
  }
> = {
  success: { heading: 'Success', Icon: CircleCheck, badge: 'bg-emerald-50 text-emerald-600' },
  error: { heading: 'Something went wrong', Icon: CircleX, badge: 'bg-rose-50 text-rose-600' },
  info: { heading: 'Heads up', Icon: Info, badge: 'bg-blue-50 text-blue-600' },
  warning: { heading: 'Heads up', Icon: TriangleAlert, badge: 'bg-amber-50 text-amber-600' },
};

function ToastCard({
  type,
  title,
  description,
}: {
  type: NotifyType;
  title: string;
  description?: React.ReactNode;
}) {
  const { Icon, badge } = META[type];
  return (
    <div className="flex flex-1 items-start gap-3 min-w-0">
      <span
        className={`mt-px grid h-9 w-9 shrink-0 place-items-center rounded-full ${badge}`}
      >
        <Icon className="h-[18px] w-[18px]" strokeWidth={2.25} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-semibold leading-[1.35] text-gray-900">{title}</p>
        {description != null && description !== '' && (
          <p className="mt-0.5 text-[13px] leading-snug text-gray-500 break-words">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

function CloseButton({ closeToast }: CloseButtonProps) {
  return (
    <button
      type="button"
      aria-label="Dismiss"
      onClick={(e) => {
        e.stopPropagation();
        closeToast(e);
      }}
      className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-md text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
    >
      <X className="h-4 w-4" strokeWidth={2.25} />
    </button>
  );
}

function render(type: NotifyType, input: NotifyInput) {
  const heading = META[type].heading;
  const { title, description } =
    typeof input === 'string'
      ? { title: heading, description: input as React.ReactNode }
      : { title: input.title || heading, description: input.description };
  return <ToastCard type={type} title={title} description={description} />;
}

function show(type: NotifyType, input: NotifyInput, options?: ToastOptions): Id {
  return rtToast(render(type, input), {
    ...options,
    type,
    icon: false,
    closeButton: CloseButton,
  });
}

/** Fire a titled notification. Pass a string, or `{ title, description }` for a custom heading. */
export const notify = {
  success: (input: NotifyInput, options?: ToastOptions) => show('success', input, options),
  error: (input: NotifyInput, options?: ToastOptions) => show('error', input, options),
  info: (input: NotifyInput, options?: ToastOptions) => show('info', input, options),
  warning: (input: NotifyInput, options?: ToastOptions) => show('warning', input, options),
};

/**
 * Drop-in replacement for react-toastify's `toast`. `.success` / `.error` /
 * `.info` / `.warning` render the titled card; the pass-through helpers
 * (`dismiss`, `update`, `isActive`, `promise`, `loading`) forward to the library.
 */
export const toast = {
  success: (input: NotifyInput, options?: ToastOptions) => show('success', input, options),
  error: (input: NotifyInput, options?: ToastOptions) => show('error', input, options),
  info: (input: NotifyInput, options?: ToastOptions) => show('info', input, options),
  warning: (input: NotifyInput, options?: ToastOptions) => show('warning', input, options),
  warn: (input: NotifyInput, options?: ToastOptions) => show('warning', input, options),
  dismiss: rtToast.dismiss,
  update: rtToast.update,
  isActive: rtToast.isActive,
  promise: rtToast.promise,
  loading: rtToast.loading,
  clearWaitingQueue: rtToast.clearWaitingQueue,
};

export default toast;
