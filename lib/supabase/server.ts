const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Check if we're in build phase - allow missing env vars
const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build' ||
  process.env.NODE_ENV === 'development' && !process.env.NEXT_PUBLIC_SUPABASE_URL;

// Only validate at runtime, not during build
if (!isBuildTime && (typeof window === 'undefined')) {
  if (!supabaseUrl) {
    console.warn('Warning: NEXT_PUBLIC_SUPABASE_URL not set');
  }
  if (!supabaseAnonKey) {
    console.warn('Warning: NEXT_PUBLIC_SUPABASE_ANON_KEY not set');
  }
}

const baseUrl = `${supabaseUrl?.replace(/\/$/, '')}/rest/v1`;

export async function supabaseRequest<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase Environment Variables");
  }

  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
      ...(init.headers || {}),
    },
    cache: 'no-store',
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const message = data?.message || data?.error || 'Supabase request failed.';
    throw new Error(message);
  }

  return data as T;
}
