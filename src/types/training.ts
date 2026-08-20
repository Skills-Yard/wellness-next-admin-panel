// Training content hierarchy: Course -> Modules -> Lessons (see /training/* endpoints in
// server-actions/training.ts). Distinct from PartnerTrainingProgress (types/partner.ts), which
// is a partner's per-course completion record, not the course content itself.

export interface TrainingCourse {
  id: string;
  title: string;
  description?: string | null;
  thumbnailKey?: string | null;
  isMandatory: boolean;
  // Services this course applies to (see ServiceItem in types/catalogue.ts) — plain id refs,
  // the backend doesn't embed the full service objects on the course.
  serviceIds: string[];
  passingScore?: number | null;
  estimatedMinutes?: number | null;
  displayOrder: number;
  isActive: boolean;
  // Not returned by the list/detail endpoints today — populated client-side only when a
  // course's modules happen to already be loaded (see modulesCountFor in the course list page).
  modulesCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface TrainingModule {
  id: string;
  courseId: string;
  title: string;
  displayOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface TrainingLesson {
  id: string;
  moduleId: string;
  title: string;
  content?: string | null;
  videoKey?: string | null;
  videoDurationSec?: number | null;
  displayOrder: number;
  createdAt?: string;
  updatedAt?: string;
}
