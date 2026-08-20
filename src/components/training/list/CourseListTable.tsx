'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Plus, Edit3, Trash2, GraduationCap, Clock, Target } from 'lucide-react';
import { TrainingCourse } from '../../../types/training';
import { Card } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { StatusToggle } from '../../ui/status-toggle';
import { useConfirm } from '../../ui/confirm-dialog';
import CourseModal from '../CourseModal';
import { TrainingCoursePayload } from '../../../lib/server-actions/training';

interface CourseListTableProps {
  courses: TrainingCourse[];
  onSave: (id: string | null, payload: TrainingCoursePayload) => Promise<{ ok: boolean; message?: string }>;
  onDelete: (id: string, title: string) => Promise<void>;
  onToggleStatus: (id: string, nextActive: boolean) => Promise<void>;
}

export default function CourseListTable({ courses, onSave, onDelete, onToggleStatus }: CourseListTableProps) {
  const router = useRouter();
  const confirm = useConfirm();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<TrainingCourse | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const filteredCourses = courses.filter((c) => c.title.toLowerCase().includes(search.trim().toLowerCase()));

  const totalCourses = courses.length;
  const mandatoryCount = courses.filter((c) => c.isMandatory).length;
  const activeCount = courses.filter((c) => c.isActive).length;

  const handleToggle = async (course: TrainingCourse) => {
    setTogglingId(course.id);
    try {
      await onToggleStatus(course.id, !course.isActive);
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (course: TrainingCourse) => {
    const ok = await confirm({
      title: 'Delete this course?',
      description: `"${course.title}" and every module/lesson under it will be removed. This can't be undone.`,
    });
    if (!ok) return;
    await onDelete(course.id, course.title);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">Training</h1>
          <p className="text-xs md:text-sm text-gray-500 mt-0.5">Manage partner training courses, modules and lessons</p>
        </div>
        <Button
          onClick={() => { setEditingCourse(null); setModalOpen(true); }}
          className="self-start sm:self-auto bg-[#1C1512] hover:bg-black text-white rounded-xl shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Add Course</span>
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="p-4 flex items-center gap-3 bg-white border-gray-100 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center"><GraduationCap className="w-5 h-5" /></div>
          <div>
            <p className="text-[11px] font-medium text-gray-500 uppercase">Total Courses</p>
            <p className="text-xl font-bold text-gray-900">{totalCourses}</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3 bg-white border-gray-100 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center"><Target className="w-5 h-5" /></div>
          <div>
            <p className="text-[11px] font-medium text-gray-500 uppercase">Mandatory</p>
            <p className="text-xl font-bold text-gray-900">{mandatoryCount}</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3 bg-white border-gray-100 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center"><Clock className="w-5 h-5" /></div>
          <div>
            <p className="text-[11px] font-medium text-gray-500 uppercase">Active</p>
            <p className="text-xl font-bold text-gray-900">{activeCount}</p>
          </div>
        </Card>
      </div>

      <div className="relative max-w-sm">
        <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <Input
          placeholder="Search courses..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 h-10"
        />
      </div>

      <Card className="w-full">
        {courses.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center text-center p-6 space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#FAF5F0] text-[#C68A4C] flex items-center justify-center">
              <GraduationCap className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-gray-800">No Courses Yet</h3>
            <p className="text-xs text-gray-500 max-w-sm">Get started by creating your first training course.</p>
            <Button onClick={() => { setEditingCourse(null); setModalOpen(true); }} size="sm" className="mt-2 bg-[#1C1512] text-white">
              + Create Course
            </Button>
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="py-14 flex flex-col items-center justify-center text-center p-6 space-y-2">
            <p className="text-sm font-semibold text-gray-700">No courses match "{search}"</p>
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse min-w-[720px]">
              <thead>
                <tr className="bg-[#FAF5F0] text-gray-700 text-xs font-semibold uppercase tracking-wider border-b border-[#F2E5D9]">
                  <th className="py-4 px-4 sm:px-6">Course</th>
                  <th className="py-4 px-4 sm:px-6 text-center">Mandatory</th>
                  <th className="py-4 px-4 sm:px-6 text-center">Passing Score</th>
                  <th className="py-4 px-4 sm:px-6 text-center">Est. Time</th>
                  <th className="py-4 px-4 sm:px-6 text-center">Services</th>
                  <th className="py-4 px-4 sm:px-6 text-center">Status</th>
                  <th className="py-4 px-4 sm:px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                {filteredCourses.map((course) => (
                  <tr
                    key={course.id}
                    className="hover:bg-[#FAF9F6]/80 transition-colors cursor-pointer"
                    onClick={() => router.push(`/training/${course.id}`)}
                  >
                    <td className="py-4 px-4 sm:px-6">
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-[#FAF5F0] border border-[#F2E5D9] flex items-center justify-center overflow-hidden flex-shrink-0">
                          {course.thumbnailKey ? (
                            <img src={course.thumbnailKey} alt={course.title} className="w-full h-full object-cover" />
                          ) : (
                            <GraduationCap className="w-5 h-5 text-[#C68A4C]" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-gray-900 text-sm sm:text-base truncate max-w-[220px]">{course.title}</div>
                          {course.description && (
                            <div className="text-xs text-gray-400 mt-0.5 truncate max-w-[220px]">{course.description}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 sm:px-6 text-center">
                      {course.isMandatory ? <Badge variant="secondary">Mandatory</Badge> : <span className="text-xs text-gray-400">Optional</span>}
                    </td>
                    <td className="py-4 px-4 sm:px-6 text-center font-medium text-gray-600">
                      {course.passingScore != null ? `${course.passingScore}%` : '—'}
                    </td>
                    <td className="py-4 px-4 sm:px-6 text-center font-medium text-gray-600">
                      {course.estimatedMinutes != null ? `${course.estimatedMinutes} min` : '—'}
                    </td>
                    <td className="py-4 px-4 sm:px-6 text-center font-medium text-gray-600">
                      {course.serviceIds?.length ?? 0}
                    </td>
                    <td className="py-4 px-4 sm:px-6 text-center" onClick={(e) => e.stopPropagation()}>
                      <StatusToggle
                        isActive={course.isActive}
                        busy={togglingId === course.id}
                        onToggle={() => handleToggle(course)}
                      />
                    </td>
                    <td className="py-4 px-4 sm:px-6 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => { setEditingCourse(course); setModalOpen(true); }}
                          title="Edit Course"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => handleDelete(course)}
                          className="bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-700 border-none"
                          title="Delete Course"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <CourseModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        initialData={editingCourse}
        onSave={(payload) => onSave(editingCourse?.id ?? null, payload)}
      />
    </div>
  );
}
