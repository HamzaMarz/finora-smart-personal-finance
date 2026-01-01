import IndexedDBService from '../database/indexeddb';

export const seedDemoData = async (userId: string) => {
    // 1. Clear existing data for this user/demo
    // Ideally we'd delete by userId, but for local demo, we might just assume fresh or simple overwrite.
    // Given the IDB structure, we create new IDs.

    const baseDate = new Date();
    const monthsBack = 3;

    // Helper to get a date string X days ago
    const getDate = (daysAgo: number) => {
        const d = new Date(baseDate);
        d.setDate(d.getDate() - daysAgo);
        return d.toISOString();
    };

    console.log('🌱 Seeding Demo Data...');

    // --- Income ---
    const incomes = [
        {
            id: `start-salary-${userId}`,
            userId,
            sourceName: 'Tech Corp Salary',
            amount: 5500,
            recurrence: 'monthly',
            isActive: true,
            startDate: getDate(90),
            createdAt: getDate(90)
        },
        {
            id: `freelance-${userId}`,
            userId,
            sourceName: 'Freelance Projects',
            amount: 1200,
            recurrence: 'monthly',
            isActive: true,
            startDate: getDate(60),
            createdAt: getDate(60)
        }
    ];

    for (const inc of incomes) {
        await IndexedDBService.update('income_sources', inc as any);
    }

    // --- Expenses ---
    const expenses = [];
    const categories = ['Housing', 'Food', 'Transport', 'Entertainment', 'Utilities', 'Shopping'];

    // Generate expenses for the last 3 months
    for (let i = 0; i < 90; i++) {
        // Daily coffee/food
        if (Math.random() > 0.6) {
            expenses.push({
                id: `exp-${i}-${userId}`,
                userId,
                category: 'Food',
                amount: Math.floor(Math.random() * 50) + 10,
                description: 'Lunch / Coffee',
                expenseDate: getDate(i),
                isRecurring: false,
                createdAt: getDate(i)
            });
        }

        // Weekly Grocery
        if (i % 7 === 0) {
            expenses.push({
                id: `grocery-${i}-${userId}`,
                userId,
                category: 'Food',
                amount: Math.floor(Math.random() * 200) + 100,
                description: 'Weekly Groceries',
                expenseDate: getDate(i),
                isRecurring: false,
                createdAt: getDate(i)
            });
        }

        // Monthly Rent
        if (i % 30 === 0) {
            expenses.push({
                id: `rent-${i}-${userId}`,
                userId,
                category: 'Housing',
                amount: 1500,
                description: 'Apartment Rent',
                expenseDate: getDate(i),
                isRecurring: true,
                recurrenceType: 'monthly',
                createdAt: getDate(i)
            });
            expenses.push({
                id: `internet-${i}-${userId}`,
                userId,
                category: 'Utilities',
                amount: 60,
                description: 'Internet Bill',
                expenseDate: getDate(i),
                isRecurring: true,
                recurrenceType: 'monthly',
                createdAt: getDate(i)
            });
        }
    }

    for (const exp of expenses) {
        await IndexedDBService.update('expenses', exp as any);
    }

    // --- Savings ---
    const savings = [
        {
            id: `save-1-${userId}`,
            userId,
            amount: 5000,
            type: 'manual',
            savingDate: getDate(80),
            notes: 'Initial Deposit',
            createdAt: getDate(80)
        },
        {
            id: `save-2-${userId}`,
            userId,
            amount: 1000,
            type: 'automatic',
            percentage: 10,
            savingDate: getDate(50),
            notes: 'Auto Save',
            createdAt: getDate(50)
        },
        {
            id: `save-3-${userId}`,
            userId,
            amount: 1200,
            type: 'manual',
            savingDate: getDate(20),
            notes: 'Bonus',
            createdAt: getDate(20)
        }
    ];

    for (const save of savings) {
        await IndexedDBService.update('savings', save as any);
    }

    // --- Investments ---
    const investments = [
        {
            id: `inv-1-${userId}`,
            userId,
            assetName: 'Apple Inc. (AAPL)',
            assetType: 'stocks',
            initialAmount: 2000,
            currentValue: 2450, // Profit
            purchaseDate: getDate(120),
            status: 'active',
            notes: 'Long term hold',
            createdAt: getDate(120)
        },
        {
            id: `inv-2-${userId}`,
            userId,
            assetName: 'Bitcoin (BTC)',
            assetType: 'crypto',
            initialAmount: 1000,
            currentValue: 3000, // Big Profit
            purchaseDate: getDate(200),
            status: 'active',
            notes: 'HODL',
            createdAt: getDate(200)
        },
        {
            id: `inv-3-${userId}`,
            userId,
            assetName: 'Government Bonds',
            assetType: 'bonds',
            initialAmount: 5000,
            currentValue: 5100, // Small Profit
            purchaseDate: getDate(300),
            status: 'active',
            createdAt: getDate(300)
        }
    ];

    for (const inv of investments) {
        await IndexedDBService.update('investments', inv as any);
    }

    // --- Notifications ---
    const notifications = [
        {
            id: `notif-1-${userId}`,
            userId,
            type: 'system',
            title: 'Welcome to UrWallet Demo',
            message: 'Explore all features freely. Data is local.',
            category: 'system',
            isRead: false,
            createdAt: getDate(0)
        },
        {
            id: `notif-2-${userId}`,
            userId,
            type: 'income',
            title: 'Salary Received',
            message: 'Tech Corp Salary of $5,500 has been recorded.',
            category: 'income',
            isRead: true,
            createdAt: getDate(2)
        },
        {
            id: `notif-3-${userId}`,
            userId,
            type: 'investment',
            title: 'Investment Alert',
            message: 'Bitcoin is up 15% this week!',
            category: 'alert',
            isRead: false,
            createdAt: getDate(1)
        }
    ];

    for (const notif of notifications) {
        await IndexedDBService.update('notifications', notif as any);
    }

    console.log('✅ Demo Data Seeded!');
};
