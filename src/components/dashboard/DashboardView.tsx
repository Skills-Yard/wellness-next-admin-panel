'use client';

import React, { useMemo } from 'react';
import { User } from '../../types/user';
import { Booking } from '../../types/booking';
import { Partner } from '../../types/partner';
import { computeDashboardStats } from '../../lib/dashboard/computeDashboardStats';
import { CATEGORY_COLORS, STATUS_COLORS } from './palette';
import { useCatalogue } from '../../contexts/CatalogueContext';
import StatCardsRow from './StatCardsRow';
import CatalogueSnapshot from './CatalogueSnapshot';
import EarningsChart from './EarningsChart';
import DonutCard from './DonutCard';
import BookingsOverviewChart from './BookingsOverviewChart';
import TopPerformingServices from './TopPerformingServices';
import TopCitiesTable from './TopCitiesTable';
import RecentBookingsTable from './RecentBookingsTable';

interface DashboardViewProps {
  users: User[];
  bookings: Booking[];
  partners: Partner[];
}

export default function DashboardView({ users, bookings, partners }: DashboardViewProps) {
  const { zones } = useCatalogue();

  const stats = useMemo(
    () => computeDashboardStats(users, bookings, partners, zones),
    [users, bookings, partners, zones]
  );

  const categorySlices = stats.categoryBreakdown.map((c, i) => ({
    label: c.label,
    value: c.count,
    percent: c.percent,
    color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
  }));

  const statusSlices = stats.statusBreakdown.map((s) => ({
    label: s.label,
    value: s.count,
    percent: s.percent,
    color: STATUS_COLORS[s.label] || CATEGORY_COLORS[0],
  }));

  const totalCustomersForSplit = stats.newVsReturning.newCustomers + stats.newVsReturning.returningCustomers;
  const newVsReturningSlices = [
    {
      label: 'New Customers',
      value: stats.newVsReturning.newCustomers,
      percent: totalCustomersForSplit > 0 ? (stats.newVsReturning.newCustomers / totalCustomersForSplit) * 100 : 0,
      color: CATEGORY_COLORS[0],
    },
    {
      label: 'Returning Customers',
      value: stats.newVsReturning.returningCustomers,
      percent: totalCustomersForSplit > 0 ? (stats.newVsReturning.returningCustomers / totalCustomersForSplit) * 100 : 0,
      color: CATEGORY_COLORS[1],
    },
  ];

  const bookingsOverviewWeeks = stats.bookingsOverview;
  const lastWeek = bookingsOverviewWeeks[bookingsOverviewWeeks.length - 1];
  const prevWeek = bookingsOverviewWeeks[bookingsOverviewWeeks.length - 2];
  const weekChangePercent =
    prevWeek && prevWeek.bookings > 0
      ? ((lastWeek.bookings - prevWeek.bookings) / prevWeek.bookings) * 100
      : null;
  const bookingsOverviewTotal = bookingsOverviewWeeks.reduce((s, w) => s + w.bookings, 0);

  return (
    <div className="space-y-6">
      <StatCardsRow stats={stats} />

      <CatalogueSnapshot />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <EarningsChart data={stats.earningsTimeline} totalEarnings={stats.totalEarnings.value} />
        </div>
        <DonutCard
          title="Bookings by Service Category"
          badge="All time"
          slices={categorySlices}
          centerLabel="Total"
          centerValue={categorySlices.reduce((s, c) => s + c.value, 0).toLocaleString('en-IN')}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <TopPerformingServices services={stats.topServices} />
        <BookingsOverviewChart data={bookingsOverviewWeeks} totalBookings={bookingsOverviewTotal} changePercent={weekChangePercent} />
        <DonutCard
          title="New vs Returning Customers"
          badge="All time"
          slices={newVsReturningSlices}
          centerLabel="Total"
          centerValue={totalCustomersForSplit.toLocaleString('en-IN')}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <DonutCard
          title="Bookings by Status"
          badge="All time"
          slices={statusSlices}
          centerLabel="Total"
          centerValue={bookings.length.toLocaleString('en-IN')}
        />
        <TopCitiesTable cities={stats.topCities} />
        <RecentBookingsTable bookings={stats.recentBookings} />
      </div>
    </div>
  );
}
