import { Request, Response } from 'express';
import { StorageService } from '../database/storage.service.js';

export class InvestmentsController {
    static async list(req: any, res: Response) {
        try {
            const userId = req.user.userId;
            const investments = await StorageService.investments.findByUser(userId);

            // Enrich with profit/loss metrics
            const enriched = investments.map(inv => {
                const profitLoss = (inv.currentValue - inv.buyPrice) * inv.quantity;
                const roi = inv.buyPrice > 0 ? (profitLoss / (inv.buyPrice * inv.quantity)) * 100 : 0;

                return {
                    ...inv,
                    profitLoss,
                    roi
                };
            });

            res.json(enriched);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    static async create(req: any, res: Response) {
        try {
            const userId = req.user.userId;
            const { assetName, assetType, symbol, quantity, buyPrice, currentValue, currency, purchaseDate, notes } = req.body;

            const initialAmount = (buyPrice || 0) * (quantity || 1);

            const investment = await StorageService.investments.create({
                userId,
                assetName,
                assetType: assetType || 'other',
                symbol: symbol || '',
                quantity: quantity || 1,
                buyPrice: buyPrice || 0,
                initialAmount,
                currentValue: currentValue || buyPrice || 0,
                currency: currency || 'USD',
                purchaseDate: purchaseDate || new Date().toISOString(),
                status: 'active',
                notes: notes || ''
            });

            // Create notification
            await StorageService.notifications.create({
                userId,
                type: 'investment',
                category: 'investment',
                title: 'investment_added_notif_title',
                message: JSON.stringify({
                    key: 'investment_added_notif_msg',
                    params: {
                        assetName: assetName,
                        assetType: assetType || 'asset',
                        currency: currency || 'USD',
                        amount: (buyPrice * quantity).toFixed(2)
                    }
                }),
                isRead: false,
            });

            res.status(201).json(investment);
        } catch (error: any) {
            console.error('❌ Error in InvestmentsController.create:', error);
            res.status(400).json({ error: error.message });
        }
    }

    static async update(req: any, res: Response) {
        try {
            const { id } = req.params;
            await StorageService.investments.update(id, req.body);
            res.json({ success: true });
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    static async close(req: any, res: Response) {
        try {
            const { id } = req.params;
            const userId = req.user.userId;
            const { sellPrice, closeDate } = req.body;

            await StorageService.investments.update(id, {
                status: 'closed',
                closeDate: closeDate || new Date().toISOString().split('T')[0],
                sellPrice: sellPrice,
                currentValue: sellPrice // Value at time of closing
            });

            // Create notification
            await StorageService.notifications.create({
                userId,
                type: 'investment',
                category: 'investment',
                title: 'Investment Closed',
                message: `Investment has been closed at ${sellPrice}`,
                isRead: false,
            });

            res.json({ success: true });
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    static async delete(req: any, res: Response) {
        try {
            const { id } = req.params;
            await StorageService.investments.delete(id);
            res.json({ success: true });
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }
}

export default InvestmentsController;
