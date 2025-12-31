import { Notification, NotificationType } from '../entities/Notification.js';

/**
 * Repository Interface: Notification
 * Defines contract for notification persistence
 */
export interface INotificationRepository {
    /**
     * Find notification by ID
     */
    findById(id: string): Promise<Notification | null>;

    /**
     * Find all notifications for a user
     */
    findByUserId(userId: string): Promise<Notification[]>;

    /**
     * Find unread notifications for a user
     */
    findUnreadByUserId(userId: string): Promise<Notification[]>;

    /**
     * Find notifications by type
     */
    findByType(userId: string, type: NotificationType): Promise<Notification[]>;

    /**
     * Count unread notifications
     */
    countUnread(userId: string): Promise<number>;

    /**
     * Create new notification
     */
    create(notification: Notification): Promise<Notification>;

    /**
     * Mark notification as read
     */
    markAsRead(id: string): Promise<void>;

    /**
     * Mark all notifications as read for a user
     */
    markAllAsRead(userId: string): Promise<void>;

    /**
     * Delete notification
     */
    delete(id: string): Promise<void>;

    /**
     * Delete all notifications for a user
     */
    deleteAll(userId: string): Promise<void>;
}
