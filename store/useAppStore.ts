
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import i18n from '../i18n';

interface AppState {
  theme: 'light' | 'dark' | 'system';
  language: 'en' | 'ar';
  aiEnabled: boolean;
  currency: string;
  demoMode: boolean; // New state for backend connectivity fallback
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setLanguage: (lang: 'en' | 'ar') => void;
  setAiEnabled: (enabled: boolean) => void;
  setCurrency: (currency: string) => void;
  setDemoMode: (enabled: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      theme: 'light',
      language: 'en',
      aiEnabled: false,
      currency: 'USD',
      demoMode: false,
      setTheme: (theme) => {
        set({ theme });
        if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      },
      setLanguage: (lang) => {
        set({ language: lang });
        i18n.changeLanguage(lang);
        document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
        document.documentElement.setAttribute('lang', lang === 'ar' ? 'ar-u-nu-latn' : 'en');
      },
      setAiEnabled: (enabled) => set({ aiEnabled: enabled }),
      setCurrency: (currency) => set({ currency }),
      setDemoMode: (demoMode) => set({ demoMode }),
    }),
    {
      name: 'finora-app-settings',
    }
  )
);
