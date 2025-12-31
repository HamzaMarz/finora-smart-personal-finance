import { create } from 'zustand';
import api from '../services/api';
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
            const url = category === 'all' ? '/notifications' : `/notifications?category=${category}`;
            const [notifJson, countJson] = await Promise.all([
                api.get(url),
                api.get('/notifications/unread-count')
            ]);

            set({
                notifications: notifJson.data,
                unreadCount: countJson.data.count,
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
            // Fetch latest notifications (assuming sort desc by createdAt)
            const response = await api.get('/notifications');
            const latestNotifs: Notification[] = response.data;
            const countRes = await api.get('/notifications/unread-count');

            const newPolledAt = Date.now();

            // Check for new notifications created after lastPolledAt
            // (Using a small buffer or relying on strict inequality)
            const newNotifs = latestNotifs.filter(n => {
                const createdAt = new Date(n.createdAt).getTime();
                return createdAt > lastPolledAt && !n.isRead;
            });

            if (newNotifs.length > 0) {
                // Show toast for the most recent one (or summary)
                newNotifs.forEach(n => {
                    // Try to translate if it's a key or a JSON object, otherwise show message
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
                    } catch (e) {
                        // fallback to original string
                    }

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
                unreadCount: countRes.data.count,
                lastPolledAt: newPolledAt
            });
        } catch (error) {
            console.error('Polling failed', error);
        }
    },

    markAsRead: async (id) => {
        try {
            await api.put(`/notifications/${id}/read`);
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
            await api.put('/notifications/mark-all-read');
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
            await api.delete(`/notifications/${id}`);
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
            await api.delete('/notifications');
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
