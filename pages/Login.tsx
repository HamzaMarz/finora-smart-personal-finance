import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/useAuthStore';
import { useAppStore } from '../store/useAppStore';
import { AuthService } from '../services/auth.service';
import { useNavigate, useLocation } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import toast from 'react-hot-toast';

const Login: React.FC = () => {
  const { t } = useTranslation();
  const { login } = useAuthStore();
  const { language, setLanguage, setDemoMode } = useAppStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('alex@finora.app');
  const [pass, setPass] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [isNetworkError, setIsNetworkError] = useState(false);

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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setIsNetworkError(false);

    try {
      const response = await AuthService.login(email, pass);
      login(response.user, response.token);
      toast.success(t('login_success'));
    } catch (err: any) {
      if (err.message === 'NETWORK_ERROR') {
        toast.error(t('network_error_msg'));
        setIsNetworkError(true);
      } else {
        toast.error(err.message || t('login_error'));
      }
    } finally {
      setLoading(false);
    }
  };

  const startDemoMode = () => {
    setDemoMode(true);
    login({
      id: 'demo-1',
      name: 'Demo User',
      email: 'alex@finora.app',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Demo'
    }, 'demo-token');
    toast.success('Entered Demo Mode');
  };

  const handleGoogleLogin = () => {
    const googleClientId = '412748045534-gfv6qmfoeap07hg8jclth7jue9cl5g48.apps.googleusercontent.com';
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
          <div className="size-20 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center text-white shadow-xl shadow-primary/20 mx-auto mb-6 rotate-3 hover:rotate-6 transition-transform duration-300">
            <span className="material-symbols-outlined text-4xl">account_balance_wallet</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight mb-2 text-textPrimary dark:text-white">{t('app_name')}</h1>
          <p className="text-lg font-bold text-primary mb-2">{t('personal_finance')}</p>
          <p className="text-textSecondary dark:text-gray-400 font-medium">{t('welcome_back_message')}</p>
        </div>

        <Card className="p-8 shadow-2xl border-none">
          <form className="space-y-6" onSubmit={handleLogin}>
            {(isNetworkError) && (
              <div className="p-4 rounded-xl bg-warning/10 border border-warning/20 text-warning flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined">cloud_off</span>
                  <p className="text-sm font-bold">{t('network_error_msg')}</p>
                </div>
                <Button type="button" onClick={startDemoMode} size="sm" variant="outline" className="text-xs uppercase tracking-wider bg-white/50">
                  {t('enter_demo_offline')}
                </Button>
              </div>
            )}

            <Input
              label={t('email')}
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="name@company.com"
            />

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-bold text-textSecondary uppercase tracking-wider">{t('password')}</label>
                <button type="button" className="text-xs font-bold text-primary hover:text-primary/80 transition-colors">{t('forgot_password')}</button>
              </div>
              <Input
                type="password"
                required
                value={pass}
                onChange={e => setPass(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            <Button
              type="submit"
              isLoading={loading}
              fullWidth
              size="lg"
            >
              {t('login')}
            </Button>
          </form>

          <div className="relative my-8 flex items-center">
            <div className="flex-grow border-t border-gray-100 dark:border-gray-700"></div>
            <span className="px-4 text-[10px] font-bold text-textSecondary uppercase tracking-widest">{t('or')}</span>
            <div className="flex-grow border-t border-gray-100 dark:border-gray-700"></div>
          </div>

          <div className="space-y-3">
            <Button
              type="button"
              onClick={startDemoMode}
              variant="outline"
              fullWidth
              icon="explore"
              className="justify-center"
            >
              {t('explore_demo')}
            </Button>

            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full h-11 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-textPrimary dark:text-white font-bold rounded-xl flex items-center justify-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all text-sm group"
            >
              <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
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
