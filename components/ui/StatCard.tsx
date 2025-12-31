import React from 'react';
import Card from './Card';

interface StatCardProps {
    label: string;
    value: string;
    icon: string;
    color: string;
    bg: string;
    className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
    label,
    value,
    icon,
    color,
    bg,
    className = ''
}) => {
    return (
        <Card className={`p-6 transition-transform duration-200 hover:-translate-y-1 hover:shadow-lg dark:hover:shadow-none hover:border-primary/20 ${className}`}>
            <div className="flex items-center gap-4">
                <div className={`size-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${bg}`}>
                    <span className={`material-symbols-outlined text-[28px] ${color}`}>{icon}</span>
                </div>
                <div>
                    <p className="text-xs font-bold text-textSecondary dark:text-gray-400 uppercase tracking-wider mb-1">
                        {label}
                    </p>
                    <h3 className={`text-2xl font-bold ${color}`}>{value}</h3>
                </div>
            </div>
        </Card>
    );
};

export default StatCard;
