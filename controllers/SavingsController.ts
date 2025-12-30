import { Request, Response } from 'express';
import { StorageService } from '../database/storage.service.js';

export class SavingsController {
    static async list(req: any, res: Response) {
        try {
            const userId = req.user.userId;
            const savings = await StorageService.savings.findByUser(userId);
            res.json(savings);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    static async create(req: any, res: Response) {
        try {
            const userId = req.user.userId;
            const saving = await StorageService.savings.create({
                userId,
                ...req.body,
            });

            // Create notification
            await StorageService.notifications.create({
                userId,
                type: 'saving',
                category: 'savings',
                title: 'Saving Added',
                message: `You saved $${req.body.amount.toFixed(2)}`,
                isRead: false,
            });

            res.status(201).json(saving);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    static async update(req: any, res: Response) {
        try {
            const { id } = req.params;
            await StorageService.savings.update(id, req.body);
            res.json({ success: true });
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    static async delete(req: any, res: Response) {
        try {
            const { id } = req.params;
            await StorageService.savings.delete(id);
            res.json({ success: true });
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }
}

export default SavingsController;
