import { uploadFileServerAction } from './server-actions/media';
import { toast } from 'react-toastify';

export interface UploadResult {
  url: string;
  r2Key?: string;
}

function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

export async function uploadFileToR2(
  file: File,
  module: 'categories' | 'subcategories' | 'services' | 'addons' | 'professional-banners' | 'app-content',
  slug?: string
): Promise<UploadResult> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('module', module);
    if (slug) {
      formData.append('slug', slug);
    }
    formData.append('version', '1');

    const res = await uploadFileServerAction(formData);

    if (!res.ok) {
      throw new Error(res.message || 'Direct upload failed');
    }

    if (res.data && res.data.r2Key) {
      toast.success('File uploaded to Cloudflare R2 storage!');
      return { url: res.data.cdnUrl, r2Key: res.data.r2Key };
    }

    throw new Error('Response data missing r2Key');
  } catch (error: any) {
    console.warn('R2 upload failed, fallback to Data URL:', error);
    try {
      const dataUrl = await fileToDataURL(file);
      toast.success('Image loaded!');
      return { url: dataUrl };
    } catch {
      const localUrl = URL.createObjectURL(file);
      return { url: localUrl };
    }
  }
}
