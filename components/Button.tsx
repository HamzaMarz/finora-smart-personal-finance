import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
    icon?: string;
    fullWidth?: boolean;
}

const Button: React.FC<ButtonProps> = ({
    children,
    variant = 'primary',
    size = 'md',
    isLoading = false,
    icon,
    fullWidth = false,
    className = '',
    disabled,
    ...props
}) => {
    const baseStyles = "inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none select-none";

    const variants = {
        primary: "bg-primary text-white shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5",
        secondary: "bg-secondary text-white shadow-lg shadow-secondary/25 hover:shadow-xl hover:shadow-secondary/30 hover:-translate-y-0.5",
        outline: "bg-transparent border-2 border-gray-200 dark:border-gray-700 text-textPrimary dark:text-white hover:border-primary hover:text-primary dark:hover:border-primary dark:hover:text-primary",
        ghost: "bg-transparent text-textSecondary dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-textPrimary dark:hover:text-white",
        danger: "bg-error text-white shadow-lg shadow-error/25 hover:shadow-xl hover:shadow-error/30 hover:-translate-y-0.5",
    };

    const sizes = {
        sm: "text-xs px-3 py-1.5 gap-1.5",
        md: "text-sm px-5 py-2.5 gap-2",
        lg: "text-base px-6 py-3.5 gap-2.5",
    };

    const widthClass = fullWidth ? "w-full" : "";

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${widthClass} ${className}`}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading && (
                <span className="material-symbols-outlined animate-spin text-[1.25em]">progress_activity</span>
            )}
            {!isLoading && icon && (
                <span className="material-symbols-outlined text-[1.25em]">{icon}</span>
            )}
            <span>{children}</span>
        </button>
    );
};

export default Button;
