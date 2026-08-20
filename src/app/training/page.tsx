'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import CourseListTable from '../../components/training/list/CourseListTable';
import {
  getTrainingCoursesServerAction,
  saveTrainingCourseServerAction,
  deleteTrainingCourseServerAction,
  TrainingCoursePayload,
} from '../../lib/server-actions/training';
import { TrainingCourse } from '../../types/training';
import { Card } from '../../components/ui/card';
import { Skeleton, SkeletonCard, SkeletonTableRows } from '../../components/ui/skeleton';
import { getCached, setCached } from '../../lib/sessionCache';
import FetchErrorBanner from '../../components/common/FetchErrorBanner';

const CACHE_KEY = 'training:courses';

export default function TrainingPage() {
  const cached = getCached<TrainingCourse[]>(CACHE_KEY);
  const [courses, setCourses] = useState<TrainingCourse[]>(cached || []);
  // Only the very first, never-cached load shows the full skeleton — a revisit this session
  // renders the cached list immediately while refreshing quietly underneath (see sessionCache.ts).
  const [loading, setLoading] = useState(cached === undefined);
  const [error, setError] = useState<string | null>(null);

  const fetchCourses = useCallback(async () => {
    if (getCached<TrainingCourse[]>(CACHE_KEY) === undefined) setLoading(true);
    setError(null);
    try {
      const data = await getTrainingCoursesServerAction();
      setCached(CACHE_KEY, data);
      setCourses(data);
    } catch (err: any) {
      console.error('Error loading courses:', err?.response?.data || err?.message || err);
      setError("Couldn't load the latest courses list.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const handleSaveCourse = async (id: string | null, payload: TrainingCoursePayload) => {
    const res = await saveTrainingCourseServerAction(id, payload);
    if (res.ok) {
      setCourses((prev) => {
        const next = id ? prev.map((c) => (c.id === id ? res.data : c)) : [...prev, res.data];
        setCached(CACHE_KEY, next);
        return next;
      });
      return { ok: true };
    }
    return { ok: false, message: res.message };
  };

  const handleDeleteCourse = async (id: string, title: string) => {
    const res = await deleteTrainingCourseServerAction(id);
    if (res.ok) {
      setCourses((prev) => {
        const next = prev.filter((c) => c.id !== id);
        setCached(CACHE_KEY, next);
        return next;
      });
      toast.success('Course deleted successfully!');
    } else {
      toast.error(res.message || `Failed to delete "${title}"`);
    }
  };

  const handleToggleStatus = async (id: string, nextActive: boolean) => {
    const course = courses.find((c) => c.id === id);
    if (!course) return;
    const res = await saveTrainingCourseServerAction(id, { title: course.title, isActive: nextActive });
    if (res.ok) {
      setCourses((prev) => {
        const next = prev.map((c) => (c.id === id ? res.data : c));
        setCached(CACHE_KEY, next);
        return next;
      });
      toast.success(`Course marked ${nextActive ? 'active' : 'inactive'}`);
    } else {
      toast.error(res.message || 'Failed to update status');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-7 w-28" />
            <Skeleton className="h-3.5 w-64" />
          </div>
          <Skeleton className="h-10 w-full sm:w-40 rounded-xl" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
        <Card className="rounded-2xl border border-gray-100 shadow-xs overflow-hidden bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/70 border-b border-gray-100 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="py-3.5 px-5">Course</th>
                  <th className="py-3.5 px-4">Mandatory</th>
                  <th className="py-3.5 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <SkeletonTableRows rows={6} columns={3} />
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && <FetchErrorBanner message={error} onRetry={fetchCourses} />}
      <CourseListTable
        courses={courses}
        onSave={handleSaveCourse}
        onDelete={handleDeleteCourse}
        onToggleStatus={handleToggleStatus}
      />
    </div>
  );
}
