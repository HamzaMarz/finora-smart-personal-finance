import { StorageService } from '../database/storage.service.js';
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';

const BACKUP_DIR = process.env.BACKUP_DIRECTORY || './backups';
const MASTER_KEY = process.env.BACKUP_MASTER_KEY || 'default-master-key-change-this';

export class BackupService {
  // Ensure backup directory exists
  private async ensureBackupDir(): Promise<void> {
    try {
      await fs.mkdir(BACKUP_DIR, { recursive: true });
    } catch (error) {
      console.error('Failed to create backup directory:', error);
    }
  }

  // Encrypt data using AES-256-GCM
  private encrypt(data: string, password: string): string {
    const iv = crypto.randomBytes(16);
    const key = crypto.scryptSync(password, MASTER_KEY, 32);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return JSON.stringify({
      iv: iv.toString('hex'),
      data: encrypted,
      authTag: authTag.toString('hex'),
    });
  }

  // Decrypt data
  private decrypt(encryptedData: string, password: string): string {
    const { iv, data, authTag } = JSON.parse(encryptedData);
    const key = crypto.scryptSync(password, MASTER_KEY, 32);
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(iv, 'hex'));

    decipher.setAuthTag(Buffer.from(authTag, 'hex'));

    let decrypted = decipher.update(data, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  // Create backup for a user
  async createBackup(userId: string, password: string): Promise<string> {
    try {
      // Gather all user data
      const userData = {
        incomes: await StorageService.income.findByUser(userId),
        expenses: await StorageService.expenses.findByUser(userId),
        savings: await StorageService.savings.findByUser(userId),
        investments: await StorageService.investments.findByUser(userId),
        notifications: await StorageService.notifications.findByUserId(userId),
        reports: await StorageService.reports.findByUser(userId),
        timestamp: new Date().toISOString(),
      };

      // Encrypt the data
      const encryptedData = this.encrypt(JSON.stringify(userData), password);

      // Save to database
      const backupId = crypto.randomUUID();
      await this.ensureBackupDir();

      // Also save to file system
      const filename = `backup-${userId}-${Date.now()}.enc`;
      const filepath = path.join(BACKUP_DIR, filename);
      await fs.writeFile(filepath, encryptedData);

      console.log(`✅ Backup created: ${filename}`);
      return backupId;
    } catch (error) {
      console.error('Backup creation failed:', error);
      throw new Error('Failed to create backup');
    }
  }

  // Restore backup
  async restoreBackup(userId: string, encryptedData: string, password: string): Promise<void> {
    try {
      // Decrypt data
      const decryptedData = this.decrypt(encryptedData, password);
      const userData = JSON.parse(decryptedData);

      // TODO: Implement restore logic
      // This would involve clearing current data and inserting backup data
      // For now, just validate the decryption worked

      console.log(`✅ Backup validated for user ${userId}`);
    } catch (error) {
      console.error('Backup restore failed:', error);
      throw new Error('Failed to restore backup. Check your password.');
    }
  }

  // Export user data as JSON
  async exportData(userId: string): Promise<any> {
    return {
      incomes: await StorageService.income.findByUser(userId),
      expenses: await StorageService.expenses.findByUser(userId),
      savings: await StorageService.savings.findByUser(userId),
      investments: await StorageService.investments.findByUser(userId),
      notifications: await StorageService.notifications.findByUserId(userId),
      reports: await StorageService.reports.findByUser(userId),
      exportedAt: new Date().toISOString(),
    };
  }

  // List available backups
  async listBackups(userId: string): Promise<string[]> {
    await this.ensureBackupDir();
    const files = await fs.readdir(BACKUP_DIR);
    return files.filter(f => f.includes(userId) && f.endsWith('.enc'));
  }
}

export default BackupService;
