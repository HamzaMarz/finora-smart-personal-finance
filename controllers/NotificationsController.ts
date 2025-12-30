import { Request, Response } from 'express';
import { StorageService } from '../database/storage.service.js';

export class NotificationsController {
    static async getAll(req: any, res: Response) {
        try {
            const userId = req.user.userId;
            const category = req.query.category as string | undefined;

            const notifications = await StorageService.notifications.findByUserId(userId, category);
            res.json(notifications);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    static async create(req: any, res: Response) {
        try {
            const userId = req.user.userId;
            const { title, message, category } = req.body;

            const notification = await StorageService.notifications.create({
                userId,
                title,
                message,
                type: 'system',
                category: category || 'system',
                isRead: false,
            });

            res.status(201).json(notification);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    static async markAsRead(req: any, res: Response) {
        try {
            const { id } = req.params;
            await StorageService.notifications.markAsRead(id);
            res.json({ message: 'Notification marked as read' });
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    static async markAllAsRead(req: any, res: Response) {
        try {
            const userId = req.user.userId;
            await StorageService.notifications.markAllAsRead(userId);
            res.json({ message: 'All notifications marked as read' });
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    static async delete(req: any, res: Response) {
        try {
            const { id } = req.params;
            await StorageService.notifications.delete(id);
            res.json({ message: 'Notification deleted' });
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    static async deleteAll(req: any, res: Response) {
        try {
            const userId = req.user.userId;
            await StorageService.notifications.deleteAll(userId);
            res.json({ message: 'All notifications deleted' });
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    static async getUnreadCount(req: any, res: Response) {
        try {
            const userId = req.user.userId;
            const count = await StorageService.notifications.getUnreadCount(userId);
            res.json({ count });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
}

export default NotificationsController;
