import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/useAuthStore';

const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { t } = useTranslation();
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuthStore();

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

    const [showNotifications, setShowNotifications] = React.useState(false);
    const [notifications, setNotifications] = React.useState<any[]>([]);
    const [notificationFilter, setNotificationFilter] = React.useState('all');
    const [unreadCount, setUnreadCount] = React.useState(0);

    // Fetch notifications
    React.useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const response = await fetch(`/notifications?category=${notificationFilter}`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('finora-auth')}`
                    }
                });
                if (response.ok) {
                    const data = await response.json();
                    setNotifications(data);
                }
            } catch (error) {
                console.error('Failed to fetch notifications:', error);
            }
        };

        const fetchUnreadCount = async () => {
            try {
                const response = await fetch('/notifications/unread-count');
                if (response.ok) {
                    const data = await response.json();
                    setUnreadCount(data.count);
                }
            } catch (error) {
                console.error('Failed to fetch unread count:', error);
            }
        };

        fetchNotifications();
        fetchUnreadCount();
    }, [notificationFilter]);

    const markAsRead = async (id: string) => {
        try {
            await fetch(`/notifications/${id}/read`, { method: 'PUT' });
            setNotifications(notifications.map(n =>
                n.id === id ? { ...n, isRead: true } : n
            ));
            setUnreadCount(Math.max(0, unreadCount - 1));
        } catch (error) {
            console.error('Failed to mark as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await fetch('/notifications/mark-all-read', { method: 'PUT' });
            setNotifications(notifications.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    };

    return (
        <div className="flex h-screen bg-background dark:bg-slate-900 overflow-hidden">
            {/* Sidebar - Desktop */}
            <aside className="hidden lg:flex flex-col w-64 bg-surface dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700">
                <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                        <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                            <span className="material-symbols-outlined text-2xl">account_balance_wallet</span>
                        </div>
                        <h1 className="font-heading font-bold text-xl text-slate-800 dark:text-white">{t('app_name')}</h1>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all group ${isActive
                                    ? 'bg-primary/10 text-primary'
                                    : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                                }`
                            }
                        >
                            <span className="material-symbols-outlined text-[20px] group-hover:scale-110 transition-transform">
                                {item.icon}
                            </span>
                            <span className="font-bold text-sm">{t(item.label)}</span>
                        </NavLink>
                    ))}
                </nav>

                {/* User Profile */}
                <div
                    onClick={() => navigate('/settings')}
                    className="p-4 border-t border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <img
                            src={user?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'}
                            alt={user?.name}
                            className="size-10 rounded-full ring-2 ring-primary/20"
                        />
                        <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm text-slate-800 dark:text-white truncate">{user?.name}</p>
                            <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                        </div>
                        <span className="material-symbols-outlined text-slate-400 text-[18px]">settings</span>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
                <header className="h-16 flex-shrink-0 bg-surface dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-6 z-10">
                    <div className="flex items-center gap-4 lg:hidden">
                        <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                            <span className="material-symbols-outlined">account_balance_wallet</span>
                        </div>
                        <h1 className="font-heading font-bold text-lg text-slate-800 dark:text-white">{t('app_name')}</h1>
                    </div>
                    <div className="hidden lg:block">
                        <span className="text-sm text-slate-400">{t('welcome')}</span>
                    </div>
                    <div className="flex items-center gap-4 relative">
                        <button
                            onClick={() => setShowNotifications(!showNotifications)}
                            className="size-10 flex items-center justify-center rounded-xl text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors relative"
                        >
                            <span className="material-symbols-outlined">notifications</span>
                            {unreadCount > 0 && (
                                <span className="absolute top-2.5 end-2.5 size-2 bg-warning rounded-full border-2 border-surface dark:border-slate-800"></span>
                            )}
                        </button>

                        {/* Notifications Dropdown */}
                        {showNotifications && (
                            <div className="absolute top-14 end-0 w-96 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 z-50">
                                <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="font-bold text-lg">{t('notifications')}</h3>
                                        <button
                                            onClick={() => setShowNotifications(false)}
                                            className="size-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-slate-400 text-[18px]">close</span>
                                        </button>
                                    </div>

                                    {/* Category Filter */}
                                    <div className="flex gap-2 overflow-x-auto pb-2">
                                        {['all', 'budget', 'income', 'expense', 'savings', 'investment', 'system', 'alert'].map((cat) => (
                                            <button
                                                key={cat}
                                                onClick={() => setNotificationFilter(cat)}
                                                className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${notificationFilter === cat
                                                    ? 'bg-primary text-white'
                                                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                                                    }`}
                                            >
                                                {t(cat)}
                                            </button>
                                        ))}
                                    </div>

                                    {unreadCount > 0 && (
                                        <button
                                            onClick={markAllAsRead}
                                            className="mt-2 text-xs text-primary hover:underline"
                                        >
                                            {t('mark_all_read')} ({unreadCount})
                                        </button>
                                    )}
                                </div>

                                <div className="max-h-96 overflow-y-auto">
                                    {notifications.length === 0 ? (
                                        <div className="p-8 text-center">
                                            <span className="material-symbols-outlined text-slate-300 dark:text-slate-600 text-5xl mb-2">notifications_off</span>
                                            <p className="text-slate-400 text-sm">{t('no_notifications')}</p>
                                        </div>
                                    ) : (
                                        notifications.map((notification) => (
                                            <div
                                                key={notification.id}
                                                className={`p-4 border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer ${!notification.isRead ? 'bg-primary/5' : ''
                                                    }`}
                                                onClick={() => markAsRead(notification.id)}
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div className={`size-10 rounded-full flex items-center justify-center flex-shrink-0 ${notification.category === 'budget' ? 'bg-orange-100 dark:bg-orange-900/20' :
                                                        notification.category === 'income' ? 'bg-green-100 dark:bg-green-900/20' :
                                                            notification.category === 'expense' ? 'bg-red-100 dark:bg-red-900/20' :
                                                                notification.category === 'savings' ? 'bg-blue-100 dark:bg-blue-900/20' :
                                                                    notification.category === 'investment' ? 'bg-purple-100 dark:bg-purple-900/20' :
                                                                        notification.category === 'alert' ? 'bg-yellow-100 dark:bg-yellow-900/20' :
                                                                            'bg-primary/10'
                                                        }`}>
                                                        <span className={`material-symbols-outlined text-[20px] ${notification.category === 'budget' ? 'text-orange-600' :
                                                            notification.category === 'income' ? 'text-green-600' :
                                                                notification.category === 'expense' ? 'text-red-600' :
                                                                    notification.category === 'savings' ? 'text-blue-600' :
                                                                        notification.category === 'investment' ? 'text-purple-600' :
                                                                            notification.category === 'alert' ? 'text-yellow-600' :
                                                                                'text-primary'
                                                            }`}>
                                                            {notification.category === 'budget' ? 'account_balance_wallet' :
                                                                notification.category === 'income' ? 'payments' :
                                                                    notification.category === 'expense' ? 'receipt_long' :
                                                                        notification.category === 'savings' ? 'savings' :
                                                                            notification.category === 'investment' ? 'show_chart' :
                                                                                notification.category === 'alert' ? 'warning' :
                                                                                    'notifications'}
                                                        </span>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <h4 className="font-bold text-sm truncate">{notification.title}</h4>
                                                            {!notification.isRead && (
                                                                <span className="size-2 bg-primary rounded-full flex-shrink-0"></span>
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">{notification.message}</p>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className="text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                                                                {notification.category}
                                                            </span>
                                                            <p className="text-xs text-slate-400">{new Date(notification.createdAt).toLocaleDateString()}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>

                                <div className="p-3 border-t border-slate-200 dark:border-slate-700">
                                    <button
                                        onClick={() => navigate('/notifications')}
                                        className="w-full py-2 text-sm font-bold text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                    >
                                        {t('view_all_notifications')}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-6">
                    {children}
                </main>

                {/* Bottom Navigation - Mobile */}
                <nav className="lg:hidden flex items-center justify-around bg-surface dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 h-16 px-2">
                    {navItems.slice(0, 5).map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `flex flex-col items-center gap-1 p-2 rounded-xl transition-all min-w-[60px] ${isActive ? 'text-primary' : 'text-slate-400'
                                }`
                            }
                        >
                            <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
                            <span className="text-[10px] font-bold">{t(item.label)}</span>
                        </NavLink>
                    ))}
                </nav>
            </div>
        </div>
    );
};

export default MainLayout;
