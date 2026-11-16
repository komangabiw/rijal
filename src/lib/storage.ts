import { createClient } from '@/lib/supabase/client';

/**
 * Upload a Blob or File directly to Supabase Storage
 * Returns the public URL (or path for private buckets)
 */
export async function uploadFileToSupabase(
  bucket: string,
  filePath: string,
  file: Blob | File
): Promise<string> {
  const supabase = createClient();

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true,
      contentType: file.type || 'image/jpeg',
    });

  if (error) {
    console.warn(`Storage upload to ${bucket}/${filePath} failed, using local blob URL fallback:`, error.message);
    return URL.createObjectURL(file);
  }

  // Get public URL
  const { data: publicUrlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path);

  return publicUrlData.publicUrl || URL.createObjectURL(file);
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
