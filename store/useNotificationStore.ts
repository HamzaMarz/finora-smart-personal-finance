import { create } from 'zustand';
import api from '../services/api';
import { FinanceService } from '../services/finance.service';
import toast from 'react-hot-toast';
import i18n from '../i18n';

interface Notification {
    id: string;
    title: string;
    message: string;
    category: string;
    isRead: boolean;
    createdAt: string;
}

interface NotificationStore {
    notifications: Notification[];
    unreadCount: number;
    loading: boolean;
    fetchNotifications: (category?: string) => Promise<void>;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    deleteNotification: (id: string) => Promise<void>;
    deleteAll: () => Promise<void>;

    // Polling Logic
    lastPolledAt: number;
    pollNotifications: () => Promise<void>;
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
    notifications: [],
    unreadCount: 0,
    loading: false,
    lastPolledAt: Date.now(),

    fetchNotifications: async (category = 'all') => {
        set({ loading: true });
        try {
            const [notifs, countData] = await Promise.all([
                FinanceService.getNotifications(category),
                FinanceService.getNotificationUnreadCount()
            ]);

            set({
                notifications: notifs,
                unreadCount: countData.count,
                loading: false
            });
        } catch (error) {
            console.error('Failed to fetch notifications', error);
            set({ loading: false });
        }
    },

    pollNotifications: async () => {
        const { lastPolledAt } = get();
        try {
            // Fetch latest notifications
            // For offline usage we rely on periodic fetch or sync events generally, but poll can work if FinanceService hits IndexedDB
            const latestNotifs: Notification[] = await FinanceService.getNotifications('all');
            const countRes = await FinanceService.getNotificationUnreadCount();

            const newPolledAt = Date.now();

            // Check for new notifications created after lastPolledAt
            const newNotifs = latestNotifs.filter(n => {
                const createdAt = new Date(n.createdAt).getTime();
                return createdAt > lastPolledAt && !n.isRead;
            });

            if (newNotifs.length > 0) {
                newNotifs.forEach(n => {
                    let msg = n.message;
                    try {
                        if (msg.trim().startsWith('{')) {
                            const parsed = JSON.parse(msg);
                            if (parsed.key) {
                                msg = i18n.t(parsed.key, parsed.params);
                            }
                        } else if (i18n.exists(msg)) {
                            msg = i18n.t(msg);
                        }
                    } catch (e) { }

                    toast(msg, {
                        icon: getCategoryEmoji(n.category),
                        style: {
                            background: '#333',
                            color: '#fff',
                            direction: i18n.dir(),
                            fontFamily: i18n.language === 'ar' ? 'Tajawal, sans-serif' : 'inherit',
                            fontSize: '16px',
                            fontWeight: '500',
                            padding: '16px',
                            maxWidth: '400px'
                        },
                        duration: 5000
                    });
                });
            }

            set({
                notifications: latestNotifs,
                unreadCount: countRes.count,
                lastPolledAt: newPolledAt
            });
        } catch (error) {
            console.error('Polling failed', error);
        }
    },

    markAsRead: async (id) => {
        try {
            await FinanceService.markNotificationRead(id);
            set(state => ({
                notifications: state.notifications.map(n => n.id === id ? { ...n, isRead: true } : n),
                unreadCount: Math.max(0, state.unreadCount - 1)
            }));
        } catch (error) {
            console.error(error);
        }
    },

    markAllAsRead: async () => {
        try {
            await FinanceService.markAllNotificationsRead();
            set(state => ({
                notifications: state.notifications.map(n => ({ ...n, isRead: true })),
                unreadCount: 0
            }));
        } catch (error) {
            console.error(error);
        }
    },

    deleteNotification: async (id) => {
        try {
            await FinanceService.deleteNotification(id);
            set(state => ({
                notifications: state.notifications.filter(n => n.id !== id),
                unreadCount: state.notifications.find(n => n.id === id && !n.isRead)
                    ? Math.max(0, state.unreadCount - 1)
                    : state.unreadCount
            }));
        } catch (error) {
            console.error(error);
        }
    },

    deleteAll: async () => {
        try {
            await FinanceService.deleteAllNotifications();
            set({ notifications: [], unreadCount: 0 });
        } catch (error) {
            console.error(error);
        }
    }
}));

function getCategoryEmoji(category: string): string {
    switch (category) {
        case 'income': return '💰';
        case 'expense': return '💸';
        case 'savings': return '🐷';
        case 'investment': return '📈';
        case 'alert': return '⚠️';
        case 'system': return '⚙️';
        default: return '🔔';
    }
}
