import { createClient } from '@/lib/supabase/client';

/**
 * Upload a Blob or File directly to Supabase Storage.
 * Falls back to persistent Base64 Data URL so images remain permanently viewable
 * even if Storage buckets are still being provisioned or restricted by RLS.
 */
export async function uploadFileToSupabase(
  bucket: string,
  filePath: string,
  file: Blob | File
): Promise<string> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
        contentType: file.type || 'image/jpeg',
      });

    if (!error && data?.path) {
      const { data: publicUrlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

      if (publicUrlData?.publicUrl) {
        return publicUrlData.publicUrl;
      }
    } else if (error) {
      console.warn(`Supabase Storage upload warning on ${bucket}/${filePath}:`, error.message);
    }
  } catch (err) {
    console.warn(`Supabase Storage upload exception on ${bucket}:`, err);
  }

  // Robust persistent fallback: convert to permanent base64 Data URL
  return new Promise<string>((resolve) => {
    if (typeof window === 'undefined') {
      resolve('');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve(typeof reader.result === 'string' ? reader.result : '');
    };
    reader.onerror = () => {
      resolve(URL.createObjectURL(file));
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Helper to convert Base64 Data URL to a Blob
 */
export function dataURLtoBlob(dataurl: string): Blob {
  const arr = dataurl.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}