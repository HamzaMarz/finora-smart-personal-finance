import dotenv from 'dotenv';
import { AiService } from './services/AiService.js';

dotenv.config();

async function testAiService() {
    const aiService = new AiService();

    const mockData = {
        incomes: [{ amount: 5000, sourceName: 'Salary' }],
        expenses: [{ amount: 1000, category: 'Food' }, { amount: 1500, category: 'Rent' }],
        savings: [{ amount: 500 }],
        investments: [{ currentValue: 10000 }]
    };

    console.log('Testing AiService.generateInsights...');
    try {
        const insights = await aiService.generateInsights(mockData);
        console.log('Insights Length:', insights.length);
        console.log('Preview:', insights.substring(0, 100));
        console.log('Result:', insights);
    } catch (e) {
        console.error("Script Error:", e);
    }
}

testAiService();
