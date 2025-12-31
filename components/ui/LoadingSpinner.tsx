import React from 'react';

interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

const sizeClasses = {
    sm: 'size-6 border-2',
    md: 'size-10 border-4',
    lg: 'size-16 border-4'
};

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
    size = 'md',
    className = ''
}) => {
    return (
        <div className="flex items-center justify-center h-[50vh]">
            <div
                className={`${sizeClasses[size]} border-primary/30 border-t-primary rounded-full animate-spin ${className}`}
            />
        </div>
    );
};

export default LoadingSpinner;
