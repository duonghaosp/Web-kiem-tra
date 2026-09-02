import { createClient } from '@supabase/supabase-js';

// Lấy biến môi trường URL và ANON KEY
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project-id.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy';

export const isSupabaseConfigured = Boolean(
  import.meta.env.VITE_SUPABASE_URL &&
  import.meta.env.VITE_SUPABASE_ANON_KEY &&
  !import.meta.env.VITE_SUPABASE_URL.includes('your-project-id')
);

// Khởi tạo Supabase Client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

/**
 * Tải file lên Supabase Storage (Hỗ trợ Banner, Avatar, File ghi âm Voice Note)
 */
export async function uploadToStorage(
  bucket: 'banners' | 'voice-feedback' | 'avatars',
  path: string,
  file: File | Blob,
  contentType?: string
): Promise<{ url: string | null; error: Error | null }> {
  try {
    if (!isSupabaseConfigured) {
      // Nếu chưa kết nối Supabase, tạo Blob URL tạm thời để xem trước
      const localUrl = URL.createObjectURL(file);
      return { url: localUrl, error: null };
    }

    const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
      upsert: true,
      contentType: contentType || file.type || 'application/octet-stream',
    });

    if (error) {
      console.error(`Lỗi tải file lên ${bucket}:`, error);
      return { url: null, error };
    }

    const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(data.path);
    return { url: publicUrlData.publicUrl, error: null };
  } catch (err: any) {
    console.error('Lỗi ngoại lệ uploadToStorage:', err);
    return { url: null, error: err };
  }
}
