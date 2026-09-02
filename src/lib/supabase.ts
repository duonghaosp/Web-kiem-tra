import { createClient } from '@supabase/supabase-js';

// URL và Public Anon Key của dự án Supabase Cô Hảo
// Khóa Anon là khóa công khai (Public) của Supabase, an toàn để tích hợp trên Web / Mobile
const DEFAULT_SUPABASE_URL = 'https://tdtrrdjslpezsmomgenz.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkdHJyZGpzbHBlenNtb21nZW56Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgwNzM4MzYsImV4cCI6MjEwMzY0OTgzNn0.88A6T3_rdSgycWWeVcoJ0WDwbTjstGrNLlhNlQ-ZiwM';

const supabaseUrl =
  (import.meta.env.VITE_SUPABASE_URL && !import.meta.env.VITE_SUPABASE_URL.includes('your-project-id'))
    ? import.meta.env.VITE_SUPABASE_URL
    : DEFAULT_SUPABASE_URL;

const supabaseAnonKey =
  (import.meta.env.VITE_SUPABASE_ANON_KEY && !import.meta.env.VITE_SUPABASE_ANON_KEY.includes('dummy'))
    ? import.meta.env.VITE_SUPABASE_ANON_KEY
    : DEFAULT_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  !supabaseUrl.includes('your-project-id')
);

// Khởi tạo Supabase Client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
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
