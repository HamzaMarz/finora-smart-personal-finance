import { GoogleGenerativeAI } from '@google/generative-ai';

export class AiService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('⚠️  GEMINI_API_KEY not set. AI features will be disabled.');
    }
    this.genAI = new GoogleGenerativeAI(apiKey || 'dummy-key');
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  }

  async generateInsights(financialData: {
    incomes: any[];
    expenses: any[];
    savings?: any[];
    investments?: any[];
  }): Promise<string> {
    if (!process.env.GEMINI_API_KEY) {
      return 'AI Insights are currently disabled. Please configure GEMINI_API_KEY in your .env file to enable this feature.';
    }

    try {
      // Anonymize data - only send aggregated numbers, no personal info
      const totalIncome = financialData.incomes.reduce((sum, inc) => sum + (inc.amount || 0), 0);
      const totalExpenses = financialData.expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
      const totalSavings = financialData.savings?.reduce((sum, sav) => sum + (sav.amount || 0), 0) || 0;
      const totalInvestments = financialData.investments?.reduce((sum, inv) => sum + (inv.currentValue || 0), 0) || 0;

      // Group expenses by category
      const expensesByCategory: Record<string, number> = {};
      financialData.expenses.forEach(exp => {
        expensesByCategory[exp.category] = (expensesByCategory[exp.category] || 0) + exp.amount;
      });

      const prompt = `
You are Finora AI, a professional financial advisor. Analyze this anonymized financial data and provide actionable insights.

**Financial Summary:**
- Total Monthly Income: $${totalIncome.toFixed(2)}
- Total Monthly Expenses: $${totalExpenses.toFixed(2)}
- Total Savings: $${totalSavings.toFixed(2)}
- Total Investments: $${totalInvestments.toFixed(2)}
- Net Monthly: $${(totalIncome - totalExpenses).toFixed(2)}

**Expense Breakdown:**
${Object.entries(expensesByCategory).map(([cat, amt]) => `- ${cat}: $${amt.toFixed(2)}`).join('\n')}

**Please provide:**
1. **Spending Pattern Analysis** - Identify any concerning trends or positive habits
2. **Three Actionable Savings Suggestions** - Specific, practical recommendations
3. **Investment Outlook** - Brief assessment based on current portfolio

Keep your response professional, concise (max 300 words), and actionable. Use bullet points for clarity.
`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error: any) {
      console.error('AI Insight generation failed:', error);

      if (error.message?.includes('API key')) {
        return 'Invalid API key. Please check your GEMINI_API_KEY configuration.';
      }

      return 'Unable to generate AI insights at this time. Please try again later.';
    }
  }

  async generateReport(reportData: any): Promise<string> {
    if (!process.env.GEMINI_API_KEY) {
      return 'AI-powered report generation is disabled. Configure GEMINI_API_KEY to enable.';
    }

    try {
      const prompt = `
You are a financial report analyst. Generate a professional summary for this financial report:

${JSON.stringify(reportData, null, 2)}

Provide a concise executive summary highlighting:
1. Key financial metrics
2. Notable trends
3. Recommendations

Keep it under 200 words.
`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('AI Report generation failed:', error);
      return 'Unable to generate AI-powered report summary.';
    }
  }
}

export default AiService;
