
interface User {
  id: string;
  username: string;
  createdAt: string;
}

interface AuthResult {
  success: boolean;
  user?: User;
  error?: string;
}

class LocalAuthService {
  private currentUser: User | null = null;
  private readonly STORAGE_KEY = 'local_auth_data';
  private readonly SESSION_KEY = 'current_session';

  async init(): Promise<void> {
    // Check if user is logged in
    const sessionData = localStorage.getItem(this.SESSION_KEY);
    if (sessionData) {
      try {
        this.currentUser = JSON.parse(sessionData);
      } catch (error) {
        localStorage.removeItem(this.SESSION_KEY);
      }
    }
  }

  async isFirstTimeSetup(): Promise<boolean> {
    const authData = localStorage.getItem(this.STORAGE_KEY);
    return !authData;
  }

  async setupCredentials(username: string, password: string, masterPassword: string): Promise<AuthResult> {
    try {
      const user: User = {
        id: 'user_' + Date.now(),
        username,
        createdAt: new Date().toISOString(),
      };

      const authData = {
        user,
        passwordHash: await this.hashPassword(password),
        masterPasswordHash: await this.hashPassword(masterPassword),
      };

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(authData));
      localStorage.setItem(this.SESSION_KEY, JSON.stringify(user));
      this.currentUser = user;

      return { success: true, user };
    } catch (error) {
      return { success: false, error: 'Failed to setup credentials' };
    }
  }

  async login(username: string, password: string): Promise<AuthResult> {
    try {
      const authData = localStorage.getItem(this.STORAGE_KEY);
      if (!authData) {
        return { success: false, error: 'No credentials found' };
      }

      const { user, passwordHash } = JSON.parse(authData);
      const inputPasswordHash = await this.hashPassword(password);

      if (user.username !== username || passwordHash !== inputPasswordHash) {
        return { success: false, error: 'Invalid credentials' };
      }

      localStorage.setItem(this.SESSION_KEY, JSON.stringify(user));
      this.currentUser = user;

      return { success: true, user };
    } catch (error) {
      return { success: false, error: 'Login failed' };
    }
  }

  logout(): void {
    localStorage.removeItem(this.SESSION_KEY);
    this.currentUser = null;
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  async resetCredentials(): Promise<void> {
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.SESSION_KEY);
    this.currentUser = null;
  }

  private async hashPassword(password: string): Promise<string> {
    // Simple hash for demo purposes - in production, use proper hashing
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
}

export const authService = new LocalAuthService();
