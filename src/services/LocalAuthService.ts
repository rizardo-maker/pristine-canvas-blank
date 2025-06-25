import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface AuthDB extends DBSchema {
  credentials: {
    key: string;
    value: {
      id: string;
      username: string;
      password: string;
      masterPassword: string;
      createdAt: string;
      isSetup: boolean;
    };
  };
}

interface User {
  id: string;
  username: string;
  createdAt: string;
}

export class LocalAuthService {
  private db: IDBPDatabase<AuthDB> | null = null;
  private readonly MASTER_PASSWORD = 'RaviTeja';

  async init(): Promise<void> {
    try {
      this.db = await openDB<AuthDB>('AuthDatabase', 2, {
        upgrade(db) {
          if (!db.objectStoreNames.contains('credentials')) {
            db.createObjectStore('credentials', { keyPath: 'id' });
          }
        },
      });
    } catch (error) {
      console.error('Failed to initialize IndexedDB:', error);
      throw new Error('Failed to initialize authentication database');
    }
  }

  private hashPassword(password: string): string {
    // Simple hash function - in production, use a proper hashing library
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }

  async isFirstTimeSetup(): Promise<boolean> {
    if (!this.db) await this.init();
    try {
      const credentials = await this.db!.get('credentials', 'user');
      return !credentials || !credentials.isSetup;
    } catch (error) {
      console.error('Error checking setup status:', error);
      return true;
    }
  }

  async setupCredentials(username: string, password: string, masterPassword: string): Promise<{ success: boolean; error?: string }> {
    if (!this.db) await this.init();

    if (masterPassword !== this.MASTER_PASSWORD) {
      return { success: false, error: 'Invalid master password' };
    }

    if (!username.trim() || !password.trim()) {
      return { success: false, error: 'Username and password are required' };
    }

    try {
      const credentials = {
        id: 'user',
        username: username.trim(),
        password: this.hashPassword(password),
        masterPassword: this.hashPassword(masterPassword),
        createdAt: new Date().toISOString(),
        isSetup: true,
      };

      await this.db!.put('credentials', credentials);
      
      // Set authentication state in localStorage
      localStorage.setItem('auth_user', JSON.stringify({
        id: 'user',
        username: username.trim(),
        createdAt: credentials.createdAt,
      }));

      return { success: true };
    } catch (error) {
      console.error('Error setting up credentials:', error);
      return { success: false, error: 'Failed to save credentials' };
    }
  }

  async login(username: string, password: string): Promise<{ success: boolean; error?: string; user?: User }> {
    if (!this.db) await this.init();

    if (!username.trim() || !password.trim()) {
      return { success: false, error: 'Username and password are required' };
    }

    try {
      const credentials = await this.db!.get('credentials', 'user');
      
      if (!credentials) {
        return { success: false, error: 'No credentials found. Please set up your account first.' };
      }

      const hashedPassword = this.hashPassword(password);
      
      if (credentials.username === username.trim() && credentials.password === hashedPassword) {
        const user: User = {
          id: credentials.id,
          username: credentials.username,
          createdAt: credentials.createdAt,
        };

        // Set authentication state
        localStorage.setItem('auth_user', JSON.stringify(user));
        
        return { success: true, user };
      } else {
        return { success: false, error: 'Invalid username or password' };
      }
    } catch (error) {
      console.error('Error during login:', error);
      return { success: false, error: 'Login failed. Please try again.' };
    }
  }

  getCurrentUser(): User | null {
    try {
      const userStr = localStorage.getItem('auth_user');
      if (userStr) {
        return JSON.parse(userStr);
      }
      return null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  logout(): void {
    localStorage.removeItem('auth_user');
  }

  async resetCredentials(): Promise<void> {
    if (!this.db) await this.init();
    try {
      await this.db!.delete('credentials', 'user');
      localStorage.removeItem('auth_user');
    } catch (error) {
      console.error('Error resetting credentials:', error);
    }
  }
}

export const authService = new LocalAuthService();
