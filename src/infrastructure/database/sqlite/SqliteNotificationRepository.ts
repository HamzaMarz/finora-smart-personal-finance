import { Notification, NotificationType } from '../../../domain/entities/Notification.js';
import { INotificationRepository } from '../../../domain/repositories/INotificationRepository.js';
import { StorageService } from '../../../database/storage.service.js';

/**
 * SQLite Implementation of INotificationRepository
 */
export class SqliteNotificationRepository implements INotificationRepository {
    constructor(private readonly storage: typeof StorageService) { }

    async findById(id: string): Promise<Notification | null> {
        const notifications = await this.storage.notifications.findByUser(''); // Need userId
        const raw = notifications.find(n => n.id === id);

        if (!raw) return null;

        return this.toDomain(raw);
    }

    async findByUserId(userId: string): Promise<Notification[]> {
        const rawNotifications = await this.storage.notifications.findByUser(userId);
        return rawNotifications.map(raw => this.toDomain(raw));
    }

    async findUnreadByUserId(userId: string): Promise<Notification[]> {
        const notifications = await this.findByUserId(userId);
        return notifications.filter(n => !n.isRead);
    }

    async findByType(userId: string, type: NotificationType): Promise<Notification[]> {
        const notifications = await this.findByUserId(userId);
        return notifications.filter(n => n.type === type);
    }

    async countUnread(userId: string): Promise<number> {
        const unread = await this.findUnreadByUserId(userId);
        return unread.length;
    }

    async create(notification: Notification): Promise<Notification> {
        const raw = await this.storage.notifications.create({
            userId: notification.userId,
            type: notification.type,
            category: notification.category,
            title: notification.title,
            message: notification.message,
            isRead: notification.isRead
        });

        return this.toDomain(raw);
    }

    async markAsRead(id: string): Promise<void> {
        await this.storage.notifications.markAsRead(id);
    }

    async markAllAsRead(userId: string): Promise<void> {
        await this.storage.notifications.markAllAsRead(userId);
    }

    async delete(id: string): Promise<void> {
        await this.storage.notifications.delete(id);
    }

    async deleteAll(userId: string): Promise<void> {
        await this.storage.notifications.deleteAll(userId);
    }

    /**
     * Maps raw database data to domain Notification entity
     */
    private toDomain(raw: any): Notification {
        return Notification.fromPersistence({
            id: raw.id,
            userId: raw.userId,
            type: raw.type as NotificationType,
            category: raw.category,
            title: raw.title,
            message: raw.message,
            isRead: raw.isRead,
            createdAt: new Date(raw.createdAt || Date.now())
        });
    }
}
