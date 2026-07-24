'use server';

import axiosInstance from '../axios';
import { ServicePackage } from '../../types/catalogue';
import { ActionResult } from './category';
import { parseServerError } from '../errorParser';

export async function getServicePackagesServerAction(serviceItemId?: string): Promise<ServicePackage[]> {
  try {
    const response = await axiosInstance.get('/admin/catalog/service-packages', {
      params: serviceItemId ? { serviceItemId } : undefined,
    });
    return response.data || [];
  } catch (error: any) {
    console.error('[getServicePackagesServerAction]', error?.response?.data || error.message);
    return [];
  }
}

export async function saveServicePackageServerAction(
  id: string | null,
  payload: {
    serviceItemId: string;
    sessions: number;
    price: number;
    originalPrice?: number;
    savings?: number;
    savingsPercent?: number;
    label?: string;
  }
): Promise<ActionResult<ServicePackage>> {
  try {
    if (id) {
      const response = await axiosInstance.patch(`/admin/catalog/service-packages/${id}`, payload);
      return { ok: true, data: response.data };
    } else {
      const response = await axiosInstance.post('/admin/catalog/service-packages', payload);
      return { ok: true, data: response.data };
    }
  } catch (error: any) {
    console.error('[saveServicePackageServerAction]', error?.response?.data || error.message);
    return { ok: false, message: parseServerError(error, 'Failed to save service package') };
  }
}

export async function deleteServicePackageServerAction(id: string): Promise<ActionResult<void>> {
  try {
    await axiosInstance.delete(`/admin/catalog/service-packages/${id}`);
    return { ok: true, data: undefined };
  } catch (error: any) {
    console.error('[deleteServicePackageServerAction]', error?.response?.data || error.message);
    return { ok: false, message: parseServerError(error, 'Failed to delete service package') };
  }
}
