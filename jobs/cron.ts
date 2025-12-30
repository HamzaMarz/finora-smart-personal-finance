
import cron from 'node-cron';
import axios from 'axios';
import { PrismaClient } from '@prisma/client';
import { BackupService } from '../services/BackupService';

const prisma = new PrismaClient();
const backupService = new BackupService();

// Update exchange rates every 8 hours
cron.schedule('0 */8 * * *', async () => {
  console.log('Updating exchange rates...');
  try {
    const response = await axios.get(`https://api.exchangeratesapi.io/latest?base=USD`);
    const rates = response.data.rates;
    
    for (const [currency, rate] of Object.entries(rates)) {
      await prisma.exchangeRate.upsert({
        where: { id: `USD-${currency}` },
        update: { rate: rate as number },
        create: { id: `USD-${currency}`, from: 'USD', to: currency, rate: rate as number }
      });
    }
  } catch (error) {
    console.error('Exchange rate update failed');
  }
});

// Auto-backup every 8 hours
cron.schedule('0 */8 * * *', async () => {
  console.log('Running automated backup...');
  // Iterate through users with backup enabled
  const users = await prisma.user.findMany();
  for (const user of users) {
     await backupService.runAutoBackup(user.id);
  }
});

// Process recurring income/expenses daily
cron.schedule('0 0 * * *', async () => {
  console.log('Processing recurring transactions...');
  // Logic to calculate and append new records for recurring items
});
