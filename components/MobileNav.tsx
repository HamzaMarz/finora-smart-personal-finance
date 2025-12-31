import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useNotificationStore } from '../store/useNotificationStore';

const MobileNav: React.FC = () => {
    const { t } = useTranslation();
    const { unreadCount } = useNotificationStore();

    const navItems = [
        { path: '/', label: 'dashboard', icon: 'dashboard' },
        { path: '/expenses', label: 'expenses', icon: 'receipt_long' },
        { path: '/income', label: 'income', icon: 'payments' },
        { path: '/savings', label: 'savings', icon: 'savings' },
        // { path: '/notifications', label: 'notifications', icon: 'notifications' }, // Usually handled in header on mobile or specific separate menu, but user asked for responsive bottom nav.
        { path: '/settings', label: 'settings', icon: 'settings' },
    ];

    return (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-surface/90 dark:bg-darkSurface/90 backdrop-blur-lg border-t border-gray-100 dark:border-gray-800 h-[72px] flex items-center justify-around px-2 z-30 pb-safe">
            {navItems.map((item) => (
                <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                        `flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-200 min-w-[60px] relative group ${isActive
                            ? 'text-primary'
                            : 'text-textSecondary dark:text-gray-400 hover:text-primary dark:hover:text-primary'
                        }`
                    }
                >
                    <div className={({ isActive }: { isActive: boolean }) => `relative p-1 rounded-xl transition-all ${isActive ? 'bg-primary/10' : ''}`}>
                        <span className={`material-symbols-outlined text-[24px] transition-transform duration-200 group-active:scale-95`}>{item.icon}</span>
                        {item.label === 'notifications' && unreadCount > 0 && (
                            <span className="absolute -top-0.5 -right-0.5 size-3 bg-error rounded-full border-2 border-surface dark:border-darkSurface"></span>
                        )}
                    </div>
                    {/* Label (optional on very small screens, but good for accessibility) */}
                    <span className="text-[10px] font-bold tracking-wide">{t(item.label)}</span>
                </NavLink>
            ))}
        </nav>
    );
};

export default MobileNav;
