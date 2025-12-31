import React from 'react';

interface EmptyStateProps {
    icon?: string;
    message: string;
    className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
    icon = 'inbox',
    message,
    className = ''
}) => {
    return (
        <div className={`flex flex-col items-center gap-3 py-16 ${className}`}>
            <span className="material-symbols-outlined text-4xl opacity-50 text-textSecondary dark:text-gray-400">
                {icon}
            </span>
            <p className="font-medium text-textSecondary dark:text-gray-400">{message}</p>
        </div>
    );
};

export default EmptyState;
