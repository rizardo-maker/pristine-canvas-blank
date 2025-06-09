
// Placeholder supabase client for compatibility
export const supabase = {
  auth: {
    signUp: async (options?: any) => ({ data: null, error: new Error('Supabase not configured') }),
    signInWithPassword: async (credentials?: any) => ({ data: null, error: new Error('Supabase not configured') }),
    signInWithOAuth: async (options?: any) => ({ data: null, error: new Error('Supabase not configured') }),
    signOut: async (options?: any) => ({ error: null }),
    getUser: async () => ({ data: { user: null }, error: null }),
    getSession: async () => ({ data: { session: null }, error: null }),
    onAuthStateChange: (callback?: any) => ({ 
      data: { 
        subscription: { 
          unsubscribe: () => {} 
        } 
      } 
    })
  }
};

export type { User } from '@supabase/supabase-js';
