import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNotificationStore } from '../store/useNotificationStore';
import { useNavigate } from 'react-router-dom';

const Header: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const {
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead
    } = useNotificationStore();

    const [showNotifications, setShowNotifications] = React.useState(false);
    const [notificationFilter, setNotificationFilter] = React.useState('all');

    // Close notifications when clicking outside
    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (!target.closest('.notification-container')) {
                setShowNotifications(false);
            }
        };

        if (showNotifications) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showNotifications]);

    return (
        <header className="h-20 flex-shrink-0 bg-surface/80 dark:bg-darkSurface/90 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800 flex items-center justify-between px-6 z-20 sticky top-0 transition-colors duration-200">
            {/* Mobile Logo (Visible only on lg:hidden is handled by parent layout mostly, but we add it here just in case or for small screens) */}
            <div className="lg:hidden flex items-center gap-3">
                <div className="size-10 rounded-xl bg-gradient-to-br from-primary to-secondary text-white flex items-center justify-center shadow-lg shadow-primary/20">
                    <span className="material-symbols-outlined">account_balance_wallet</span>
                </div>
                <h1 className="font-heading font-bold text-lg text-textPrimary dark:text-white">{t('app_name')}</h1>
            </div>

            {/* Desktop Welcome */}
            <div className="hidden lg:block">
                <h2 className="text-2xl font-bold text-textPrimary dark:text-white">{t('dashboard')}</h2>
                <p className="text-base text-textSecondary dark:text-gray-400">{t('welcome_back_message')}</p>
            </div>

            <div className="flex items-center gap-4 relative notification-container">
                <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="size-12 flex items-center justify-center rounded-2xl text-textSecondary dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-primary transition-all duration-200 relative group"
                >
                    <span className="material-symbols-outlined text-[26px] group-hover:scale-110 transition-transform">notifications</span>
                    {unreadCount > 0 && (
                        <span className="absolute top-3 right-3 size-2.5 bg-error rounded-full border-2 border-surface dark:border-darkSurface animate-pulse"></span>
                    )}
                </button>

                {showNotifications && (
                    <div className="absolute top-16 ltr:right-0 rtl:left-0 w-[400px] bg-white dark:bg-darkSurface rounded-2xl shadow-xl shadow-gray-200/50 dark:shadow-black/50 border border-gray-100 dark:border-gray-800 z-50 overflow-hidden animation-fade-in-up">
                        <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 backdrop-blur-sm">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-lg text-textPrimary dark:text-white">{t('notifications')}</h3>
                                {unreadCount > 0 && (
                                    <button
                                        onClick={markAllAsRead}
                                        className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
                                    >
                                        {t('mark_all_read')}
                                    </button>
                                )}
                            </div>

                            {/* Category Filter */}
                            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                                {['all', 'budget', 'income', 'expense', 'savings', 'investment', 'alert'].map((cat) => (
                                    <button
                                        key={cat}
                                        onClick={() => setNotificationFilter(cat)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${notificationFilter === cat
                                            ? 'bg-primary text-white shadow-md shadow-primary/20'
                                            : 'bg-white dark:bg-gray-700 text-textSecondary dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600'
                                            }`}
                                    >
                                        <span className="text-sm">{t(cat)}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                            {notifications.length === 0 ? (
                                <div className="p-12 text-center flex flex-col items-center">
                                    <div className="size-16 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center mb-4">
                                        <span className="material-symbols-outlined text-gray-300 dark:text-gray-600 text-3xl">notifications_off</span>
                                    </div>
                                    <p className="text-textSecondary dark:text-gray-400 font-medium">{t('no_notifications')}</p>
                                </div>
                            ) : (
                                notifications.map((notification) => {
                                    // Helper to check for JSON message (Same logic as before)
                                    const getLocalizedText = (text: string) => {
                                        try {
                                            if (!text.trim().startsWith('{')) return text;
                                            const parsed = JSON.parse(text);
                                            return parsed.key ? t(parsed.key, parsed.params) : text;
                                        } catch (e) { return text; }
                                    };

                                    return (
                                        <div
                                            key={notification.id}
                                            onClick={() => markAsRead(notification.id)}
                                            className={`p-4 border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer relative group ${!notification.isRead ? 'bg-primary/5 dark:bg-primary/5' : ''
                                                }`}
                                        >
                                            <div className="flex items-start gap-4">
                                                <div className={`size-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm ${notification.category === 'budget' ? 'bg-orange-100 text-orange-600' :
                                                    notification.category === 'income' ? 'bg-green-100 text-green-600' :
                                                        notification.category === 'expense' ? 'bg-red-100 text-red-600' :
                                                            notification.category === 'alert' ? 'bg-yellow-100 text-yellow-600' :
                                                                'bg-primary/10 text-primary'
                                                    }`}>
                                                    <span className="material-symbols-outlined text-[20px]">
                                                        {notification.category === 'alert' ? 'warning' : 'notifications'}
                                                    </span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <h4 className="font-bold text-sm text-textPrimary dark:text-white truncate">
                                                            {t(notification.title) || notification.title}
                                                        </h4>
                                                        <span className="text-[10px] text-textSecondary dark:text-gray-500">
                                                            {new Date(notification.createdAt).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-textSecondary dark:text-gray-400 leading-relaxed line-clamp-2">
                                                        {getLocalizedText(notification.message)}
                                                    </p>
                                                </div>
                                                {!notification.isRead && (
                                                    <span className="absolute top-1/2 right-4 -translate-y-1/2 size-2 bg-primary rounded-full"></span>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                        </div>

                        <div className="p-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 backdrop-blur-sm">
                            <button
                                onClick={() => navigate('/notifications')}
                                className="w-full py-2.5 text-sm font-bold text-primary hover:bg-primary/10 rounded-xl transition-colors flex items-center justify-center gap-2 group"
                            >
                                {t('view_all_notifications')}
                                <span className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">arrow_forward</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
};

export default Header;
