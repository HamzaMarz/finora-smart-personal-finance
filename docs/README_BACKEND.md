
# Finora Backend

A production-grade Node.js backend for Personal Finance Management.

## Setup
1. Install dependencies: `npm install`
2. Configure `.env` file (see below)
3. Run Prisma migrations: `npx prisma migrate dev --name init`
4. Start development server: `npm run dev`

## Environment Variables
- `PORT`: Server port (default 3000)
- `DATABASE_URL`: SQLite connection string
- `JWT_SECRET`: Secret key for token signing
- `API_KEY`: Google Gemini API Key (for AI Insights)
- `SENDGRID_API_KEY`: For automated backup emails
- `BACKUP_MASTER_KEY`: Master encryption key for system-level backups

## Key Features
- **JWT Auth**: Secure stateless authentication.
- **Recurring Engine**: Automatically processes monthly income/expenses.
- **AI Insights**: Gemini-powered financial analysis.
- **Cron Jobs**: 8-hour cycles for exchange rates and backups.
- **Encrypted Backups**: AES-256-GCM security.
