import IndexedDBService from '../database/indexeddb';
import { EncryptionService } from './EncryptionService';

// Google Drive API Configurations
// Google Drive API Configurations
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '412748045534-gfv6qmfoeap07hg8jclth7jue9cl5g48.apps.googleusercontent.com';
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

// Types
interface BackupMetadata {
  id: string; // Drive File ID
  name: string;
  createdTime: string;
}

export class BackupService {
  private tokenClient: any;
  private accessToken: string | null = null;
  private tokenExpiration: number = 0;

  constructor() {
    this.initializeGoogleClient();
  }

  private initializeGoogleClient() {
    if ((window as any).google) {
      this.tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: (tokenResponse: any) => {
          this.accessToken = tokenResponse.access_token;
          this.tokenExpiration = Date.now() + (tokenResponse.expires_in * 1000);
          // If this was triggered by a specific action waiting for token, we could resume it here
          // primarily we use await waitForToken() pattern if needed, but GIS is callback based.
        },
      });
    }
  }

  /**
   * Request the user for Drive access permission
   */
  public requestAccess(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.tokenClient) {
        this.initializeGoogleClient();
        if (!this.tokenClient) return reject('Google Identity Services not loaded');
      }

      this.tokenClient.callback = (resp: any) => {
        if (resp.error) {
          reject(resp);
        } else {
          this.accessToken = resp.access_token;
          this.tokenExpiration = Date.now() + (resp.expires_in * 1000);
          resolve(this.accessToken!);
        }
      };

      this.tokenClient.requestAccessToken({ prompt: 'consent' });
    });
  }

  /**
   * Gathers all data from IndexedDB, encrypts it, and creates a backup file
   * @param silent If true, suppresses permission prompts and fails if token is invalid
   */
  public async createBackup(silent: boolean = false): Promise<void> {
    // 1. Gather Data
    const backupData = {
      users: await IndexedDBService.getAll('users'),
      income: await IndexedDBService.getAll('income_sources'),
      expenses: await IndexedDBService.getAll('expenses'),
      savings: await IndexedDBService.getAll('savings'),
      investments: await IndexedDBService.getAll('investments'),
      notifications: await IndexedDBService.getAll('notifications'),
      backupTimestamp: new Date().toISOString(),
      version: '1.0'
    };

    // 2. Encrypt
    const encryptedData = EncryptionService.encrypt(backupData);

    // 3. Upload
    const fileName = `finora_backup_${new Date().toISOString().replace(/[:.]/g, '-')}.finora`;
    await this.uploadToDrive(fileName, encryptedData, silent);
  }

  /**
   * Uploads content to Google Drive
   */
  private async uploadToDrive(fileName: string, content: string, silent: boolean = false): Promise<void> {
    if (!this.accessToken || Date.now() > this.tokenExpiration) {
      if (silent) {
        console.warn('Silent backup skipped: No valid Google Drive token');
        return; // Silently abort
      }
      await this.requestAccess();
    }

    const metadata = {
      name: fileName,
      mimeType: 'application/octet-stream',
      // parents: ['appDataFolder'] // Optional: Use AppData folder for invisible backups
    };

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', new Blob([content], { type: 'application/octet-stream' }));

    const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: new Headers({ 'Authorization': 'Bearer ' + this.accessToken }),
      body: form
    });

    if (!response.ok) {
      throw new Error(`Drive Upload Failed: ${response.statusText}`);
    }

    console.log('✅ Backup uploaded successfully:', fileName);
  }

  /**
   * Restores data from the latest backup
   */
  public async restoreLatestBackup(): Promise<void> {
    // Logic to list files, pick latest "finora_backup_*.finora", download, decrypt, and load into IDB
    // This is a placeholder for the "Import" functionality requested
    const files = await this.listFiles();
    if (files.length === 0) throw new Error("No backups found");

    const latest = files[0]; // Assuming listFiles returns sorted
    const content = await this.downloadFile(latest.id);
    const data = EncryptionService.decrypt(content);

    await this.applyBackup(data);
  }

  private async listFiles(): Promise<BackupMetadata[]> {
    if (!this.accessToken || Date.now() > this.tokenExpiration) {
      await this.requestAccess();
    }

    const query = "name contains 'finora_backup_' and trashed = false";
    const response = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&orderBy=createdTime desc`, {
      headers: new Headers({ 'Authorization': 'Bearer ' + this.accessToken }),
    });

    if (!response.ok) throw new Error('Failed to list backups');

    const json = await response.json();
    return json.files.map((f: any) => ({
      id: f.id,
      name: f.name,
      createdTime: f.createdTime
    }));
  }

  private async downloadFile(fileId: string): Promise<string> {
    const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
      headers: new Headers({ 'Authorization': 'Bearer ' + this.accessToken }),
    });
    return await response.text();
  }

  private async applyBackup(data: any): Promise<void> {
    // Clear current DB (optional, or merge)
    // For strict restore, clearing is safer
    // But we need to be careful about not deleting user identity if it's the same user

    if (data.income) {
      await IndexedDBService.clear('income_sources');
      for (const item of data.income) await IndexedDBService.update('income_sources', item);
    }
    if (data.expenses) {
      await IndexedDBService.clear('expenses');
      for (const item of data.expenses) await IndexedDBService.update('expenses', item);
    }
    if (data.savings) {
      await IndexedDBService.clear('savings');
      for (const item of data.savings) await IndexedDBService.update('savings', item);
    }
    if (data.investments) {
      await IndexedDBService.clear('investments');
      for (const item of data.investments) await IndexedDBService.update('investments', item);
    }
    if (data.notifications) {
      await IndexedDBService.clear('notifications');
      for (const item of data.notifications) await IndexedDBService.update('notifications', item);
    }

    // 4. Send to Backend to sync (Critical for Online Mode)
    try {
      console.log('📡 Syncing restored data to backend...');
      // We need to fetch the token to send to backend if we use raw fetch, 
      // or use the 'api' instance if we can import it.
      // Since this is a service, we can try importing 'api'.
      // Dynamic import to avoid circular dependency issues if any? 
      // Standard import is fine.
      const api = (await import('./api')).default;
      await api.post('/api/data/restore', data);
      console.log('✅ Backend sync successful');
    } catch (err) {
      console.error('❌ Backend sync failed:', err);
      // We don't stop the restore, but warn user?
    }

    console.log('✅ Backup restored successfully');
    window.location.reload(); // Reload to reflect changes
  }
}

export const backupService = new BackupService();
