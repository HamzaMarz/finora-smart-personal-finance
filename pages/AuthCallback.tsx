import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

const AuthCallback: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuthStore();

    useEffect(() => {
        // Parse token and user from URL hash
        const hash = location.hash.substring(1); // Remove the '#'
        const params = new URLSearchParams(hash.split('?')[1]);

        const token = params.get('token');
        const userStr = params.get('user');
        const error = params.get('error');

        if (error) {
            console.error('OAuth error:', error);
            navigate('/login');
            return;
        }

        if (token && userStr) {
            try {
                const user = JSON.parse(decodeURIComponent(userStr));
                login(user, token);
                navigate('/');
            } catch (err) {
                console.error('Failed to parse user data:', err);
                navigate('/login');
            }
        } else {
            navigate('/login');
        }
    }, [location, login, navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-background dark:bg-slate-900">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-slate-600 dark:text-slate-400">Completing sign in...</p>
            </div>
        </div>
    );
};

export default AuthCallback;
