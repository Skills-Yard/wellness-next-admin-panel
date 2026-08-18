'use client';

import React from 'react';
import { Card } from '../ui/card';
import { DashboardStats } from '../../lib/dashboard/computeDashboardStats';

export default function TopCitiesTable({ cities }: { cities: DashboardStats['topCities'] }) {
  return (
    <Card className="p-5 sm:p-6">
      <h3 className="text-sm font-bold text-gray-800 mb-4">Top Cities by Bookings</h3>

      {cities.length === 0 ? (
        <p className="text-xs text-gray-400 py-8 text-center">No bookings yet.</p>
      ) : (
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-gray-400">
              <th className="font-medium pb-2">City</th>
              <th className="font-medium pb-2 text-right">Bookings</th>
              <th className="font-medium pb-2 text-right">Revenue</th>
            </tr>
          </thead>
          <tbody>
            {cities.map((c) => (
              <tr key={c.city} className="border-t border-gray-50">
                <td className="py-2.5 font-semibold text-gray-800">{c.city}</td>
                <td className="py-2.5 text-right text-gray-600">{c.bookings.toLocaleString('en-IN')}</td>
                <td className="py-2.5 text-right font-semibold text-gray-900">₹{c.revenue.toLocaleString('en-IN')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  );
}
