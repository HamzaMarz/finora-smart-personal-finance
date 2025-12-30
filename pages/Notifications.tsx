import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';

interface Notification {
  id: string;
  title: string;
  message: string;
  category: 'budget' | 'income' | 'expense' | 'savings' | 'investment' | 'system' | 'alert';
  isRead: boolean;
  createdAt: string;
}

const Notifications: React.FC = () => {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  const categories = [
    { id: 'all', label: t('all'), icon: 'notifications', color: 'primary' },
    { id: 'budget', label: t('budget'), icon: 'account_balance_wallet', color: 'orange' },
    { id: 'income', label: t('income'), icon: 'payments', color: 'green' },
    { id: 'expense', label: t('expense'), icon: 'receipt_long', color: 'red' },
    { id: 'savings', label: t('savings'), icon: 'savings', color: 'blue' },
    { id: 'investment', label: t('investment'), icon: 'show_chart', color: 'purple' },
    { id: 'system', label: t('system'), icon: 'settings', color: 'slate' },
    { id: 'alert', label: t('alert'), icon: 'warning', color: 'yellow' },
  ];

  useEffect(() => {
    fetchNotifications();
  }, [filter]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/notifications?category=${filter}`);
      setNotifications(response.data);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(notifications.map(n =>
        n.id === id ? { ...n, isRead: true } : n
      ));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/mark-all-read');
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications(notifications.filter(n => n.id !== id));
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const deleteAll = async () => {
    if (!confirm(t('delete_all_confirm'))) return;

    try {
      await api.delete('/notifications');
      setNotifications([]);
    } catch (error) {
      console.error('Failed to delete all notifications:', error);
    }
  };

  const getCategoryColor = (category: string) => {
    const cat = categories.find(c => c.id === category);
    return cat?.color || 'primary';
  };

  const getCategoryIcon = (category: string) => {
    const cat = categories.find(c => c.id === category);
    return cat?.icon || 'notifications';
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">{t('notifications')}</h2>
          <p className="text-slate-400 mt-1">
            {unreadCount > 0
              ? (unreadCount === 1 ? t('unread_notif_singular', { count: unreadCount }) : t('unread_notif_plural', { count: unreadCount }))
              : t('all_caught_up')}
          </p>
        </div>

        {notifications.length > 0 && (
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="px-4 py-2 bg-primary/10 text-primary rounded-lg text-sm font-bold hover:bg-primary/20 transition-colors"
              >
                {t('mark_all_read')}
              </button>
            )}
            <button
              onClick={deleteAll}
              className="px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm font-bold hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
            >
              {t('delete_all')}
            </button>
          </div>
        )}
      </div>

      {/* Category Filter */}
      <div className="bg-surface dark:bg-slate-800 rounded-card shadow-sm p-4 border border-slate-100 dark:border-slate-700">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFilter(cat.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold whitespace-nowrap transition-all ${filter === cat.id
                ? `bg-${cat.color}-500 text-white shadow-lg`
                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
              style={filter === cat.id ? {
                backgroundColor: cat.color === 'orange' ? '#f97316' :
                  cat.color === 'green' ? '#22c55e' :
                    cat.color === 'red' ? '#ef4444' :
                      cat.color === 'blue' ? '#3b82f6' :
                        cat.color === 'purple' ? '#a855f7' :
                          cat.color === 'yellow' ? '#eab308' :
                            cat.color === 'slate' ? '#64748b' :
                              '#6366f1'
              } : {}}
            >
              <span className="material-symbols-outlined text-[20px]">{cat.icon}</span>
              <span>{cat.label}</span>
              {cat.id === 'all' && notifications.length > 0 && (
                <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs">{notifications.length}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin size-12 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      ) : notifications.length === 0 ? (
        <div className="bg-surface dark:bg-slate-800 rounded-card shadow-sm p-12 border border-slate-100 dark:border-slate-700 text-center">
          <span className="material-symbols-outlined text-slate-300 dark:text-slate-600 text-6xl mb-4">notifications_off</span>
          <h3 className="text-xl font-bold mb-2">{t('no_notifications')}</h3>
          <p className="text-slate-400">{t('no_notifications_desc')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`bg-surface dark:bg-slate-800 rounded-card shadow-sm p-5 border transition-all hover:shadow-md ${!notification.isRead
                ? 'border-primary/30 bg-primary/5 dark:bg-primary/10'
                : 'border-slate-100 dark:border-slate-700'
                }`}
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div
                  className={`size-12 rounded-full flex items-center justify-center flex-shrink-0`}
                  style={{
                    backgroundColor: getCategoryColor(notification.category) === 'orange' ? '#fed7aa' :
                      getCategoryColor(notification.category) === 'green' ? '#bbf7d0' :
                        getCategoryColor(notification.category) === 'red' ? '#fecaca' :
                          getCategoryColor(notification.category) === 'blue' ? '#bfdbfe' :
                            getCategoryColor(notification.category) === 'purple' ? '#e9d5ff' :
                              getCategoryColor(notification.category) === 'yellow' ? '#fef08a' :
                                getCategoryColor(notification.category) === 'slate' ? '#cbd5e1' :
                                  '#e0e7ff'
                  }}
                >
                  <span
                    className="material-symbols-outlined text-[24px]"
                    style={{
                      color: getCategoryColor(notification.category) === 'orange' ? '#ea580c' :
                        getCategoryColor(notification.category) === 'green' ? '#16a34a' :
                          getCategoryColor(notification.category) === 'red' ? '#dc2626' :
                            getCategoryColor(notification.category) === 'blue' ? '#2563eb' :
                              getCategoryColor(notification.category) === 'purple' ? '#9333ea' :
                                getCategoryColor(notification.category) === 'yellow' ? '#ca8a04' :
                                  getCategoryColor(notification.category) === 'slate' ? '#475569' :
                                    '#4f46e5'
                    }}
                  >
                    {getCategoryIcon(notification.category)}
                  </span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-lg">{notification.title}</h3>
                      {!notification.isRead && (
                        <span className="size-2.5 bg-primary rounded-full flex-shrink-0"></span>
                      )}
                    </div>
                    <span className="text-xs text-slate-400 whitespace-nowrap">
                      {new Date(notification.createdAt).toLocaleDateString(t('language') === 'ar' ? 'ar-SA-u-nu-latn' : 'en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>

                  <p className="text-slate-600 dark:text-slate-400 mb-3">{notification.message}</p>

                  <div className="flex items-center gap-2">
                    <span
                      className="text-xs px-3 py-1 rounded-full font-bold"
                      style={{
                        backgroundColor: getCategoryColor(notification.category) === 'orange' ? '#fed7aa' :
                          getCategoryColor(notification.category) === 'green' ? '#bbf7d0' :
                            getCategoryColor(notification.category) === 'red' ? '#fecaca' :
                              getCategoryColor(notification.category) === 'blue' ? '#bfdbfe' :
                                getCategoryColor(notification.category) === 'purple' ? '#e9d5ff' :
                                  getCategoryColor(notification.category) === 'yellow' ? '#fef08a' :
                                    getCategoryColor(notification.category) === 'slate' ? '#cbd5e1' :
                                      '#e0e7ff',
                        color: getCategoryColor(notification.category) === 'orange' ? '#ea580c' :
                          getCategoryColor(notification.category) === 'green' ? '#16a34a' :
                            getCategoryColor(notification.category) === 'red' ? '#dc2626' :
                              getCategoryColor(notification.category) === 'blue' ? '#2563eb' :
                                getCategoryColor(notification.category) === 'purple' ? '#9333ea' :
                                  getCategoryColor(notification.category) === 'yellow' ? '#ca8a04' :
                                    getCategoryColor(notification.category) === 'slate' ? '#475569' :
                                      '#4f46e5'
                      }}
                    >
                      {t(notification.category)}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2">
                  {!notification.isRead && (
                    <button
                      onClick={() => markAsRead(notification.id)}
                      className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                      title="Mark as read"
                    >
                      <span className="material-symbols-outlined text-slate-400 text-[20px]">done</span>
                    </button>
                  )}
                  <button
                    onClick={() => deleteNotification(notification.id)}
                    className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <span className="material-symbols-outlined text-red-500 text-[20px]">delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;
