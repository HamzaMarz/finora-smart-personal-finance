import React from 'react';
import { useTranslation } from 'react-i18next';
import { Toaster } from 'react-hot-toast';
import { useNotificationStore } from '../store/useNotificationStore';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import MobileNav from '../components/MobileNav';

const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { i18n } = useTranslation();

    // Global Notification Store Init
    const {
        fetchNotifications,
        pollNotifications
    } = useNotificationStore();

    const [notificationFilter, setNotificationFilter] = React.useState('all');

    // Initial Fetch & Polling
    React.useEffect(() => {
        fetchNotifications(notificationFilter);

        const intervalId = setInterval(() => {
            pollNotifications();
        }, 10000); // Poll every 10 seconds

        return () => clearInterval(intervalId);
    }, []);

    // Re-fetch when filter changes
    React.useEffect(() => {
        fetchNotifications(notificationFilter);
    }, [notificationFilter]);

    return (
        <div className="flex h-screen bg-background dark:bg-darkBackground overflow-hidden font-body text-textPrimary dark:text-textPrimary" dir={i18n.dir()}>
            <Toaster
                position={i18n.dir() === 'rtl' ? 'bottom-left' : 'bottom-right'}
                toastOptions={{
                    className: 'dark:bg-darkSurface dark:text-white',
                    style: {
                        background: '#333',
                        color: '#fff',
                        direction: i18n.dir() as any
                    }
                }}
            />

            {/* Sidebar - Desktop */}
            <Sidebar />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 h-full relative">
                <Header />

                <main className="flex-1 overflow-y-auto p-4 lg:p-8 pb-24 lg:pb-8 scroll-smooth no-scrollbar">
                    <div className="max-w-7xl mx-auto w-full">
                        {children}
                    </div>
                </main>

                {/* Bottom Navigation - Mobile */}
                <MobileNav />
            </div >
        </div >
    );
};

export default MainLayout;
