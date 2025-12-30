import { StorageService } from '../database/storage.service';
import bcrypt from 'bcryptjs';

console.log('🌱 Seeding Finora database...');

async function seed() {
    try {
        // Create demo user
        const passwordHash = await bcrypt.hash('password123', 12);
        const user = await StorageService.users.create({
            email: 'alex@finora.app',
            name: 'Alex Johnson',
            passwordHash,
            baseCurrency: 'USD',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
        });
        console.log('✅ Created demo user:', user.email);

        // Create sample income sources
        await StorageService.income.create({
            userId: user.id,
            sourceName: 'Tech Corp Salary',
            amount: 8500,
            recurrence: 'monthly',
            isActive: true,
            startDate: '2024-01-01',
        });

        await StorageService.income.create({
            userId: user.id,
            sourceName: 'Stock Dividends',
            amount: 2000,
            recurrence: 'monthly',
            isActive: true,
            startDate: '2024-01-01',
        });

        await StorageService.income.create({
            userId: user.id,
            sourceName: 'Freelance Project',
            amount: 1500,
            recurrence: 'once',
            isActive: true,
            startDate: '2024-06-15',
        });
        console.log('✅ Created 3 income sources');

        // Create sample expenses
        const expenseCategories = [
            { category: 'Housing', amount: 2000, description: 'Monthly rent' },
            { category: 'Food', amount: 800, description: 'Groceries and dining' },
            { category: 'Transportation', amount: 300, description: 'Gas and maintenance' },
            { category: 'Utilities', amount: 200, description: 'Electricity, water, internet' },
            { category: 'Entertainment', amount: 150, description: 'Movies and subscriptions' },
            { category: 'Healthcare', amount: 250, description: 'Insurance and medications' },
        ];

        for (const exp of expenseCategories) {
            await StorageService.expenses.create({
                userId: user.id,
                category: exp.category,
                amount: exp.amount,
                description: exp.description,
                expenseDate: '2024-12-01',
                isRecurring: true,
                recurrenceType: 'monthly',
            });
        }
        console.log('✅ Created 6 expense categories');

        // Create sample savings
        await StorageService.savings.create({
            userId: user.id,
            amount: 5000,
            type: 'manual',
            savingDate: '2024-01-15',
            notes: 'Emergency fund',
        });

        await StorageService.savings.create({
            userId: user.id,
            amount: 3000,
            type: 'automatic',
            percentage: 10,
            savingDate: '2024-02-01',
            notes: 'Automatic 10% monthly saving',
        });
        console.log('✅ Created 2 savings records');

        // Create sample investments
        await StorageService.investments.create({
            userId: user.id,
            assetName: 'Apple Inc. (AAPL)',
            assetType: 'stocks',
            initialAmount: 10000,
            currentValue: 12500,
            purchaseDate: '2024-01-10',
            status: 'active',
            notes: '100 shares @ $100',
        });

        await StorageService.investments.create({
            userId: user.id,
            assetName: 'Bitcoin (BTC)',
            assetType: 'crypto',
            initialAmount: 5000,
            currentValue: 6200,
            purchaseDate: '2024-03-15',
            status: 'active',
            notes: '0.1 BTC',
        });

        await StorageService.investments.create({
            userId: user.id,
            assetName: 'US Treasury Bonds',
            assetType: 'bonds',
            initialAmount: 20000,
            currentValue: 20800,
            purchaseDate: '2023-12-01',
            status: 'active',
            notes: '5-year bonds @ 4% yield',
        });
        console.log('✅ Created 3 investments');

        // Create sample notifications
        await StorageService.notifications.create({
            userId: user.id,
            type: 'income',
            title: 'Salary Deposited',
            message: 'Your monthly salary of $8,500 has been recorded.',
            isRead: false,
        });

        await StorageService.notifications.create({
            userId: user.id,
            type: 'investment',
            title: 'Investment Update',
            message: 'Your Apple stock is up 25% since purchase!',
            isRead: false,
        });

        await StorageService.notifications.create({
            userId: user.id,
            type: 'system',
            title: 'Welcome to Finora!',
            message: 'Your account has been set up successfully. Start tracking your finances today.',
            isRead: true,
        });
        console.log('✅ Created 3 notifications');

        console.log('\n🎉 Database seeded successfully!');
        console.log('📧 Demo login: alex@finora.app');
        console.log('🔑 Password: password123');
        console.log('\n✨ Start the server: npm run dev:server');
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
}

seed();
