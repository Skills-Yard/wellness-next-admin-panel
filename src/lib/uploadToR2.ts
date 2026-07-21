import { getUploadUrlServerAction } from './server-actions/media';
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
    const res = await getUploadUrlServerAction({
      fileName: file.name,
      contentType: file.type || 'image/jpeg',
      module,
      slug: slug || 'default',
    });

    if (res.ok && res.data.uploadUrl) {
      const { uploadUrl, r2Key, cdnUrl } = res.data;

      // Direct upload to Cloudflare R2 presigned URL
      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type || 'image/jpeg',
        },
        body: file,
      });

      if (uploadRes.ok) {
        toast.success('File uploaded to Cloudflare R2 storage!');
        return { url: cdnUrl || uploadUrl, r2Key };
      }
    }

    // Convert file to Base64 Data URL so image persists in DB
    const dataUrl = await fileToDataURL(file);
    toast.success('Image loaded successfully!');
    return { url: dataUrl, r2Key: file.name };
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
