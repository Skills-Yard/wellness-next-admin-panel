'use client';

import React from 'react';
import { Package, CheckCircle2, Clock, AlertCircle, ExternalLink, Plus } from 'lucide-react';
import { Partner } from '../../../types/partner';
import { Card } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';

interface PartnerTrainingTabProps {
  partner: Partner;
}

export default function PartnerTrainingTab({ partner }: PartnerTrainingTabProps) {
  const modules = partner.trainingProgress || [];

  const totalModules = modules.length;
  const completedCount = modules.filter((m) => m.status === 'COMPLETED').length;
  const inProgressCount = modules.filter((m) => m.status === 'IN_PROGRESS').length;
  const pendingCount = modules.filter((m) => m.status === 'NOT_STARTED' || m.status === 'FAILED').length;
  const completionRate = totalModules > 0 ? Math.round((completedCount / totalModules) * 100) : 0;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED': return <Badge variant="active">Completed</Badge>;
      case 'IN_PROGRESS': return <Badge className="bg-amber-50 text-amber-700 border-amber-200">In Progress</Badge>;
      default: return <Badge variant="destructive">{status.replace('_', ' ')}</Badge>;
    }
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '-';
    try { return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); }
    catch { return dateStr; }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total Modules', val: totalModules, icon: Package, bg: 'bg-orange-50 text-orange-600' },
          { label: 'Complete', val: completedCount, icon: CheckCircle2, bg: 'bg-emerald-50 text-emerald-600' },
          { label: 'In Progress', val: inProgressCount, icon: Clock, bg: 'bg-amber-50 text-amber-600' },
          { label: 'Pending', val: pendingCount, icon: AlertCircle, bg: 'bg-rose-50 text-rose-600' },
        ].map((m, idx) => {
          const Icon = m.icon;
          return (
            <Card key={idx} className="p-4 flex items-center gap-3 bg-white border-gray-100 shadow-xs">
              <div className={`w-10 h-10 rounded-xl ${m.bg} flex items-center justify-center`}><Icon className="w-5 h-5" /></div>
              <div>
                <p className="text-[11px] font-medium text-gray-500 uppercase">{m.label}</p>
                <p className="text-xl font-bold text-gray-900">{m.val}</p>
              </div>
            </Card>
          );
        })}

        <Card className="p-4 flex items-center justify-between bg-white border-gray-100 shadow-xs">
          <div>
            <p className="text-[11px] font-medium text-gray-500 uppercase">Completion Rate</p>
            <p className="text-xl font-bold text-gray-900">{completionRate}%</p>
          </div>
          <div className="w-10 h-10 rounded-full border-4 border-emerald-500 flex items-center justify-center text-[10px] font-bold text-emerald-700">
            {completionRate}%
          </div>
        </Card>
      </div>

      <Card className="p-6 shadow-xs space-y-5 bg-white border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-gray-900">Training Progress</h3>
            <p className="text-xs text-gray-500 mt-0.5">Assigned training courses for this partner in database</p>
          </div>
          <Button size="sm" className="h-9">
            <Plus className="w-4 h-4" />
            <span>Add Module</span>
          </Button>
        </div>

        <div className="overflow-x-auto border border-gray-100 rounded-xl">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50/70 border-b border-gray-100 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                <th className="py-3.5 px-6">Module</th>
                <th className="py-3.5 px-6">Category</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6">Score</th>
                <th className="py-3.5 px-6">Completed On</th>
                <th className="py-3.5 px-6 text-right">Certificate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {modules.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    <Package className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p className="font-semibold text-sm text-gray-700">No training modules assigned yet</p>
                  </td>
                </tr>
              ) : (
                modules.map((m) => (
                  <tr key={m.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-3.5 px-6 font-semibold text-gray-900">{m.course?.title || 'Course'}</td>
                    <td className="py-3.5 px-6 text-gray-600">{m.course?.category || 'General'}</td>
                    <td className="py-3.5 px-6">{getStatusBadge(m.status)}</td>
                    <td className="py-3.5 px-6 font-medium text-gray-900">{m.score != null ? `${m.score}%` : '-'}</td>
                    <td className="py-3.5 px-6 text-gray-500">{formatDate(m.completedAt)}</td>
                    <td className="py-3.5 px-6 text-right">
                      {m.status === 'COMPLETED' ? (
                        <Button variant="outline" size="sm" className="h-7 text-xs">
                          <span>View</span> <ExternalLink className="w-3 h-3 text-gray-400" />
                        </Button>
                      ) : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
