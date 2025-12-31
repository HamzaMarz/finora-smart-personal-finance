import React from 'react';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
}

const Card: React.FC<CardProps> = ({ children, className = '', onClick }) => {
    return (
        <div
            className={`bg-surface dark:bg-darkSurface rounded-2xl shadow-card dark:shadow-none border border-gray-100 dark:border-gray-800 transition-all duration-200 ${className}`}
            onClick={onClick}
        >
            {children}
        </div>
    );
};

export default Card;
