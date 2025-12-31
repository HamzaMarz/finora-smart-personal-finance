import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/useAuthStore';
import { useNotificationStore } from '../store/useNotificationStore';

const Sidebar: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const { unreadCount } = useNotificationStore();

    const navItems = [
        { path: '/', label: 'dashboard', icon: 'dashboard' },
        { path: '/expenses', label: 'expenses', icon: 'receipt_long' },
        { path: '/income', label: 'income', icon: 'payments' },
        { path: '/savings', label: 'savings', icon: 'savings' },
        { path: '/investments', label: 'investments', icon: 'show_chart' },
        { path: '/reports', label: 'reports', icon: 'bar_chart' },
        { path: '/notifications', label: 'notifications', icon: 'notifications' },
        { path: '/ai-insights', label: 'ai_insights', icon: 'auto_awesome' },
        { path: '/settings', label: 'settings', icon: 'settings' },
    ];

    return (
        <aside className="hidden lg:flex flex-col w-72 bg-surface dark:bg-darkSurface border-r border-gray-100 dark:border-gray-800 h-screen sticky top-0 transition-colors duration-200">
            {/* Logo Area */}
            <div className="p-8 pb-4">
                <div className="flex items-center gap-4">
                    <div className="size-12 rounded-2xl bg-gradient-to-br from-primary to-secondary text-white flex items-center justify-center shadow-lg shadow-primary/20">
                        <span className="material-symbols-outlined text-3xl">account_balance_wallet</span>
                    </div>
                    <div className="flex flex-col">
                        <h1 className="font-heading font-bold text-2xl text-textPrimary dark:text-white tracking-tight">{t('app_name')}</h1>
                        <span className="text-[10px] font-bold tracking-widest text-secondary uppercase opacity-80">Personal Finance</span>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto no-scrollbar">
                <p className="px-4 text-xs font-bold text-textSecondary dark:text-gray-500 uppercase tracking-wider mb-2">{t('menu')}</p>
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative ${isActive
                                ? 'bg-primary text-white shadow-lg shadow-primary/25 font-semibold'
                                : 'text-textSecondary dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-primary dark:hover:text-primary'
                            }`
                        }
                    >
                        <span className="material-symbols-outlined text-[22px] group-hover:scale-110 transition-transform duration-200">
                            {item.icon}
                        </span>
                        <span className="text-sm">{t(item.label)}</span>
                        {item.label === 'notifications' && unreadCount > 0 && (
                            <span className={`ms-auto text-[10px] font-bold px-2 py-0.5 rounded-full ${window.location.hash.endsWith('notifications')
                                    ? 'bg-white/20 text-white'
                                    : 'bg-error text-white shadow-sm shadow-error/40'
                                }`}>
                                {unreadCount > 99 ? '99+' : unreadCount}
                            </span>
                        )}
                    </NavLink>
                ))}
            </nav>

            {/* User Profile */}
            <div className="p-4 border-t border-gray-100 dark:border-gray-800">
                <div
                    onClick={() => navigate('/settings')}
                    className="flex items-center gap-3 p-3 rounded-2xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 group border border-transparent hover:border-gray-100 dark:hover:border-gray-700"
                >
                    <div className="relative">
                        <img
                            src={user?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'}
                            alt={user?.name}
                            className="size-10 rounded-full ring-2 ring-gray-100 dark:ring-gray-700 group-hover:ring-primary/20 transition-all"
                        />
                        <div className="absolute bottom-0 right-0 size-3 bg-success rounded-full border-2 border-white dark:border-darkSurface"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-textPrimary dark:text-white truncate group-hover:text-primary transition-colors">{user?.name || 'User'}</p>
                        <p className="text-xs text-textSecondary dark:text-gray-500 truncate">{user?.email || 'user@example.com'}</p>
                    </div>
                    <span className="material-symbols-outlined text-textSecondary dark:text-gray-500 group-hover:text-primary transition-colors">settings</span>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
