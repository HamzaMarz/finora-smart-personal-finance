
import api from './api';
import IndexedDBService from '../database/indexeddb';

const calculateSummary = async () => {
  const incomes = await IndexedDBService.getAll('income_sources');
  const expenses = await IndexedDBService.getAll('expenses');
  const savings = await IndexedDBService.getAll('savings');
  const investments = await IndexedDBService.getAll('investments');

  const totalIncome = incomes.reduce((sum, item) => sum + item.amount, 0); // Simplified: assumes monthly for now or raw sum
  const totalExpenses = expenses.reduce((sum, item) => sum + item.amount, 0);
  const totalSavings = savings.reduce((sum, item) => sum + item.amount, 0);
  const totalInvestments = investments.reduce((sum, item) => sum + item.currentValue, 0);

  return {
    netWorth: totalSavings + totalInvestments, // Basic calc
    income: totalIncome,
    expenses: totalExpenses,
    savings: totalSavings
  };
};

export const FinanceService = {
  // Dashboard
  getSummary: async () => {
    try {
      const response = await api.get('/summary');
      return response.data;
    } catch (err) {
      console.warn('API/Network Error, falling back to IndexedDB');
      return await calculateSummary();
    }
  },

  // Income
  getIncomes: async () => {
    try {
      const response = await api.get('/income');
      return response.data;
    } catch (err) {
      return await IndexedDBService.getAll('income_sources');
    }
  },

  createIncome: async (data: any) => {
    try {
      const response = await api.post('/income', data);
      return response.data;
    } catch (err) {
      await IndexedDBService.create('income_sources', { ...data, id: crypto.randomUUID(), userId: 'demo-1' });
      return data;
    }
  },

  updateIncome: async (id: string, data: any) => {
    try {
      await api.put(`/income/${id}`, data);
    } catch (err) {
      await IndexedDBService.update('income_sources', { ...data, id });
    }
  },

  deleteIncome: async (id: string) => {
    try {
      await api.delete(`/income/${id}`);
    } catch (err) {
      await IndexedDBService.delete('income_sources', id);
    }
  },

  // Expenses
  getExpenses: async () => {
    try {
      const response = await api.get('/expenses');
      return response.data;
    } catch (err) {
      return await IndexedDBService.getAll('expenses');
    }
  },

  createExpense: async (data: any) => {
    try {
      const response = await api.post('/expenses', data);
      return response.data;
    } catch (err) {
      await IndexedDBService.create('expenses', { ...data, id: crypto.randomUUID(), userId: 'demo-1' });
      return data;
    }
  },

  updateExpense: async (id: string, data: any) => {
    try {
      await api.put(`/expenses/${id}`, data);
    } catch (err) {
      await IndexedDBService.update('expenses', { ...data, id });
    }
  },

  deleteExpense: async (id: string) => {
    try {
      await api.delete(`/expenses/${id}`);
    } catch (err) {
      await IndexedDBService.delete('expenses', id);
    }
  },

  // Savings (was missing in previous view but likely needed)
  getSavings: async () => {
    try {
      const response = await api.get('/savings');
      return response.data;
    } catch (err) {
      return await IndexedDBService.getAll('savings');
    }
  },

  createSaving: async (data: any) => {
    try {
      const response = await api.post('/savings', data);
      return response.data;
    } catch (err) {
      await IndexedDBService.create('savings', { ...data, id: crypto.randomUUID(), userId: 'demo-1' });
      return data;
    }
  },

  updateSaving: async (id: string, data: any) => {
    try {
      await api.put(`/savings/${id}`, data);
    } catch (err) {
      await IndexedDBService.update('savings', { ...data, id });
    }
  },

  deleteSaving: async (id: string) => {
    try {
      await api.delete(`/savings/${id}`);
    } catch (err) {
      await IndexedDBService.delete('savings', id);
    }
  },

  // Investments
  getInvestments: async () => {
    try {
      const response = await api.get('/investments');
      return response.data;
    } catch (err) {
      return await IndexedDBService.getAll('investments');
    }
  },

  createInvestment: async (data: any) => {
    try {
      const response = await api.post('/investments', data);
      return response.data;
    } catch (err) {
      await IndexedDBService.create('investments', { ...data, id: crypto.randomUUID(), userId: 'demo-1' });
      return data;
    }
  },

  updateInvestment: async (id: string, data: any) => {
    try {
      await api.put(`/investments/${id}`, data);
    } catch (err) {
      await IndexedDBService.update('investments', { ...data, id });
    }
  },

  deleteInvestment: async (id: string) => {
    try {
      await api.delete(`/investments/${id}`);
    } catch (err) {
      await IndexedDBService.delete('investments', id);
    }
  },

  closeInvestment: async (id: string, data: { sellPrice: number, closeDate: string }) => {
    try {
      await api.put(`/investments/${id}/close`, data);
    } catch (err) {
      // Find local investment and update it to closed
      const inv = await IndexedDBService.getById('investments', id);
      if (inv) {
        await IndexedDBService.update('investments', {
          ...inv,
          status: 'closed',
          currentValue: data.sellPrice,
          closeDate: data.closeDate
        });
      }
    }
  },

  // Reports
  getReportsData: async (periodStart: string, periodEnd: string) => {
    try {
      const response = await api.get(`/reports/generate?periodStart=${periodStart}&periodEnd=${periodEnd}`);
      return response.data;
    } catch (err) {
      // Fallback: Generate reports from IndexedDB
      console.warn('Calculating reports offline');

      const incomes = await IndexedDBService.getAll('income_sources');
      const expenses = await IndexedDBService.getAll('expenses');
      const savings = await IndexedDBService.getAll('savings');
      const investments = await IndexedDBService.getAll('investments');

      // Filter by date range (simplistic check)
      const start = new Date(periodStart);
      const end = new Date(periodEnd);

      // Calculate totals
      const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0);
      const totalExpenses = expenses.filter(e => {
        const d = new Date(e.expenseDate);
        return d >= start && d <= end;
      }).reduce((sum, e) => sum + e.amount, 0);

      const totalSavings = savings.filter(s => {
        const d = new Date(s.savingDate);
        return d >= start && d <= end;
      }).reduce((sum, s) => sum + s.amount, 0);

      const totalInvested = investments.reduce((sum, i) => sum + (i.initialAmount || 0), 0);
      const currentInvValue = investments.reduce((sum, i) => sum + (i.currentValue || 0), 0);

      // Mock Chart Data
      const expensesByCategory = Object.values(expenses.reduce((acc: any, curr) => {
        acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
        return acc;
      }, {})).map((val, idx: number) => ({ name: Object.keys(expenses.reduce((acc: any, c) => { acc[c.category] = (acc[c.category] || 0) + c.amount; return acc; }, {}))[idx], value: val }));

      return {
        period: { start: periodStart, end: periodEnd },
        summary: {
          totalIncome,
          totalExpenses,
          totalSavings,
          totalInvestments: currentInvValue,
          netWorth: totalSavings + currentInvValue, // simplified
          investedCapital: totalInvested,
          investmentROI: totalInvested ? ((currentInvValue - totalInvested) / totalInvested) * 100 : 0
        },
        charts: {
          expensesByCategory: expensesByCategory,
          monthlyTrend: [] // tough to mock dynamically quickly, return empty or static
        },
        details: {
          incomes,
          expenses: expenses.filter(e => new Date(e.expenseDate) >= start && new Date(e.expenseDate) <= end),
          savings: savings.filter(s => new Date(s.savingDate) >= start && new Date(s.savingDate) <= end),
          investments
        }
      };
    }
  },

  // AI Insights
  getAiInsights: async (language: string = 'en') => {
    try {
      const response = await api.get(`/ai-insights?lang=${language}`);
      return response.data;
    } catch (err) {
      // Return rich mock insights for demo mode
      return {
        insights: [
          {
            title: language === 'ar' ? 'تحليل الإنفاق الشهري' : 'Monthly Spending Analysis',
            detailed_analysis: language === 'ar'
              ? 'يبدو أن نفقاتك على الطعام قد زادت بنسبة 15% هذا الشهر مقارنة بالشهر السابق. نوصي بتحديد ميزانية أسبوعية للمطاعم.'
              : 'Your food expenses have increased by 15% this month compared to the last. We recommend setting a weekly budget for dining out.',
            type: 'expense'
          },
          {
            title: language === 'ar' ? 'فرصة ادخار' : 'Savings Opportunity',
            detailed_analysis: language === 'ar'
              ? 'بناءً على دخلك الحالي، يمكنك زيادة مدخراتك الشهرية بمقدار 200 دولار دون التأثير على نمط حياتك الأساسي.'
              : 'Based on your current income, you could increase your monthly savings by $200 without affecting your lifestyle.',
            type: 'savings'
          },
          {
            title: language === 'ar' ? 'نصيحة استثمارية' : 'Investment Advice',
            detailed_analysis: language === 'ar'
              ? 'محفظتك الاستثمارية متنوعة بشكل جيد، ولكن يمكنك النظر في زيادة استثمارك في الأسهم التكنولوجية لتحقيق نمو طويل الأجل.'
              : 'Your investment portfolio is well-diversified, but consider increasing exposure to tech stocks for long-term growth.',
            type: 'investment'
          }
        ]
      };
    }
  },

  // Notifications
  getNotifications: async (category: string = 'all') => {
    try {
      const url = category === 'all' ? '/notifications' : `/notifications?category=${category}`;
      const response = await api.get(url);
      return response.data;
    } catch (err) {
      // Fallback to IndexedDB
      const notifs = await IndexedDBService.getAll('notifications');
      if (category !== 'all') {
        return notifs.filter(n => n.category === category);
      }
      return notifs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
  },

  getNotificationUnreadCount: async () => {
    try {
      const response = await api.get('/notifications/unread-count');
      return response.data;
    } catch (err) {
      const notifs = await IndexedDBService.getAll('notifications');
      return { count: notifs.filter(n => !n.isRead).length };
    }
  },

  markNotificationRead: async (id: string) => {
    try {
      await api.put(`/notifications/${id}/read`);
    } catch (err) {
      const n = await IndexedDBService.getById('notifications', id);
      if (n) await IndexedDBService.update('notifications', { ...n, isRead: true });
    }
  },

  markAllNotificationsRead: async () => {
    try {
      await api.put('/notifications/mark-all-read');
    } catch (err) {
      const all = await IndexedDBService.getAll('notifications');
      for (const n of all) {
        if (!n.isRead) await IndexedDBService.update('notifications', { ...n, isRead: true });
      }
    }
  },

  deleteNotification: async (id: string) => {
    try {
      await api.delete(`/notifications/${id}`);
    } catch (err) {
      await IndexedDBService.delete('notifications', id);
    }
  },

  deleteAllNotifications: async () => {
    try {
      await api.delete('/notifications');
    } catch (err) {
      await IndexedDBService.clear('notifications');
    }
  },


  // Backups
  triggerBackup: () => api.post('/backup/manual').then(r => r.data),
};
