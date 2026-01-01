
import React, { useEffect } from 'react';
import { syncManager } from './services/SyncManager';
import { backupService } from './services/ClientBackupService';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import { useAppStore } from './store/useAppStore';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import Expenses from './pages/Expenses';
import Income from './pages/Income';
import Savings from './pages/Savings';
import Investments from './pages/Investments';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Notifications from './pages/Notifications';
import AIInsights from './pages/AIInsights';
import AuthCallback from './pages/AuthCallback';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const App: React.FC = () => {
  const { theme, language, setCurrency, setLanguage } = useAppStore();
  const { user } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    // Sync app currency with user's base currency
    if (user?.baseCurrency) {
      setCurrency(user.baseCurrency);
    }
    // Sync app language with user's language
    if (user?.language) {
      setLanguage(user.language as 'en' | 'ar');
    }
  }, [user?.baseCurrency, user?.language, setCurrency, setLanguage]);

  useEffect(() => {
    // Initial sync of theme and direction
    if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    }
    document.documentElement.setAttribute('dir', language === 'ar' ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', language === 'ar' ? 'ar-u-nu-latn' : 'en');
  }, [theme, language]);


  useEffect(() => {
    // Backup Scheduler (3 times a day = every 8 hours)
    const BACKUP_INTERVAL = 8 * 60 * 60 * 1000;

    const checkAndBackup = async () => {
      try {
        const lastBackup = localStorage.getItem('lastBackupTime');
        const now = Date.now();

        if (!lastBackup || now - parseInt(lastBackup) > BACKUP_INTERVAL) {
          console.log('⏳ Starting scheduled backup...');
          // We don't await here to not block UI, but in a real app better handling needed
          // Also we need to ensure user has granted permissions. 
          // If not, this might fail silently or prompt (which is bad if unsolicited).
          // backupService will prompt if needed, but browsers block unsolicited popups.
          // So this only works if token is valid.
          await backupService.createBackup(true);
          localStorage.setItem('lastBackupTime', now.toString());
          console.log('✅ Scheduled backup completed');
        }
      } catch (e) {
        console.warn('Scheduled backup skipped/failed:', e);
      }
    };

    const intervalId = setInterval(checkAndBackup, 60 * 60 * 1000); // Check every hour
    checkAndBackup(); // Check on mount

    return () => clearInterval(intervalId);
  }, []);

  // existing syncManager init commented out
  // useEffect(() => {
  //   syncManager.init();
  // }, []);


  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/auth-callback" element={<AuthCallback />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <MainLayout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/expenses" element={<Expenses />} />
                <Route path="/income" element={<Income />} />
                <Route path="/savings" element={<Savings />} />
                <Route path="/investments" element={<Investments />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/ai-insights" element={<AIInsights />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </MainLayout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

export default App;
