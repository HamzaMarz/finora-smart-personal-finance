import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/useAuthStore';
import { useAppStore } from '../store/useAppStore';
import { useNavigate, useLocation } from 'react-router-dom';
import Card from '../components/ui/Card';
import toast from 'react-hot-toast';

const Login: React.FC = () => {
  const { t } = useTranslation();
  const { login } = useAuthStore();
  const { language, setLanguage } = useAppStore();
  const navigate = useNavigate();

  // Check for OAuth token
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    let token = urlParams.get('token');

    if (!token && window.location.hash) {
      const hashParts = window.location.hash.split('?');
      if (hashParts.length > 1) {
        const hashParams = new URLSearchParams(hashParts[1]);
        token = hashParams.get('token');
      }
    }

    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        login({
          id: payload.userId,
          email: payload.email,
          name: payload.email.split('@')[0],
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${payload.email}`
        }, token);

        window.history.replaceState({}, '', '/');
        navigate('/');
        toast.success(t('login_success'));
      } catch (err) {
        console.error('Failed to parse token:', err);
        toast.error('Authentication failed');
      }
    }
  }, [login, navigate]);

  const handleGoogleLogin = () => {
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '412748045534-gfv6qmfoeap07hg8jclth7jue9cl5g48.apps.googleusercontent.com';
    const redirectUri = 'http://localhost:5000/auth/google/callback';
    const scope = 'email profile';
    const responseType = 'code';
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${googleClientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=${responseType}&scope=${encodeURIComponent(scope)}`;
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 p-6 relative overflow-hidden font-body">
      {/* Dynamic Background */}
      <div className="absolute top-[-20%] start-[-10%] size-[600px] bg-primary/20 rounded-full blur-[120px] animate-pulse-slow"></div>
      <div className="absolute bottom-[-20%] end-[-10%] size-[600px] bg-secondary/20 rounded-full blur-[120px] animate-pulse-slow" style={{ animationDelay: '2s' }}></div>

      <header className="fixed top-0 start-0 end-0 p-6 flex justify-end z-20">
        <button
          onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
          className="flex items-center gap-2 text-sm font-bold text-textSecondary hover:text-primary transition-colors bg-white/50 dark:bg-black/20 backdrop-blur-md px-3 py-1.5 rounded-full"
        >
          <span className="material-symbols-outlined text-[20px]">language</span>
          <span>{language === 'en' ? 'العربية' : 'English'}</span>
        </button>
      </header>

      <div className="w-full max-w-[420px] space-y-8 relative z-10 animate-fade-in-up">
        <div className="text-center">
          <div className="size-20 bg-white dark:bg-gray-800 rounded-2xl flex items-center justify-center shadow-xl shadow-black/5 mx-auto mb-6 rotate-3 hover:rotate-6 transition-transform duration-300 overflow-hidden border border-gray-100 dark:border-gray-800">
            <img src="/assets/urwallet_logo.png" alt="UrWallet Logo" className="size-16 object-contain" />
          </div>
          <h1 className="text-4xl font-black tracking-tight mb-2 text-textPrimary dark:text-white">{t('app_name')}</h1>
          <p className="text-lg font-bold text-primary mb-2">{t('personal_finance')}</p>
          <p className="text-textSecondary dark:text-gray-400 font-medium">{t('welcome_back_message')}</p>
        </div>

        <Card className="p-8 shadow-2xl border-none">
          {/* Google Login as Primary Method */}
          <div className="flex flex-col gap-4">
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full h-12 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-textPrimary dark:text-white font-bold rounded-xl flex items-center justify-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all text-base shadow-sm group"
            >
              <svg className="w-6 h-6 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              {t('google_sign_in')}
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Login;
