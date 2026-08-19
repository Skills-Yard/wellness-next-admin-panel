'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, type LucideIcon } from 'lucide-react';
import { Badge } from '../ui/badge';

interface ComingSoonProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

// Shared placeholder for any nav destination that exists in the sidebar/menu but has no page
// behind it yet — keeps every "not built yet" route visually consistent instead of each one
// improvising its own empty state.
export default function ComingSoon({ icon: Icon, title, description }: ComingSoonProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-20 sm:py-28 px-4">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#D4A373] to-[#F4E3D3] flex items-center justify-center text-[#1C1512] shadow-lg mb-6">
        <Icon className="w-8 h-8" />
      </div>
      <Badge variant="secondary" className="mb-4 uppercase tracking-wide">Coming Soon</Badge>
      <h1 className="text-xl font-bold text-gray-900 mb-2">{title}</h1>
      <p className="text-sm text-gray-500 max-w-md mb-8">{description}</p>
      <Link
        href="/"
        className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#1C1512] rounded-xl hover:bg-black transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Dashboard
      </Link>
    </div>
  );
}
