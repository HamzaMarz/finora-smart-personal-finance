import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { StorageService } from '../database/storage.service.js';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'finora-super-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export class AuthService {
  // Register new user
  async register(data: { email: string; name: string; password: string; baseCurrency?: string; language?: string }) {
    // Check if user already exists
    const existingUser = await StorageService.users.findByEmail(data.email);
    if (existingUser) {
      throw new Error('Email already registered');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 12);

    // Create user
    const user = await StorageService.users.create({
      email: data.email,
      name: data.name,
      passwordHash,
      baseCurrency: data.baseCurrency || 'USD',
      language: data.language || 'en',
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.name}`,
    });

    // Generate token
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN as any,
    });

    // Create welcome notification
    await StorageService.notifications.create({
      userId: user.id,
      type: 'system',
      title: 'Welcome to UrWallet!',
      message: 'Your account has been created successfully. Start managing your finances today.',
      category: 'system',
      isRead: false,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        baseCurrency: user.baseCurrency,
        language: user.language,
        avatar: user.avatar,
        savingsPercentage: user.savingsPercentage,
      },
      token,
    };
  }

  // Login with email and password
  async login(email: string, password: string) {
    const user = await StorageService.users.findByEmail(email);
    if (!user || !user.passwordHash) {
      throw new Error('Invalid credentials');
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN as any,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        baseCurrency: user.baseCurrency,
        language: user.language,
        avatar: user.avatar,
        savingsPercentage: user.savingsPercentage,
      },
      token,
    };
  }

  // Google OAuth login/register
  async googleAuth(googleUser: { email: string; name: string; picture?: string }) {
    // Check if user exists
    let user = await StorageService.users.findByEmail(googleUser.email);

    if (!user) {
      // Create new user with random password (won't be used)
      const randomPassword = crypto.randomBytes(32).toString('hex');
      const passwordHash = await bcrypt.hash(randomPassword, 12);

      user = await StorageService.users.create({
        email: googleUser.email,
        name: googleUser.name,
        passwordHash,
        baseCurrency: 'USD',
        language: 'en',
        avatar: googleUser.picture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${googleUser.name}`,
      });

      // Create welcome notification
      await StorageService.notifications.create({
        userId: user.id,
        type: 'system',
        title: 'Welcome to UrWallet!',
        message: 'Your account has been created via Google. Start managing your finances today.',
        category: 'system',
        isRead: false,
      });
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN as any,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        baseCurrency: user.baseCurrency,
        language: user.language,
        avatar: user.avatar,
        savingsPercentage: user.savingsPercentage,
      },
      token,
    };
  }

  // Validate JWT token
  async validateToken(token: string): Promise<{ userId: string; email: string } | null> {
    try {
      const payload = jwt.verify(token, JWT_SECRET) as { userId: string; email: string };
      return payload;
    } catch {
      return null;
    }
  }

  // Generate password reset token
  async generateResetToken(email: string): Promise<string> {
    const user = await StorageService.users.findByEmail(email);
    if (!user) {
      throw new Error('User not found');
    }

    // Generate reset token (valid for 1 hour)
    const resetToken = jwt.sign({ userId: user.id, type: 'reset' }, JWT_SECRET, {
      expiresIn: '1h',
    });

    // TODO: Send email with reset link using SendGrid
    // For now, just return the token
    return resetToken;
  }

  // Reset password with token
  async resetPassword(resetToken: string, newPassword: string): Promise<void> {
    try {
      const payload = jwt.verify(resetToken, JWT_SECRET) as { userId: string; type: string };

      if (payload.type !== 'reset') {
        throw new Error('Invalid reset token');
      }

      const passwordHash = await bcrypt.hash(newPassword, 12);
      await StorageService.users.update(payload.userId, { passwordHash } as any);
    } catch {
      throw new Error('Invalid or expired reset token');
    }
  }
}

export default AuthService;
