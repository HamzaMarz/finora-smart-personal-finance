import React from 'react';
import Card from './Card';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
}

const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl'
};

export const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    title,
    children,
    footer,
    maxWidth = 'lg',
    className = ''
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
                onClick={onClose}
            />
            <Card
                className={`w-full ${maxWidthClasses[maxWidth]} z-10 animate-scale-up overflow-hidden max-h-[90vh] flex flex-col ${className}`}
                onClick={(e) => e?.stopPropagation()}
            >
                <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
                    <h3 className="text-xl font-bold text-textPrimary dark:text-white">{title}</h3>
                    <button
                        onClick={onClose}
                        className="size-8 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center text-textSecondary dark:text-gray-400 transition-colors"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>
                <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                    {children}
                </div>
                {footer && (
                    <div className="p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
                        {footer}
                    </div>
                )}
            </Card>
        </div>
    );
};

export default Modal;
