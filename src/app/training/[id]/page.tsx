'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import {
  ChevronDown, Plus, Edit3, Trash2, GraduationCap, Clock, Target, PlayCircle, FileText, Loader2,
} from 'lucide-react';
import {
  getTrainingCourseByIdServerAction,
  getTrainingModulesServerAction,
  getTrainingLessonsServerAction,
  saveTrainingCourseServerAction,
  deleteTrainingCourseServerAction,
  saveTrainingModuleServerAction,
  deleteTrainingModuleServerAction,
  saveTrainingLessonServerAction,
  deleteTrainingLessonServerAction,
  TrainingCoursePayload,
  TrainingModulePayload,
  TrainingLessonPayload,
} from '../../../lib/server-actions/training';
import { TrainingCourse, TrainingModule, TrainingLesson } from '../../../types/training';
import { Card } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { StatusToggle } from '../../../components/ui/status-toggle';
import { useConfirm } from '../../../components/ui/confirm-dialog';
import { Skeleton, SkeletonCircle, SkeletonText } from '../../../components/ui/skeleton';
import { useBreadcrumb } from '../../../contexts/BreadcrumbContext';
import CourseModal from '../../../components/training/CourseModal';
import ModuleModal from '../../../components/training/ModuleModal';
import LessonModal from '../../../components/training/LessonModal';

export default function TrainingCourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const confirm = useConfirm();
  const { setLabel: setBreadcrumbLabel } = useBreadcrumb();

  const [course, setCourse] = useState<TrainingCourse | null>(null);
  const [modules, setModules] = useState<TrainingModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [modulesLoading, setModulesLoading] = useState(true);

  // Lessons are fetched lazily, per module, the first time it's expanded — not upfront for
  // every module, since a course can have many modules and most stay collapsed most of the time.
  const [lessonsByModule, setLessonsByModule] = useState<Record<string, TrainingLesson[]>>({});
  const [lessonsLoadingId, setLessonsLoadingId] = useState<string | null>(null);
  const [expandedModuleId, setExpandedModuleId] = useState<string | null>(null);

  const [courseModalOpen, setCourseModalOpen] = useState(false);
  const [moduleModalOpen, setModuleModalOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<TrainingModule | null>(null);
  const [lessonModalOpen, setLessonModalOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<TrainingLesson | null>(null);
  const [activeLessonModuleId, setActiveLessonModuleId] = useState<string | null>(null);

  const sortByOrder = <T extends { displayOrder: number }>(list: T[]) =>
    list.slice().sort((a, b) => a.displayOrder - b.displayOrder);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      const data = await getTrainingCourseByIdServerAction(id);
      if (!cancelled) {
        setCourse(data);
        setLoading(false);
      }
    })();

    (async () => {
      setModulesLoading(true);
      const data = await getTrainingModulesServerAction(id);
      if (!cancelled) {
        setModules(sortByOrder(data));
        setModulesLoading(false);
      }
    })();

    setLessonsByModule({});
    setExpandedModuleId(null);
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Feeds the loaded course's title to Header's breadcrumb (see BreadcrumbContext) — cleared on
  // unmount/id change so a stale title never flashes for the next course/page while it loads.
  useEffect(() => {
    setBreadcrumbLabel(course?.title || null);
    return () => setBreadcrumbLabel(null);
  }, [course, setBreadcrumbLabel]);

  const toggleModule = async (moduleId: string) => {
    if (expandedModuleId === moduleId) {
      setExpandedModuleId(null);
      return;
    }
    setExpandedModuleId(moduleId);
    if (!lessonsByModule[moduleId]) {
      setLessonsLoadingId(moduleId);
      try {
        const data = await getTrainingLessonsServerAction(moduleId);
        setLessonsByModule((prev) => ({ ...prev, [moduleId]: sortByOrder(data) }));
      } finally {
        setLessonsLoadingId(null);
      }
    }
  };

  const handleSaveCourse = async (payload: TrainingCoursePayload) => {
    const res = await saveTrainingCourseServerAction(id, payload);
    if (res.ok) {
      setCourse(res.data);
      return { ok: true };
    }
    return { ok: false, message: res.message };
  };

  const handleDeleteCourse = async () => {
    const ok = await confirm({
      title: 'Delete this course?',
      description: `"${course?.title}" and every module/lesson under it will be removed. This can't be undone.`,
    });
    if (!ok) return;
    const res = await deleteTrainingCourseServerAction(id);
    if (res.ok) {
      toast.success('Course deleted successfully!');
      router.push('/training');
    } else {
      toast.error(res.message || 'Failed to delete course');
    }
  };

  const handleToggleCourseStatus = async () => {
    if (!course) return;
    const res = await saveTrainingCourseServerAction(id, { title: course.title, isActive: !course.isActive });
    if (res.ok) {
      setCourse(res.data);
      toast.success(`Course marked ${res.data.isActive ? 'active' : 'inactive'}`);
    } else {
      toast.error(res.message || 'Failed to update status');
    }
  };

  const handleSaveModule = async (payload: TrainingModulePayload) => {
    const res = await saveTrainingModuleServerAction(id, editingModule?.id ?? null, payload);
    if (res.ok) {
      setModules((prev) =>
        sortByOrder(editingModule ? prev.map((m) => (m.id === res.data.id ? res.data : m)) : [...prev, res.data])
      );
      return { ok: true };
    }
    return { ok: false, message: res.message };
  };

  const handleDeleteModule = async (module: TrainingModule) => {
    const ok = await confirm({
      title: 'Delete this module?',
      description: `"${module.title}" and every lesson under it will be removed. This can't be undone.`,
    });
    if (!ok) return;
    const res = await deleteTrainingModuleServerAction(module.id);
    if (res.ok) {
      setModules((prev) => prev.filter((m) => m.id !== module.id));
      setLessonsByModule((prev) => {
        const next = { ...prev };
        delete next[module.id];
        return next;
      });
      if (expandedModuleId === module.id) setExpandedModuleId(null);
      toast.success('Module deleted successfully!');
    } else {
      toast.error(res.message || 'Failed to delete module');
    }
  };

  const handleSaveLesson = async (payload: TrainingLessonPayload) => {
    if (!activeLessonModuleId) return { ok: false, message: 'No module selected' };
    const moduleId = activeLessonModuleId;
    const res = await saveTrainingLessonServerAction(moduleId, editingLesson?.id ?? null, payload);
    if (res.ok) {
      setLessonsByModule((prev) => {
        const existing = prev[moduleId] || [];
        const next = editingLesson
          ? existing.map((l) => (l.id === res.data.id ? res.data : l))
          : [...existing, res.data];
        return { ...prev, [moduleId]: sortByOrder(next) };
      });
      return { ok: true };
    }
    return { ok: false, message: res.message };
  };

  const handleDeleteLesson = async (moduleId: string, lesson: TrainingLesson) => {
    const ok = await confirm({
      title: 'Delete this lesson?',
      description: `"${lesson.title}" will be permanently removed. This can't be undone.`,
    });
    if (!ok) return;
    const res = await deleteTrainingLessonServerAction(lesson.id);
    if (res.ok) {
      setLessonsByModule((prev) => ({ ...prev, [moduleId]: (prev[moduleId] || []).filter((l) => l.id !== lesson.id) }));
      toast.success('Lesson deleted successfully!');
    } else {
      toast.error(res.message || 'Failed to delete lesson');
    }
  };

  const formatDuration = (sec?: number | null) => {
    if (!sec) return null;
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  const activeModuleLessonsCount = activeLessonModuleId ? lessonsByModule[activeLessonModuleId]?.length ?? 0 : 0;

  if (loading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <Card className="p-6 border-gray-100">
          <div className="flex items-start gap-4">
            <SkeletonCircle className="w-16 h-16" />
            <div className="space-y-2">
              <SkeletonText className="w-40 h-5" />
              <SkeletonText className="w-64" />
              <div className="flex items-center gap-4 pt-1">
                <SkeletonText className="w-20" />
                <SkeletonText className="w-24" />
              </div>
            </div>
          </div>
        </Card>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="py-24 text-center space-y-4">
        <p className="text-base font-bold text-gray-800">Course Not Found</p>
        <p className="text-xs text-gray-500">The requested course ID "{id}" does not exist in the database.</p>
        <button
          onClick={() => router.push('/training')}
          className="px-4 py-2 text-xs font-semibold text-white bg-[#1C1512] rounded-xl cursor-pointer"
        >
          Back to Training
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Card */}
      <Card className="p-6 shadow-xs border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[#FAF5F0] border border-[#F2E5D9] flex items-center justify-center overflow-hidden flex-shrink-0">
              {course.thumbnailKey ? (
                <img src={course.thumbnailKey} alt={course.title} className="w-full h-full object-cover" />
              ) : (
                <GraduationCap className="w-7 h-7 text-[#C68A4C]" />
              )}
            </div>
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="font-bold text-lg text-gray-900">{course.title}</h1>
                {course.isMandatory && <Badge variant="secondary">Mandatory</Badge>}
              </div>
              {course.description && <p className="text-xs text-gray-500 max-w-lg">{course.description}</p>}
              <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 pt-1">
                {course.passingScore != null && (
                  <div className="flex items-center gap-1"><Target className="w-3.5 h-3.5 text-gray-400" /><span>{course.passingScore}% to pass</span></div>
                )}
                {course.estimatedMinutes != null && (
                  <div className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-gray-400" /><span>{course.estimatedMinutes} min</span></div>
                )}
                <div className="flex items-center gap-1"><FileText className="w-3.5 h-3.5 text-gray-400" /><span>{course.serviceIds?.length ?? 0} linked services</span></div>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-start md:items-end gap-3">
            <StatusToggle isActive={course.isActive} onToggle={handleToggleCourseStatus} />
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setCourseModalOpen(true)}>
                <Edit3 className="w-3.5 h-3.5" /> Edit Course
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteCourse}
                className="bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-700 border-none"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Modules */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Modules</h2>
            <p className="text-xs text-gray-500 mt-0.5">Organize this course's content into modules, each with its own lessons</p>
          </div>
          <Button size="sm" onClick={() => { setEditingModule(null); setModuleModalOpen(true); }}>
            <Plus className="w-4 h-4" /> Add Module
          </Button>
        </div>

        {modulesLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-2xl" />
            ))}
          </div>
        ) : modules.length === 0 ? (
          <Card className="py-14 flex flex-col items-center justify-center text-center p-6 space-y-3 border-gray-100">
            <div className="w-12 h-12 rounded-full bg-[#FAF5F0] text-[#C68A4C] flex items-center justify-center">
              <GraduationCap className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-gray-800">No Modules Yet</h3>
            <p className="text-xs text-gray-500 max-w-sm">Break this course down into modules to start adding lessons.</p>
            <Button onClick={() => { setEditingModule(null); setModuleModalOpen(true); }} size="sm" className="mt-2 bg-[#1C1512] text-white">
              + Add Module
            </Button>
          </Card>
        ) : (
          <div className="space-y-3">
            {modules.map((module, idx) => {
              const isExpanded = expandedModuleId === module.id;
              const lessons = lessonsByModule[module.id];
              return (
                <Card key={module.id} className="border-gray-100 shadow-xs overflow-hidden">
                  {/* A plain div, not a <button> — the Edit/Delete controls below are real
                      <button>s (via the Button component), and a <button> can't contain another
                      <button> without breaking HTML nesting rules (see React's hydration
                      warning this used to throw). role="button" + onKeyDown keeps it keyboard-
                      operable without that. */}
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => toggleModule(module.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        toggleModule(module.id);
                      }
                    }}
                    className="w-full flex items-center justify-between gap-3 px-5 py-4 hover:bg-[#FAF9F6]/80 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-[#FAF5F0] border border-[#F2E5D9] flex items-center justify-center text-xs font-bold text-[#C68A4C] flex-shrink-0">
                        {idx + 1}
                      </div>
                      <span className="font-semibold text-gray-900 text-sm truncate">{module.title}</span>
                      {lessons && <Badge variant="secondary">{lessons.length} lesson{lessons.length === 1 ? '' : 's'}</Badge>}
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                      <Button variant="outline" size="icon" onClick={() => { setEditingModule(module); setModuleModalOpen(true); }} title="Edit Module">
                        <Edit3 className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => handleDeleteModule(module)}
                        className="bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-700 border-none"
                        title="Delete Module"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                      <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-gray-100 bg-[#FAF9F6]/40 px-5 py-4 space-y-2.5">
                      {lessonsLoadingId === module.id ? (
                        <div className="flex items-center gap-2 text-xs text-gray-400 py-4 justify-center">
                          <Loader2 className="w-4 h-4 animate-spin" /> Loading lessons...
                        </div>
                      ) : (lessons?.length ?? 0) === 0 ? (
                        <p className="text-xs text-gray-400 text-center py-4">No lessons in this module yet.</p>
                      ) : (
                        lessons!.map((lesson, lidx) => (
                          <div key={lesson.id} className="flex items-center justify-between gap-3 bg-white border border-gray-100 rounded-xl px-4 py-2.5">
                            <div className="flex items-center gap-3 min-w-0">
                              <PlayCircle className="w-4 h-4 text-gray-300 flex-shrink-0" />
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-gray-800 truncate">{lidx + 1}. {lesson.title}</p>
                                {lesson.videoDurationSec != null && (
                                  <p className="text-[11px] text-gray-400">{formatDuration(lesson.videoDurationSec)}</p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => { setActiveLessonModuleId(module.id); setEditingLesson(lesson); setLessonModalOpen(true); }}
                                title="Edit Lesson"
                              >
                                <Edit3 className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="destructive"
                                size="icon"
                                onClick={() => handleDeleteLesson(module.id, lesson)}
                                className="bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-700 border-none"
                                title="Delete Lesson"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        ))
                      )}

                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-1"
                        onClick={() => { setActiveLessonModuleId(module.id); setEditingLesson(null); setLessonModalOpen(true); }}
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Lesson
                      </Button>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <CourseModal
        isOpen={courseModalOpen}
        onClose={() => setCourseModalOpen(false)}
        initialData={course}
        onSave={handleSaveCourse}
      />

      <ModuleModal
        isOpen={moduleModalOpen}
        onClose={() => setModuleModalOpen(false)}
        initialData={editingModule}
        nextDisplayOrder={modules.length + 1}
        onSave={handleSaveModule}
      />

      <LessonModal
        isOpen={lessonModalOpen}
        onClose={() => setLessonModalOpen(false)}
        initialData={editingLesson}
        nextDisplayOrder={activeModuleLessonsCount + 1}
        onSave={handleSaveLesson}
      />
    </div>
  );
}
