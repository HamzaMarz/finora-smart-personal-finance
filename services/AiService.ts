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
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-flash-latest' });
  }

  async generateInsights(financialData: {
    incomes: any[];
    expenses: any[];
    savings?: any[];
    investments?: any[];
  }, language: string = 'en'): Promise<any[]> { // Return array of insights
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('AI features disabled: API Key missing');
    }

    try {
      // Anonymize data - only send aggregated numbers
      const totalIncome = financialData.incomes.reduce((sum, inc) => sum + (inc.amount || 0), 0);
      const totalExpenses = financialData.expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
      const totalSavings = financialData.savings?.reduce((sum, sav) => sum + (sav.amount || 0), 0) || 0;
      const totalInvestments = financialData.investments?.reduce((sum, inv) => sum + ((inv.currentValue || 0) * (inv.quantity || 1)), 0) || 0;
      console.log('💰 Calculated Total Investments for AI:', totalInvestments);

      // Group expenses
      const expensesByCategory: Record<string, number> = {};
      financialData.expenses.forEach(exp => {
        expensesByCategory[exp.category] = (expensesByCategory[exp.category] || 0) + exp.amount;
      });

      const langInstruction = language === 'ar' ? 'Respond in Arabic.' : 'Respond in English.';

      const prompt = `
You are Finora AI, a professional financial advisor.
${langInstruction}
Analyze this financial data:
- Income: ${totalIncome}
- Expenses: ${totalExpenses}
- Savings: ${totalSavings}
- Investments: ${totalInvestments}
- Breakdown: ${JSON.stringify(expensesByCategory)}

Provide 3 distinct financial insights/advice.
You MUST output strictly Valid JSON array. Do not include markdown formatting like \`\`\`json.
Each item must have:
- "title": Short title (max 5 words).
- "short_summary": A very brief summary for a notification (max 15 words).
- "detailed_analysis": Detailed explanation and actionable steps (approx 50-80 words).

Example JSON format:
[
  {
    "title": "Reduce Housing Costs",
    "short_summary": "Housing consumes 60% of income; consider downsizing.",
    "detailed_analysis": "Your housing expenses are significantly higher than recommended..."
  }
]
`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Clean up markdown if present
      const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();

      try {
        return JSON.parse(cleanText);
      } catch (e) {
        console.error('Failed to parse AI JSON:', text);
        // Fallback or attempt to recover? For now return a single error insight
        return [{
          title: language === 'ar' ? 'خطأ في التحليل' : 'Analysis Error',
          short_summary: language === 'ar' ? 'لم نتمكن من تحليل البيانات.' : 'Could not parse analysis.',
          detailed_analysis: text // Return raw text so user at least sees something
        }];
      }

    } catch (error: any) {
      console.error('AI Insight generation failed:', error);
      throw error;
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
