import { Request, Response } from 'express';
import { StorageService } from '../database/storage.service.js';

export class IncomeController {
  static async list(req: any, res: Response) {
    try {
      const userId = req.user.userId;
      const incomes = await StorageService.income.findByUser(userId);
      res.json(incomes);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async create(req: any, res: Response) {
    try {
      const userId = req.user.userId;
      const income = await StorageService.income.create({
        userId,
        ...req.body,
      });

      // Create notification
      await StorageService.notifications.create({
        userId,
        type: 'income',
        category: 'income',
        title: 'Income Source Added',
        message: `New income source: ${req.body.sourceName}`,
        isRead: false,
      });

      res.status(201).json(income);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async update(req: any, res: Response) {
    try {
      const { id } = req.params;
      await StorageService.income.update(id, req.body);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async delete(req: any, res: Response) {
    try {
      const { id } = req.params;
      await StorageService.income.delete(id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}

export default IncomeController;
