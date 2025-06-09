
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
  private storageKey = 'local_auth_data';
  private currentUserKey = 'current_user';

  async init(): Promise<void> {
    // Initialize the service
    console.log('LocalAuthService initialized');
  }

  async isFirstTimeSetup(): Promise<boolean> {
    const authData = localStorage.getItem(this.storageKey);
    return !authData;
  }

  async setupCredentials(username: string, password: string, masterPassword: string): Promise<AuthResult> {
    try {
      const user: User = {
        id: 'user_' + Date.now(),
        username,
        createdAt: new Date().toISOString()
      };

      const authData = {
        user,
        passwordHash: btoa(password), // Simple encoding for demo
        masterPasswordHash: btoa(masterPassword)
      };

      localStorage.setItem(this.storageKey, JSON.stringify(authData));
      localStorage.setItem(this.currentUserKey, JSON.stringify(user));

      return { success: true, user };
    } catch (error) {
      return { success: false, error: 'Setup failed' };
    }
  }

  async login(username: string, password: string): Promise<AuthResult> {
    try {
      const authDataString = localStorage.getItem(this.storageKey);
      if (!authDataString) {
        return { success: false, error: 'No user data found' };
      }

      const authData = JSON.parse(authDataString);
      const passwordHash = btoa(password);

      if (authData.user.username === username && authData.passwordHash === passwordHash) {
        localStorage.setItem(this.currentUserKey, JSON.stringify(authData.user));
        return { success: true, user: authData.user };
      }

      return { success: false, error: 'Invalid credentials' };
    } catch (error) {
      return { success: false, error: 'Login failed' };
    }
  }

  getCurrentUser(): User | null {
    try {
      const userString = localStorage.getItem(this.currentUserKey);
      return userString ? JSON.parse(userString) : null;
    } catch (error) {
      return null;
    }
  }

  logout(): void {
    localStorage.removeItem(this.currentUserKey);
  }

  async resetCredentials(): Promise<void> {
    localStorage.removeItem(this.storageKey);
    localStorage.removeItem(this.currentUserKey);
  }
}

export const authService = new LocalAuthService();
