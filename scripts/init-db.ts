import { initializeDatabase } from '../database/sqlite';

console.log('🚀 Initializing UrWallet database...');

try {
    initializeDatabase();
    console.log('✅ Database initialized successfully!');
    console.log('📊 All tables created with proper indexes');
    console.log('🔐 Foreign key constraints enabled');
    console.log('\n✨ Ready to seed data. Run: npm run db:seed');
} catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
}
