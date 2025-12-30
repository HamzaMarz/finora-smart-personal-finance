import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import { initializeDatabase } from './database/sqlite.js';
import { IncomeController } from './controllers/IncomeController.js';
import { SavingsController } from './controllers/SavingsController.js';
import { InvestmentsController } from './controllers/InvestmentsController.js';
import { ReportsController } from './controllers/ReportsController.js';
import { NotificationsController } from './controllers/NotificationsController.js';
import { AuthService } from './services/AuthService.js';
import { AiService } from './services/AiService.js';
import { BackupService } from './services/BackupService.js';
import { StorageService } from './database/storage.service.js';
// ... (previous imports)
import ExchangeRateService from './services/ExchangeRateService.js';
import MarketDataService from './services/MarketDataService.js';
import axios from 'axios';

dotenv.config();

// Initialize database
initializeDatabase();
MarketDataService.initialize();

const app = express();
const port = process.env.PORT || 5000;
const authService = new AuthService();
const aiService = new AiService();
const backupService = new BackupService();
const exchangeRateService = ExchangeRateService.getInstance(); // Auto-starts scheduling

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use((req, res, next) => {
  if (req.method !== 'GET') {
    console.log(`📡 [${new Date().toISOString()}] ${req.method} ${req.url}`);
    console.log(`   Headers:`, JSON.stringify(req.headers));
    console.log(`   Body:`, JSON.stringify(req.body));
  }
  next();
});

// ==================== MIDDLEWARE ====================
const authenticate = async (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  const payload = await authService.validateToken(token);
  if (!payload) return res.status(401).json({ error: 'Session expired' });

  req.user = payload;
  next();
};

// ==================== CURRENCY HELPERS ====================
const getRateFor = (currencyCode: string) => {
  const usdRates = StorageService.exchangeRates.getAll();
  const rateObj = usdRates.find(r => r.currencyCode === (currencyCode || 'USD'));
  return rateObj ? rateObj.rate : 1;
};

const getBaseRate = async (userId: string) => {
  const user = await StorageService.users.findById(userId);
  return getRateFor(user?.baseCurrency || 'USD');
};

const convertToUserBase = (usdAmount: number, baseRate: number) => {
  return usdAmount * baseRate;
};

const convertToUSD = (baseAmount: number, baseRate: number) => {
  return baseAmount / baseRate;
};

// ==================== EXCHANGE RATES ====================
app.get('/api/rates', authenticate, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const user = await StorageService.users.findById(userId);
    const baseCurrency = user?.baseCurrency || 'USD';

    const ALLOWED_CURRENCIES = ['USD', 'EUR', 'JPY', 'GBP', 'AUD', 'ILS', 'JOD', 'KWD', 'BHD', 'OMR', 'QAR', 'SAR', 'AED'];
    const usdRates = StorageService.exchangeRates.getAll().filter(r => ALLOWED_CURRENCIES.includes(r.currencyCode));
    const baseRateObj = usdRates.find(r => r.currencyCode === baseCurrency);
    const baseRate = baseRateObj ? baseRateObj.rate : 1;

    // ConvertedRate(X) = Rate(X in USD) / Rate(Base in USD)
    const convertedRates = usdRates.map(r => ({
      ...r,
      rate: r.rate / baseRate
    }));

    res.json(convertedRates);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/rates/sync', authenticate, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const user = await StorageService.users.findById(userId);
    const baseCurrency = user?.baseCurrency || 'USD';

    const success = await exchangeRateService.syncRates();
    if (success) {
      const ALLOWED_CURRENCIES = ['USD', 'EUR', 'JPY', 'GBP', 'AUD', 'ILS', 'JOD', 'KWD', 'BHD', 'OMR', 'QAR', 'SAR', 'AED'];
      const usdRates = StorageService.exchangeRates.getAll().filter(r => ALLOWED_CURRENCIES.includes(r.currencyCode));
      const baseRateObj = usdRates.find(r => r.currencyCode === baseCurrency);
      const baseRate = baseRateObj ? baseRateObj.rate : 1;

      const convertedRates = usdRates.map(r => ({
        ...r,
        rate: r.rate / baseRate
      }));

      res.json({ success: true, rates: convertedRates });
    } else {
      res.status(502).json({ error: 'Failed to sync with external API' });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/rates/:code', authenticate, async (req: any, res) => {
  try {
    const { code } = req.params;
    const { rate } = req.body; // This is the rate relative to user's base currency

    if (typeof rate !== 'number') {
      return res.status(400).json({ error: 'Invalid rate' });
    }

    const userId = req.user.userId;
    const user = await StorageService.users.findById(userId);
    const baseCurrency = user?.baseCurrency || 'USD';

    const usdRates = StorageService.exchangeRates.getAll();
    const baseRateObj = usdRates.find(r => r.currencyCode === baseCurrency);
    const baseRate = baseRateObj ? baseRateObj.rate : 1;

    // Rate(X in USD) = ConvertedRate(X relative to Base) * Rate(Base in USD)
    const newUsdRate = rate * baseRate;

    StorageService.exchangeRates.updateRate(code, newUsdRate, true);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== BACKUP ROUTES ====================
// ... (rest of file)
// ==================== AUTH ROUTES ====================
app.post('/auth/register', async (req, res) => {
  try {
    const result = await authService.register(req.body);
    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    res.json(result);
  } catch (error: any) {
    res.status(401).json({ error: error.message });
  }
});

// Google OAuth callback
app.get('/auth/google/callback', async (req, res) => {
  try {
    const { code } = req.query;

    if (!code) {
      return res.redirect('http://localhost:3000/login?error=no_code');
    }

    // Exchange code for tokens
    const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI,
      grant_type: 'authorization_code',
    });

    const { access_token } = tokenResponse.data;

    // Get user info
    const userInfoResponse = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    const googleUser = userInfoResponse.data;
    const result = await authService.googleAuth({
      email: googleUser.email,
      name: googleUser.name,
      picture: googleUser.picture,
    });

    // Redirect to frontend login page with token in query parameter
    res.redirect(`http://localhost:3000/?token=${result.token}`);
  } catch (error: any) {
    console.error('Google OAuth error:', error.response?.data || error.message);
    res.redirect('http://localhost:3000/login?error=oauth_failed');
  }
});

app.post('/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const resetToken = await authService.generateResetToken(email);
    // TODO: Send email with reset link
    res.json({ message: 'Password reset email sent', resetToken }); // Remove resetToken in production
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/auth/reset-password', async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;
    await authService.resetPassword(resetToken, newPassword);
    res.json({ message: 'Password reset successful' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ==================== USER PROFILE ====================
app.get('/user/profile', authenticate, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const user = await StorageService.users.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      language: user.language || 'en',
      phone: user.phone || '',
      bio: user.bio || '',
      savingsPercentage: user.savingsPercentage || 0,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/user/profile', authenticate, async (req: any, res) => {
  try {
    const userId = req.user.userId;

    // Defensive check for req.body
    if (!req.body) {
      console.error(`❌ Profile update failed: req.body is undefined for user ${userId}`);
      return res.status(400).json({ error: 'Request body is missing' });
    }

    const { name, phone, bio, avatar, baseCurrency, language, savingsPercentage } = req.body;

    console.log(`👤 Updating profile for user ${userId}:`, { name, phone, bio, avatar, baseCurrency });

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (bio !== undefined) updateData.bio = bio;
    if (avatar !== undefined) updateData.avatar = avatar;
    if (baseCurrency !== undefined) updateData.baseCurrency = baseCurrency;
    if (language !== undefined) updateData.language = language;
    if (savingsPercentage !== undefined) {
      updateData.savingsPercentage = savingsPercentage;

      // Logic for Requirement: Change takes effect on 1st of NEXT month
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      const effectiveMonth = nextMonth.toISOString().substring(0, 7); // YYYY-MM

      // Store in history table for future calculations
      try {
        await StorageService.savingsHistory.upsert(userId, savingsPercentage, effectiveMonth);
        console.log(`🏧 Recorded savings percentage ${savingsPercentage}% for effective month ${effectiveMonth}`);
      } catch (historyError: any) {
        console.error('❌ Failed to record savings percentage history:', historyError.message);
      }
    }

    if (Object.keys(updateData).length === 0) {
      console.log('⚠ No fields provided for update');
      return res.json({ success: true, message: 'No changes made' });
    }

    await StorageService.users.update(userId, updateData);

    const updatedUser = await StorageService.users.findById(userId);
    console.log('✅ Profile updated successfully:', updatedUser);

    res.json({
      id: updatedUser!.id,
      name: updatedUser!.name,
      email: updatedUser!.email,
      avatar: updatedUser!.avatar,
      language: updatedUser!.language || 'en',
      phone: updatedUser!.phone || '',
      bio: updatedUser!.bio || '',
      baseCurrency: updatedUser!.baseCurrency,
      savingsPercentage: updatedUser!.savingsPercentage || 0,
    });
  } catch (error: any) {
    console.error('❌ Failed to update profile:', error.message);
    res.status(400).json({ error: error.message });
  }
});

// ==================== DASHBOARD / SUMMARY ====================
app.get('/summary', authenticate, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const user = await StorageService.users.findById(userId);
    const baseCurrency = user?.baseCurrency || 'USD';
    const baseRate = await getBaseRate(userId);
    console.log(`📊 Summary for user ${userId}: BaseCurrency=${baseCurrency}, BaseRate=${baseRate}`);

    const incomes = await StorageService.income.findByUser(userId);
    const expenses = await StorageService.expenses.findByUser(userId);
    const savings = await StorageService.savings.findByUser(userId);
    const investments = await StorageService.investments.findByUser(userId);

    const currentMonth = new Date().toISOString().substring(0, 7);

    const totalIncomeUSD = incomes.filter(i => i.isActive).reduce((sum, inc) => {
      let isApplicable = false;
      if (inc.recurrence === 'once') {
        const incDate = inc.startDate || '';
        isApplicable = incDate.startsWith(currentMonth);
      } else {
        isApplicable = (inc.startDate || '') <= new Date().toISOString();
      }

      if (!isApplicable) return sum;

      let amt = inc.amount;
      if (inc.recurrence === 'weekly') amt *= 4;
      else if (inc.recurrence === 'yearly') amt /= 12;
      return sum + amt;
    }, 0);
    const monthlyExpensesUSD = expenses
      .filter(exp => exp.expenseDate.startsWith(currentMonth))
      .reduce((sum, exp) => sum + exp.amount, 0);
    const monthlySavingsUSD = savings
      .filter(sav => sav.savingDate.startsWith(currentMonth))
      .reduce((sum, sav) => sum + sav.amount, 0);

    const totalExpensesUSD = expenses.reduce((sum, exp) => sum + exp.amount, 0);

    // Logic for Requirement: Use historical percentage for current month
    const currentMonthStr = new Date().toISOString().substring(0, 7);
    const savingsHistory = await StorageService.savingsHistory.findByUser(userId);
    const applicable = savingsHistory
      .filter(h => h.effectiveMonth <= currentMonthStr)
      .sort((a, b) => b.effectiveMonth.localeCompare(a.effectiveMonth))[0];
    const applicablePercentage = applicable ? applicable.percentage : (user?.savingsPercentage || 0);

    const projectedAutoMonthlyUSD = totalIncomeUSD * (applicablePercentage / 100);
    const totalSavingsUSD = savings.reduce((sum, sav) => sum + sav.amount, 0) + projectedAutoMonthlyUSD;

    // Correct multi-currency investment calculation
    const totalInvestmentsBase = investments
      .filter(inv => inv.status === 'active')
      .reduce((sum, inv) => {
        const val = (inv.currentValue || 0) * (inv.quantity || 0);
        const rateToUSD = getRateFor(inv.currency);
        const valUSD = val / rateToUSD;
        return sum + (valUSD * baseRate);
      }, 0);

    const netWorthBase = (totalIncomeUSD * baseRate) - (totalExpensesUSD * baseRate) + (totalSavingsUSD * baseRate) + totalInvestmentsBase;

    res.json({
      netWorth: netWorthBase,
      income: totalIncomeUSD * baseRate,
      expenses: monthlyExpensesUSD * baseRate,
      savings: monthlySavingsUSD * baseRate,
      investments: totalInvestmentsBase,
      currency: baseCurrency
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== INCOME ROUTES ====================
app.get('/income', authenticate, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const baseRate = await getBaseRate(userId);
    const incomes = await StorageService.income.findByUser(userId);

    const converted = incomes.map(inc => ({
      ...inc,
      amount: convertToUserBase(inc.amount, baseRate)
    }));

    res.json(converted);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/income', authenticate, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const { amount, sourceName, recurrence, startDate, currency } = req.body;
    const rate = getRateFor(currency || 'USD');
    const usdAmount = amount / rate;

    const income = await StorageService.income.create({
      userId,
      sourceName,
      amount: usdAmount,
      recurrence: recurrence || 'monthly',
      isActive: true,
      startDate: startDate || new Date().toISOString(),
    });

    // Create notification
    await StorageService.notifications.create({
      userId,
      type: 'income',
      category: 'income',
      title: 'Income Added',
      message: `New income source added: ${sourceName} - ${amount.toFixed(2)} ${currency || 'USD'}`,
      isRead: false,
    });

    res.status(201).json({
      ...income,
      amount: amount
    });
  } catch (error: any) {
    console.error('❌ Error adding income:', error.message);
    res.status(400).json({ error: error.message });
  }
});

app.put('/income/:id', authenticate, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const { amount, sourceName, recurrence, startDate, currency, isActive } = req.body;

    const rate = getRateFor(currency || 'USD');
    const usdAmount = amount / rate;

    await StorageService.income.update(id, {
      sourceName,
      amount: usdAmount,
      recurrence,
      startDate,
      isActive
    });

    const updated = await StorageService.income.findByUser(userId);
    const result = updated.find(inc => inc.id === id);

    res.json({
      ...result,
      amount: amount
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/income/:id', authenticate, async (req: any, res) => {
  try {
    const { id } = req.params;
    await StorageService.income.delete(id);
    res.json({ success: true, message: 'Income source deleted' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== EXPENSE ROUTES ====================
app.get('/expenses', authenticate, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const baseRate = await getBaseRate(userId);
    const expenses = await StorageService.expenses.findByUser(userId);

    const converted = expenses.map(exp => ({
      ...exp,
      amount: convertToUserBase(exp.amount, baseRate)
    }));

    res.json(converted);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/expenses', authenticate, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const { amount, category, description, expenseDate, currency, isRecurring, recurrenceType } = req.body;

    // Use the actual rate of the input currency, not the user's base rate
    const rate = getRateFor(currency || 'USD');
    const usdAmount = amount / rate;

    const expense = await StorageService.expenses.create({
      userId,
      category,
      description,
      expenseDate: expenseDate || new Date().toISOString(),
      amount: usdAmount,
      currency: 'USD',
      isRecurring: isRecurring || false,
      recurrenceType: recurrenceType || null
    });

    // Create notification
    await StorageService.notifications.create({
      userId,
      type: 'expense',
      category: 'expense',
      title: 'Expense Added',
      message: `New expense in ${category}: ${amount.toFixed(2)} (stored as $${usdAmount.toFixed(2)} USD)`,
      isRead: false,
    });

    res.status(201).json({
      ...expense,
      amount: amount // Return what they sent
    });
  } catch (error: any) {
    console.error('❌ Error adding expense:', error.message);
    res.status(400).json({ error: error.message });
  }
});

app.put('/expenses/:id', authenticate, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const baseRate = await getBaseRate(userId);
    const { id } = req.params;
    const data = req.body;

    if (data.amount !== undefined) {
      const rate = getRateFor(data.currency || 'USD');
      data.amount = data.amount / rate;
      data.currency = 'USD'; // Always store as USD
    }

    await StorageService.expenses.update(id, data);
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/expenses/:id', authenticate, async (req: any, res) => {
  const { id } = req.params;
  await StorageService.expenses.delete(id);
  res.json({ success: true });
});

// ==================== SAVINGS ROUTES ====================
app.get('/savings', authenticate, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const user = await StorageService.users.findById(userId);
    const baseRate = await getBaseRate(userId);
    const manualSavings = await StorageService.savings.findByUser(userId);
    const incomes = await StorageService.income.findByUser(userId);
    const savingsHistory = await StorageService.savingsHistory.findByUser(userId);

    const convertedManual = manualSavings.map(s => ({
      ...s,
      amount: convertToUserBase(s.amount, baseRate)
    }));

    // Generate virtual auto savings for all months that have income
    const autoSavings: any[] = [];
    const incomesByMonth: Record<string, number> = {};

    // Determine the range of months to consider (from first income to now)
    const activeIncomes = incomes.filter(i => i.isActive);
    if (activeIncomes.length > 0) {
      const firstDateStr = activeIncomes.reduce((min, i) => (i.startDate || '') < min ? (i.startDate || '') : min, new Date().toISOString());
      const startDate = new Date(firstDateStr);
      const endDate = new Date();

      const current = new Date(Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), 1));
      const periodMonths: string[] = [];
      while (current <= endDate) {
        periodMonths.push(current.toISOString().substring(0, 7));
        current.setUTCMonth(current.getUTCMonth() + 1);
      }

      // Calculate income for each month (Simplified version of ReportsController logic)
      periodMonths.forEach(month => {
        let monthIncome = 0;
        activeIncomes.forEach(inc => {
          const incDateStr = inc.startDate || '1970-01-01';

          let isApplicable = false;
          if (inc.recurrence === 'once') {
            isApplicable = incDateStr.startsWith(month);
          } else {
            isApplicable = incDateStr <= `${month}-31`;
          }

          if (isApplicable) {
            let amt = inc.amount; // already in USD in DB
            if (inc.recurrence === 'weekly') amt *= 4;
            else if (inc.recurrence === 'yearly') amt /= 12;
            monthIncome += amt;
          }
        });

        // Get applicable percentage
        const applicable = savingsHistory
          .filter(h => h.effectiveMonth <= month)
          .sort((a, b) => b.effectiveMonth.localeCompare(a.effectiveMonth))[0];
        const percent = applicable ? applicable.percentage : (user?.savingsPercentage || 0);

        if (percent > 0 && monthIncome > 0) {
          const autoAmtUSD = monthIncome * (percent / 100);
          autoSavings.push({
            id: `auto-v-${month}`,
            userId,
            amount: convertToUserBase(autoAmtUSD, baseRate),
            type: 'automatic',
            savingDate: `${month}-01`,
            notes: `Automatic saving (${percent}%)`,
            isVirtual: true
          });
        }
      });
    }

    res.json([...convertedManual, ...autoSavings]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/savings', authenticate, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const { amount, type, savingDate, notes, currency } = req.body;
    const rate = getRateFor(currency || 'USD');
    const usdAmount = amount / rate;

    const saving = await StorageService.savings.create({
      userId,
      amount: usdAmount,
      type: type || 'manual',
      savingDate: savingDate || new Date().toISOString(),
      notes,
    });

    // Create notification
    await StorageService.notifications.create({
      userId,
      type: 'saving',
      category: 'savings',
      title: 'Saving recorded',
      message: `New saving recorded: ${amount.toFixed(2)} ${currency || 'USD'}`,
      isRead: false,
    });

    res.status(201).json({
      ...saving,
      amount: amount
    });
  } catch (error: any) {
    console.error('❌ Error adding savings:', error.message);
    res.status(400).json({ error: error.message });
  }
});

app.put('/savings/:id', authenticate, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const { amount, type, savingDate, notes, currency } = req.body;

    const rate = getRateFor(currency || 'USD');
    const usdAmount = amount / rate;

    await StorageService.savings.update(id, {
      amount: usdAmount,
      type: type || 'manual',
      savingDate: savingDate || new Date().toISOString(),
      notes
    });

    const updated = await StorageService.savings.findByUser(userId);
    const result = updated.find(s => s.id === id);

    res.json({
      ...result,
      amount: amount
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/savings/:id', authenticate, async (req: any, res) => {
  try {
    const { id } = req.params;
    await StorageService.savings.delete(id);
    res.json({ success: true, message: 'Saving record deleted' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== INVESTMENT ROUTES ====================
// ==================== INVESTMENTS ====================
app.get('/investments', authenticate, InvestmentsController.list);
app.post('/investments', authenticate, InvestmentsController.create);
app.put('/investments/:id', authenticate, InvestmentsController.update);
app.put('/investments/:id/close', authenticate, InvestmentsController.close);
app.delete('/investments/:id', authenticate, InvestmentsController.delete);

// ==================== MARKET DATA ====================
app.get('/api/market/search', authenticate, async (req: any, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json([]);
    const results = await MarketDataService.searchAssets(q as string);
    res.json(results);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/market/price/:symbol', authenticate, async (req: any, res) => {
  try {
    const { symbol } = req.params;
    const { type, currency } = req.query;
    const price = await MarketDataService.getAssetPrice(symbol, type as string, currency as string);
    res.json({ symbol, price });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/market/supported/crypto', authenticate, async (req: any, res) => {
  try {
    const cryptos = await MarketDataService.getSupportedCryptos();
    res.json(cryptos);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/market/supported/forex', authenticate, async (req: any, res) => {
  try {
    const forex = await MarketDataService.getSupportedForex();
    res.json(forex);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
// ==================== REPORTS ROUTES ====================
app.get('/reports', authenticate, ReportsController.list);
app.get('/reports/generate', authenticate, ReportsController.generate);
app.get('/reports/export/pdf', authenticate, ReportsController.exportPDF);
app.get('/reports/export/excel', authenticate, ReportsController.exportExcel);

// ==================== NOTIFICATIONS ====================
app.get('/notifications', authenticate, NotificationsController.getAll);
app.post('/notifications', authenticate, NotificationsController.create);
app.put('/notifications/:id/read', authenticate, NotificationsController.markAsRead);
app.put('/notifications/mark-all-read', authenticate, NotificationsController.markAllAsRead);
app.delete('/notifications/:id', authenticate, NotificationsController.delete);
app.delete('/notifications', authenticate, NotificationsController.deleteAll);
app.get('/notifications/unread-count', authenticate, NotificationsController.getUnreadCount);

// ==================== AI INSIGHTS ====================
app.get('/ai-insights', authenticate, async (req: any, res) => {
  const userId = req.user.userId;
  const incomes = await StorageService.income.findByUser(userId);
  const expenses = await StorageService.expenses.findByUser(userId);
  const savings = await StorageService.savings.findByUser(userId);
  const investments = await StorageService.investments.findByUser(userId);

  try {
    const insights = await aiService.generateInsights({ incomes, expenses, savings, investments });
    res.json({ insights });
  } catch (error) {
    res.status(500).json({ error: 'AI processing failed' });
  }
});

// ==================== BACKUP ROUTES ====================
app.post('/backup/manual', authenticate, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: 'Encryption password required' });
    }

    const backupId = await backupService.createBackup(userId, password);
    res.json({ success: true, backupId });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/backup/restore', authenticate, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const { encryptedData, password } = req.body;

    await backupService.restoreBackup(userId, encryptedData, password);
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/backup/export', authenticate, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const data = await backupService.exportData(userId);
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/backup/list', authenticate, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const backups = await backupService.listBackups(userId);
    res.json(backups);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== HEALTH CHECK ====================
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ==================== START SERVER ====================
app.listen(port, () => {
  console.log(`\n🚀 Finora Backend running on http://localhost:${port}`);
  console.log(`📊 Database: SQLite (${process.env.DATABASE_PATH || './finora.db'})`);
  console.log(`🔐 JWT Secret: ${process.env.JWT_SECRET ? '✓ Configured' : '⚠ Using default'}`);
  console.log(`🤖 AI Service: ${process.env.GEMINI_API_KEY ? '✓ Enabled' : '⚠ Disabled'}`);
  console.log(`🔑 Google OAuth: ${process.env.GOOGLE_CLIENT_ID ? '✓ Configured' : '⚠ Not configured'}`);
  console.log(`\n✨ Ready to accept requests!\n`);
});

export default app;
