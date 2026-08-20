'use server';

import axiosInstance from '../axios';
import { getAuthHeaders, ActionResult } from './category';
import { parseServerError } from '../errorParser';
import { TrainingCourse, TrainingModule, TrainingLesson } from '../../types/training';

// NOTE: unlike every other admin resource in this directory (/admin/catalog/..., /admin/partners,
// ...), these routes are NOT under /admin — see the API list this was built from. If the backend
// turns out to actually expect an /admin/training/* prefix, this is the one place to change it.
const BASE = '/training';

function unwrap<T>(resData: any, fallback: T): T {
  if (resData && typeof resData === 'object' && 'data' in resData) return resData.data;
  return (resData ?? fallback) as T;
}

// Fields accepted by the course create/update DTO — kept as a single payload type since PATCH
// accepts the same shape as POST, just partial.
export interface TrainingCoursePayload {
  title: string;
  description?: string;
  thumbnailKey?: string;
  isMandatory?: boolean;
  serviceIds?: string[];
  passingScore?: number;
  estimatedMinutes?: number;
  displayOrder?: number;
  isActive?: boolean;
}

export interface TrainingModulePayload {
  title: string;
  displayOrder?: number;
}

export interface TrainingLessonPayload {
  title: string;
  content?: string;
  videoKey?: string;
  videoDurationSec?: number;
  displayOrder?: number;
}

// ---- Courses ----

// Doesn't catch-and-return-[] on failure — the course list page needs to tell "genuinely no
// courses" apart from "the request failed" (same convention as getPartnersServerAction).
export async function getTrainingCoursesServerAction(): Promise<TrainingCourse[]> {
  const headers = await getAuthHeaders();
  const response = await axiosInstance.get(`${BASE}/courses`, { headers });
  const data = unwrap<TrainingCourse[]>(response.data, []);
  return Array.isArray(data) ? data : [];
}

export async function getTrainingCourseByIdServerAction(id: string): Promise<TrainingCourse | null> {
  try {
    const headers = await getAuthHeaders();
    const response = await axiosInstance.get(`${BASE}/courses/${id}`, { headers });
    return unwrap<TrainingCourse | null>(response.data, null);
  } catch (error: any) {
    console.error('[getTrainingCourseByIdServerAction]', error?.response?.data || error.message);
    return null;
  }
}

export async function saveTrainingCourseServerAction(
  id: string | null,
  payload: TrainingCoursePayload
): Promise<ActionResult<TrainingCourse>> {
  try {
    const headers = await getAuthHeaders();
    const response = id
      ? await axiosInstance.patch(`${BASE}/courses/${id}`, payload, { headers })
      : await axiosInstance.post(`${BASE}/courses`, payload, { headers });
    return { ok: true, data: unwrap(response.data, response.data) };
  } catch (error: any) {
    console.error('[saveTrainingCourseServerAction]', error?.response?.data || error.message);
    return { ok: false, message: parseServerError(error, 'Failed to save course') };
  }
}

export async function deleteTrainingCourseServerAction(id: string): Promise<ActionResult<void>> {
  try {
    const headers = await getAuthHeaders();
    await axiosInstance.delete(`${BASE}/courses/${id}`, { headers });
    return { ok: true, data: undefined };
  } catch (error: any) {
    console.error('[deleteTrainingCourseServerAction]', error?.response?.data || error.message);
    return { ok: false, message: parseServerError(error, 'Failed to delete course') };
  }
}

// ---- Modules ----

export async function getTrainingModulesServerAction(courseId: string): Promise<TrainingModule[]> {
  try {
    const headers = await getAuthHeaders();
    const response = await axiosInstance.get(`${BASE}/courses/${courseId}/modules`, { headers });
    const data = unwrap<TrainingModule[]>(response.data, []);
    return Array.isArray(data) ? data : [];
  } catch (error: any) {
    console.error('[getTrainingModulesServerAction]', error?.response?.data || error.message);
    return [];
  }
}

export async function getTrainingModuleByIdServerAction(id: string): Promise<TrainingModule | null> {
  try {
    const headers = await getAuthHeaders();
    const response = await axiosInstance.get(`${BASE}/modules/${id}`, { headers });
    return unwrap<TrainingModule | null>(response.data, null);
  } catch (error: any) {
    console.error('[getTrainingModuleByIdServerAction]', error?.response?.data || error.message);
    return null;
  }
}

// id null -> POST under courseId (create); id set -> PATCH /training/modules/{id} (edit, courseId
// unused but accepted for a consistent call shape with the create path).
export async function saveTrainingModuleServerAction(
  courseId: string,
  id: string | null,
  payload: TrainingModulePayload
): Promise<ActionResult<TrainingModule>> {
  try {
    const headers = await getAuthHeaders();
    const response = id
      ? await axiosInstance.patch(`${BASE}/modules/${id}`, payload, { headers })
      : await axiosInstance.post(`${BASE}/courses/${courseId}/modules`, { courseId, ...payload }, { headers });
    return { ok: true, data: unwrap(response.data, response.data) };
  } catch (error: any) {
    console.error('[saveTrainingModuleServerAction]', error?.response?.data || error.message);
    return { ok: false, message: parseServerError(error, 'Failed to save module') };
  }
}

export async function deleteTrainingModuleServerAction(id: string): Promise<ActionResult<void>> {
  try {
    const headers = await getAuthHeaders();
    await axiosInstance.delete(`${BASE}/modules/${id}`, { headers });
    return { ok: true, data: undefined };
  } catch (error: any) {
    console.error('[deleteTrainingModuleServerAction]', error?.response?.data || error.message);
    return { ok: false, message: parseServerError(error, 'Failed to delete module') };
  }
}

// ---- Lessons ----

export async function getTrainingLessonsServerAction(moduleId: string): Promise<TrainingLesson[]> {
  try {
    const headers = await getAuthHeaders();
    const response = await axiosInstance.get(`${BASE}/modules/${moduleId}/lessons`, { headers });
    const data = unwrap<TrainingLesson[]>(response.data, []);
    return Array.isArray(data) ? data : [];
  } catch (error: any) {
    console.error('[getTrainingLessonsServerAction]', error?.response?.data || error.message);
    return [];
  }
}

export async function getTrainingLessonByIdServerAction(id: string): Promise<TrainingLesson | null> {
  try {
    const headers = await getAuthHeaders();
    const response = await axiosInstance.get(`${BASE}/lessons/${id}`, { headers });
    return unwrap<TrainingLesson | null>(response.data, null);
  } catch (error: any) {
    console.error('[getTrainingLessonByIdServerAction]', error?.response?.data || error.message);
    return null;
  }
}

export async function saveTrainingLessonServerAction(
  moduleId: string,
  id: string | null,
  payload: TrainingLessonPayload
): Promise<ActionResult<TrainingLesson>> {
  try {
    const headers = await getAuthHeaders();
    const response = id
      ? await axiosInstance.patch(`${BASE}/lessons/${id}`, payload, { headers })
      : await axiosInstance.post(`${BASE}/modules/${moduleId}/lessons`, { moduleId, ...payload }, { headers });
    return { ok: true, data: unwrap(response.data, response.data) };
  } catch (error: any) {
    console.error('[saveTrainingLessonServerAction]', error?.response?.data || error.message);
    return { ok: false, message: parseServerError(error, 'Failed to save lesson') };
  }
}

export async function deleteTrainingLessonServerAction(id: string): Promise<ActionResult<void>> {
  try {
    const headers = await getAuthHeaders();
    await axiosInstance.delete(`${BASE}/lessons/${id}`, { headers });
    return { ok: true, data: undefined };
  } catch (error: any) {
    console.error('[deleteTrainingLessonServerAction]', error?.response?.data || error.message);
    return { ok: false, message: parseServerError(error, 'Failed to delete lesson') };
  }
}
