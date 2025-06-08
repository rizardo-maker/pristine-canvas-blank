
// Mock Supabase client for compatibility
interface MockUser {
  id: string;
  email?: string;
}

interface MockSession {
  user: MockUser;
  access_token: string;
}

interface MockAuthResponse {
  data?: {
    user?: MockUser;
    session?: MockSession;
  };
  error?: {
    message: string;
  };
}

interface MockAuth {
  signInWithPassword: (credentials: { email: string; password: string }) => Promise<MockAuthResponse>;
  signUp: (credentials: { email: string; password: string; options?: any }) => Promise<MockAuthResponse>;
  signInWithOAuth: (options: { provider: string; options?: any }) => Promise<MockAuthResponse>;
  signOut: (options?: { scope?: string }) => Promise<void>;
  getSession: () => Promise<{ data: { session: MockSession | null } }>;
  onAuthStateChange: (callback: (event: string, session: MockSession | null) => void) => { data: { subscription: { unsubscribe: () => void } } };
}

interface MockSupabaseClient {
  auth: MockAuth;
}

// Mock implementation
const mockAuth: MockAuth = {
  signInWithPassword: async () => ({ error: { message: 'Supabase not configured' } }),
  signUp: async () => ({ error: { message: 'Supabase not configured' } }),
  signInWithOAuth: async () => ({ error: { message: 'Supabase not configured' } }),
  signOut: async () => {},
  getSession: async () => ({ data: { session: null } }),
  onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
};

export const supabase: MockSupabaseClient = {
  auth: mockAuth,
};
