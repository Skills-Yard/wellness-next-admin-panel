'use client';

import React, { useState } from 'react';
import { Star, ChevronLeft, ChevronRight, MessageSquare } from 'lucide-react';
import { Partner, PartnerReview } from '../../../types/partner';
import { Avatar } from '../../ui/avatar';
import { Card } from '../../ui/card';
import { Badge } from '../../ui/badge';

interface PartnerReviewsTabProps {
  partner: Partner;
  reviews: PartnerReview[];
}

export default function PartnerReviewsTab({ partner, reviews }: PartnerReviewsTabProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const averageRating = partner.averageRating || 0;
  const totalReviewsCount = partner.totalReviews || reviews.length;

  const totalPages = Math.ceil(reviews.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedReviews = reviews.slice(startIndex, startIndex + itemsPerPage);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try { return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); }
    catch { return dateStr; }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="p-6 shadow-xs space-y-5 h-fit bg-white border-gray-100">
        <div>
          <h3 className="font-bold text-base text-gray-900 mb-1">Average Rating</h3>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-bold text-gray-900">{averageRating.toFixed(1)}</span>
            <Star className="w-6 h-6 fill-amber-400 text-amber-400" />
          </div>
          <p className="text-xs text-gray-400 mt-1">Based on {totalReviewsCount} reviews in database</p>
        </div>
      </Card>

      <Card className="lg:col-span-2 p-6 shadow-xs space-y-6 bg-white border-gray-100">
        <div className="divide-y divide-gray-100 space-y-6">
          {paginatedReviews.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p className="font-semibold text-sm text-gray-700">No customer reviews yet</p>
            </div>
          ) : (
            paginatedReviews.map((review) => (
              <div key={review.id} className="pt-6 first:pt-0 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar src={review.user?.avatarUrl} fallback={(review.user?.name || 'C').slice(0, 2).toUpperCase()} className="w-9 h-9 border border-gray-200" />
                    <div>
                      <p className="font-semibold text-xs text-gray-900">{review.user?.name || 'Customer'}</p>
                      <p className="text-[11px] text-gray-400">{formatDate(review.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`w-3.5 h-3.5 ${i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} />
                    ))}
                  </div>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">{review.comment || 'No written comment provided'}</p>
                <Badge variant="secondary">{review.serviceItemName || 'Service'}</Badge>
              </div>
            ))
          )}
        </div>

        <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <div>Showing <span className="font-semibold text-gray-900">{reviews.length > 0 ? startIndex + 1 : 0}</span> to <span className="font-semibold text-gray-900">{Math.min(startIndex + itemsPerPage, reviews.length)}</span> of <span className="font-semibold text-gray-900">{reviews.length}</span> reviews</div>
          <div className="flex items-center gap-1">
            <button disabled={currentPage === 1} onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))} className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
            <span className="px-2 font-semibold text-gray-900">{currentPage} / {totalPages}</span>
            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))} className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      </Card>
    </div>
  );
}
