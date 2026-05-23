import { createClient } from "@supabase/supabase-js";

let supabaseAdminInstance: ReturnType<typeof createClient> | null = null;

export function getSupabaseAdmin() {
  if (!supabaseAdminInstance) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
      throw new Error("Missing required Supabase environment variables");
    }

    supabaseAdminInstance = createClient(url, key, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return supabaseAdminInstance;
}

// For backward compatibility
export const supabaseAdmin = new Proxy({} as any, {
  get: (target, prop) => {
    return getSupabaseAdmin()[prop as keyof typeof supabaseAdminInstance];
  },
});