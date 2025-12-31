import React, { useState } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    icon?: string;
    error?: string;
    containerClassName?: string;
}

const Input: React.FC<InputProps> = ({
    label,
    icon,
    error,
    className = '',
    containerClassName = '',
    id,
    value,
    onFocus,
    onBlur,
    ...props
}) => {
    const [isFocused, setIsFocused] = useState(false);
    const hasValue = value !== '' && value !== undefined;
    const isActive = isFocused || hasValue;
    const inputId = id || `input-${label.replace(/\s+/g, '-').toLowerCase()}`;

    return (
        <div className={`relative ${containerClassName}`}>
            <div className={`
                relative flex items-center bg-gray-50 dark:bg-gray-800/50 border-2 rounded-xl transition-all duration-200
                ${error
                    ? 'border-error/50 focus-within:border-error focus-within:shadow-error/10'
                    : 'border-transparent focus-within:border-primary focus-within:shadow-lg focus-within:shadow-primary/10 hover:border-gray-200 dark:hover:border-gray-700'
                }
            `}>
                {icon && (
                    <span className={`
                        material-symbols-outlined px-3 text-[20px] transition-colors
                        ${error ? 'text-error' : isFocused ? 'text-primary' : 'text-gray-400'}
                    `}>
                        {icon}
                    </span>
                )}
                <div className="relative flex-1">
                    <input
                        id={inputId}
                        value={value}
                        onFocus={(e) => {
                            setIsFocused(true);
                            onFocus && onFocus(e);
                        }}
                        onBlur={(e) => {
                            setIsFocused(false);
                            onBlur && onBlur(e);
                        }}
                        className={`
                            w-full bg-transparent px-3 pt-5 pb-2 text-textPrimary dark:text-white outline-none placeholder-transparent
                            ${className}
                        `}
                        placeholder={label}
                        {...props}
                    />
                    <label
                        htmlFor={inputId}
                        className={`
                            absolute left-3 transition-all duration-200 pointer-events-none truncate max-w-full
                            ${isActive
                                ? 'top-1 text-[10px] font-bold uppercase tracking-wider'
                                : 'top-3.5 text-sm'
                            }
                            ${error
                                ? 'text-error'
                                : isActive ? 'text-primary' : 'text-gray-400'
                            }
                        `}
                    >
                        {label}
                    </label>
                </div>
            </div>
            {error && (
                <p className="mt-1 ml-1 text-xs font-medium text-error flex items-center gap-1 animate-fade-in">
                    <span className="material-symbols-outlined text-[12px]">error</span>
                    {error}
                </p>
            )}
        </div>
    );
};

export default Input;
