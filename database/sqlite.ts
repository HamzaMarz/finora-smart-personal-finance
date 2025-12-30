import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '..', 'finora.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize database schema
export function initializeDatabase() {
  db.exec(`
    -- Users table
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      password_hash TEXT,
      base_currency TEXT DEFAULT 'USD',
      avatar TEXT,
      language TEXT DEFAULT 'en',
      phone TEXT,
      bio TEXT,
      savings_percentage REAL DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Migration: Check if users table has old column names and rename if needed
  const columns = db.pragma('table_info(users)') as any[];
  console.log('📡 Users table columns found:', columns.map(c => c.name).join(', '));

  const migrationSteps = [
    { old: 'baseCurrency', new: 'base_currency' },
    { old: 'passwordHash', new: 'password_hash' },
    { old: 'createdAt', new: 'created_at' },
    { old: 'updatedAt', new: 'updated_at' }
  ];

  for (const step of migrationSteps) {
    if (columns.some(c => c.name === step.old) && !columns.some(c => c.name === step.new)) {
      console.log(`🔄 Migrating users table column: ${step.old} -> ${step.new}`);
      try {
        db.exec(`ALTER TABLE users RENAME COLUMN ${step.old} TO ${step.new}`);
      } catch (e: any) {
        console.error(`❌ Error migrating ${step.old}:`, e.message);
      }
    }
  }

  db.exec(`
    -- Income sources table
    CREATE TABLE IF NOT EXISTS income_sources (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      source_name TEXT NOT NULL,
      amount REAL NOT NULL,
      recurrence TEXT CHECK(recurrence IN ('once', 'weekly', 'monthly', 'yearly')) DEFAULT 'monthly',
      is_active INTEGER DEFAULT 1,
      start_date DATE,
      end_date DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Expenses table
    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      category TEXT NOT NULL,
      amount REAL NOT NULL,
      currency TEXT DEFAULT 'USD',
      description TEXT,
      expense_date DATE NOT NULL,
      is_recurring INTEGER DEFAULT 0,
      recurrence_type TEXT CHECK(recurrence_type IN ('once', 'weekly', 'monthly', 'yearly')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Savings table
    CREATE TABLE IF NOT EXISTS savings (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      amount REAL NOT NULL,
      type TEXT CHECK(type IN ('manual', 'automatic')) DEFAULT 'manual',
      percentage REAL,
      saving_date DATE NOT NULL,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Investments table
    CREATE TABLE IF NOT EXISTS investments (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      asset_name TEXT NOT NULL,
      asset_type TEXT CHECK(asset_type IN ('stocks', 'crypto', 'bonds', 'real_estate', 'other')) DEFAULT 'stocks',
      initial_amount REAL NOT NULL,
      current_value REAL NOT NULL,
      purchase_date DATE NOT NULL,
      close_date DATE,
      status TEXT CHECK(status IN ('active', 'closed')) DEFAULT 'active',
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Reports table
    CREATE TABLE IF NOT EXISTS reports (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      report_type TEXT CHECK(report_type IN ('monthly', 'yearly', 'custom')) DEFAULT 'monthly',
      period_start DATE NOT NULL,
      period_end DATE NOT NULL,
      data TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Notifications table
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      type TEXT CHECK(type IN ('income', 'expense', 'saving', 'investment', 'system')) DEFAULT 'system',
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'system',
      is_read INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Backup records table
    CREATE TABLE IF NOT EXISTS backup_records (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      encrypted_data TEXT NOT NULL,
      backup_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Settings table
    CREATE TABLE IF NOT EXISTS settings (
      id TEXT PRIMARY KEY,
      user_id TEXT UNIQUE NOT NULL,
      ai_enabled INTEGER DEFAULT 0,
      auto_backup_enabled INTEGER DEFAULT 1,
      backup_frequency INTEGER DEFAULT 8,
      notification_preferences TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Exchange Rates table
    CREATE TABLE IF NOT EXISTS exchange_rates (
      currency_code TEXT PRIMARY KEY,
      rate REAL NOT NULL,
      last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
      is_manual INTEGER DEFAULT 0
    );

    -- Supported Assets table (for crypto and forex)
    CREATE TABLE IF NOT EXISTS supported_assets (
      id TEXT PRIMARY KEY,
      asset_type TEXT CHECK(asset_type IN ('crypto', 'forex')) NOT NULL,
      symbol TEXT NOT NULL,
      name TEXT NOT NULL,
      currency_code TEXT,
      last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(asset_type, symbol)
    );

    -- Savings Percentage History table
    CREATE TABLE IF NOT EXISTS savings_percentage_history (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      percentage REAL NOT NULL,
      effective_month TEXT NOT NULL, -- Format: YYYY-MM
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user_id, effective_month)
    );

    -- Create indexes for better performance
    CREATE INDEX IF NOT EXISTS idx_income_user ON income_sources(user_id);
    CREATE INDEX IF NOT EXISTS idx_expenses_user ON expenses(user_id);
    CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date);
    CREATE INDEX IF NOT EXISTS idx_savings_user ON savings(user_id);
    CREATE INDEX IF NOT EXISTS idx_investments_user ON investments(user_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
  `);

  // Migration: Ensure 'currency' column exists in 'expenses' table
  const expenseColumns = db.pragma('table_info(expenses)') as any[];
  if (!expenseColumns.some(c => c.name === 'currency')) {
    console.log('🔄 Adding missing currency column to expenses table...');
    db.exec("ALTER TABLE expenses ADD COLUMN currency TEXT DEFAULT 'USD'");
  }

  // Migration: Ensure 'currency' column exists in 'income_sources' table
  const incomeColumns = db.pragma('table_info(income_sources)') as any[];
  if (!incomeColumns.some(c => c.name === 'currency')) {
    console.log('🔄 Adding missing currency column to income_sources table...');
    db.exec("ALTER TABLE income_sources ADD COLUMN currency TEXT DEFAULT 'USD'");
  }

  // Migration: Ensure 'category' column exists in 'notifications' table
  const notificationColumns = db.pragma('table_info(notifications)') as any[];
  if (!notificationColumns.some(c => c.name === 'category')) {
    console.log('🔄 Adding missing category column to notifications table...');
    db.exec("ALTER TABLE notifications ADD COLUMN category TEXT DEFAULT 'system'");
  }

  // Migration: Ensure 'language' column exists in 'users' table
  const userColumns = db.pragma('table_info(users)') as any[];
  if (!userColumns.some(c => c.name === 'language')) {
    console.log('🔄 Adding missing language column to users table...');
    db.exec("ALTER TABLE users ADD COLUMN language TEXT DEFAULT 'en'");
  }

  // Migration: Ensure 'savings_percentage' column exists in 'users' table
  if (!userColumns.some(c => c.name === 'savings_percentage')) {
    console.log('🔄 Adding missing savings_percentage column to users table...');
    db.exec("ALTER TABLE users ADD COLUMN savings_percentage REAL DEFAULT 0");
  }

  // Cleanup exchange rates not in requested 13 currencies
  const allowed = "'USD', 'EUR', 'JPY', 'GBP', 'AUD', 'ILS', 'JOD', 'KWD', 'BHD', 'OMR', 'QAR', 'SAR', 'AED'";
  db.exec(`DELETE FROM exchange_rates WHERE currency_code NOT IN (${allowed})`);

  // Migration for investments table
  const invColumns = db.prepare("PRAGMA table_info(investments)").all() as any[];
  const hasSymbol = invColumns.some(c => c.name === 'symbol');
  const hasQuantity = invColumns.some(c => c.name === 'quantity');
  const hasBuyPrice = invColumns.some(c => c.name === 'buy_price');
  const hasCurrency = invColumns.some(c => c.name === 'currency');
  const hasSellPrice = invColumns.some(c => c.name === 'sell_price');

  if (!hasSymbol) db.prepare("ALTER TABLE investments ADD COLUMN symbol TEXT").run();
  if (!hasQuantity) db.prepare("ALTER TABLE investments ADD COLUMN quantity REAL DEFAULT 1").run();
  if (!hasBuyPrice) db.prepare("ALTER TABLE investments ADD COLUMN buy_price REAL DEFAULT 0").run();
  if (!hasCurrency) db.prepare("ALTER TABLE investments ADD COLUMN currency TEXT DEFAULT 'USD'").run();
  if (!hasSellPrice) db.prepare("ALTER TABLE investments ADD COLUMN sell_price REAL").run();

  // Update asset_type constraint (SQLite doesn't support ALTER TABLE for CHECK, so we just ensure the types are allowed in logic)
  // But we can recreate if needed. For now, we'll just allow them in the backend.

  console.log('✅ SQLite database initialized successfully');
}

// Export database instance
export default db;
