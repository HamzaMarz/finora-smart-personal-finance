
import api from './api';

const MOCK_SUMMARY = {
  netWorth: 1250000.50,
  income: 12500,
  expenses: 4200,
  savings: 83000
};

export const FinanceService = {
  // Dashboard
  getSummary: async () => {
    try {
      const response = await api.get('/summary');
      return response.data;
    } catch (err) {
      return MOCK_SUMMARY; // Fallback to mock for UI demonstration
    }
  },

  // Income
  getIncomes: async () => {
    try {
      const response = await api.get('/income');
      return response.data;
    } catch (err) {
      return [
        { id: '1', source: 'Tech Corp Salary', amount: 8500, recurrence: 'monthly' },
        { id: '2', source: 'Stock Dividends', amount: 2000, recurrence: 'monthly' }
      ];
    }
  },
  
  createIncome: (data: any) => api.post('/income', data).then(r => r.data),

  // Expenses
  getExpenses: async () => {
    try {
      const response = await api.get('/expenses');
      return response.data;
    } catch (err) {
      return [
        { id: '1', category: 'Housing', amount: 2000 },
        { id: '2', category: 'Food', amount: 800 }
      ];
    }
  },
  
  createExpense: (data: any) => api.post('/expenses', data).then(r => r.data),

  // Investments
  getInvestments: () => api.get('/investments').then(r => r.data),
  createInvestment: (data: any) => api.post('/investments', data).then(r => r.data),

  // AI Insights
  getAiInsights: async () => {
    try {
      const response = await api.get('/ai-insights');
      return response.data;
    } catch (err) {
      return { insights: "AI is currently in simulation mode. Connect to backend for personalized GPT-4 analysis." };
    }
  },

  // Backups
  triggerBackup: () => api.post('/backup/manual').then(r => r.data),
};
