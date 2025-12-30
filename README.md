# Finora - Smart Personal Finance Management

<div align="center">
  <h3>🏦 Production-Ready Financial Management Application</h3>
  <p>Track income, expenses, savings, and investments with offline-first architecture</p>
</div>

## ✨ Features

### 📊 Financial Management
- **Dashboard** - Real-time financial overview with charts
- **Income Tracking** - Multiple sources with recurring support
- **Expense Management** - Categorized expenses with filters
- **Savings Goals** - Manual and automatic saving tracking
- **Investment Portfolio** - Track stocks, crypto, bonds with profit/loss calculations
- **Reports & Export** - Generate PDF and Excel reports

### 🤖 AI-Powered Insights
- Personalized financial recommendations
- Spending pattern analysis
- Investment outlook
- Privacy-first (anonymized data processing)

### 🔐 Security & Privacy
- Local-first data storage (SQLite + IndexedDB)
- AES-256-GCM encrypted backups
- JWT authentication
- Google OAuth support
- No mandatory cloud storage

### 🌍 Internationalization
- English & Arabic support
- Full RTL/LTR layouts
- Currency formatting per locale

### 📱 Progressive Web App
- Offline-first architecture
- Installable on mobile and desktop
- Background sync
- Responsive design

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. **Clone or navigate to the project**
   ```bash
   cd finora---smart-personal-finance
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Copy `.env` and update with your credentials:
   ```bash
   # Required
   JWT_SECRET=your-secret-key-here
   
   # Optional (for AI features)
   GEMINI_API_KEY=your-gemini-api-key
   
   # Optional (for Google OAuth)
   GOOGLE_CLIENT_ID=your-client-id
   GOOGLE_CLIENT_SECRET=your-client-secret
   ```

4. **Initialize database**
   ```bash
   npm run db:init
   npm run db:seed
   ```

5. **Start the application**
   
   Terminal 1 - Backend:
   ```bash
   npm run dev:server
   ```
   
   Terminal 2 - Frontend:
   ```bash
   npm run dev
   ```

6. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3000/health

### Demo Login
```
Email: alex@finora.app
Password: password123
```

## 📁 Project Structure

```
finora---smart-personal-finance/
├── database/              # Database layer
│   ├── sqlite.ts         # SQLite implementation
│   ├── indexeddb.ts      # IndexedDB for offline
│   └── storage.service.ts # Storage abstraction
├── controllers/           # API controllers
│   ├── IncomeController.ts
│   ├── SavingsController.ts
│   ├── InvestmentsController.ts
│   ├── ReportsController.ts
│   └── NotificationsController.ts
├── services/              # Business logic
│   ├── AuthService.ts    # Authentication
│   ├── AiService.ts      # AI insights
│   ├── BackupService.ts  # Backup/restore
│   └── ExportService.ts  # PDF/Excel export
├── pages/                 # React pages
│   ├── Dashboard.tsx
│   ├── Income.tsx
│   ├── Expenses.tsx
│   ├── Savings.tsx
│   ├── Investments.tsx
│   ├── Reports.tsx
│   ├── AIInsights.tsx
│   ├── Notifications.tsx
│   ├── Settings.tsx
│   └── Login.tsx
├── components/            # Reusable components
├── layouts/               # Layout components
├── store/                 # State management (Zustand)
├── scripts/               # Database scripts
├── server.ts              # Express backend
└── App.tsx                # Main React app

```

## 🔧 Configuration

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI:
   ```
   http://localhost:3000/auth/google/callback
   ```
6. Copy Client ID and Client Secret to `.env`

### Gemini AI Setup

1. Get API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Add to `.env`:
   ```
   GEMINI_API_KEY=your-api-key-here
   ```

## 📡 API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login with email/password
- `GET /auth/google/callback` - Google OAuth callback
- `POST /auth/forgot-password` - Request password reset
- `POST /auth/reset-password` - Reset password

### Financial Data
- `GET /summary` - Dashboard summary
- `GET|POST|PUT|DELETE /income` - Income management
- `GET|POST|PUT|DELETE /expenses` - Expense management
- `GET|POST|PUT|DELETE /savings` - Savings management
- `GET|POST|PUT|DELETE /investments` - Investment management

### Reports & Export
- `GET /reports` - List reports
- `GET /reports/generate` - Generate new report
- `GET /reports/export/pdf` - Export as PDF
- `GET /reports/export/excel` - Export as Excel

### AI & Notifications
- `GET /ai-insights` - Get AI insights
- `GET /notifications` - List notifications
- `PUT /notifications/:id/read` - Mark as read

### Backup
- `POST /backup/manual` - Create backup
- `POST /backup/restore` - Restore backup
- `GET /backup/export` - Export data as JSON

## 🛠 Technology Stack

### Frontend
- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Zustand** - State management
- **React Router** - Navigation
- **Recharts** - Data visualization
- **i18next** - Internationalization
- **Tailwind CSS** - Styling

### Backend
- **Node.js** - Runtime
- **Express** - Web framework
- **better-sqlite3** - SQLite database
- **idb** - IndexedDB wrapper
- **jsonwebtoken** - JWT auth
- **bcryptjs** - Password hashing

### Services
- **Google Generative AI** - AI insights
- **pdfmake** - PDF generation
- **exceljs** - Excel export
- **SendGrid** - Email (optional)

## 🔒 Security

- All passwords hashed with bcrypt (12 rounds)
- JWT tokens with configurable expiration
- AES-256-GCM encryption for backups
- SQL injection protection via prepared statements
- CORS configuration
- No sensitive data in logs

## 🌐 Offline Support

- IndexedDB for client-side storage
- Service worker for offline caching
- Sync queue for offline operations
- Automatic retry on reconnection

## 📱 PWA Installation

### Desktop (Chrome/Edge)
1. Click install icon in address bar
2. Or: Menu → Install Finora

### Mobile (Android)
1. Open in Chrome
2. Menu → Add to Home Screen

### Mobile (iOS)
1. Open in Safari
2. Share → Add to Home Screen

## 🧪 Testing

```bash
# Test backend health
curl http://localhost:3000/health

# Test authentication
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alex@finora.app","password":"password123"}'
```

## 📝 Scripts

```bash
npm run dev              # Start frontend (Vite)
npm run dev:server       # Start backend (Express)
npm run build            # Build for production
npm run db:init          # Initialize database
npm run db:seed          # Seed demo data
```

## 🤝 Contributing

This is a production-ready template. Feel free to:
- Add new features
- Improve existing functionality
- Report bugs
- Suggest enhancements

## 📄 License

MIT License - feel free to use for personal or commercial projects

## 🆘 Support

For issues or questions:
1. Check the `.env` configuration
2. Ensure database is initialized (`npm run db:init`)
3. Check console for errors
4. Verify all dependencies are installed

## 🎯 Roadmap

- [ ] Mobile app (React Native / Capacitor)
- [ ] Multi-currency support
- [ ] Budget planning
- [ ] Bill reminders
- [ ] Receipt scanning
- [ ] Bank account integration
- [ ] Tax reporting

---

<div align="center">
  <p>Built with ❤️ for financial freedom</p>
  <p>⭐ Star this repo if you find it useful!</p>
</div>
