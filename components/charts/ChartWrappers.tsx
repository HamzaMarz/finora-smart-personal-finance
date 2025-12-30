
import React from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend, LineChart, Line
} from 'recharts';
import { useAppStore } from '../../store/useAppStore';

const COLORS = [
  '#6366F1', // Indigo
  '#F43F5E', // Rose
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#3B82F6', // Blue
  '#8B5CF6', // Violet
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#F97316', // Orange
];

const formatCurrency = (value: number, currency: string, language: string) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    maximumFractionDigits: 0,
  }).format(value);
};

interface ChartProps {
  data: any[];
  height?: number;
}

export const FinoraAreaChart: React.FC<ChartProps & { dataKey: string }> = ({ data, dataKey, height = 300 }) => {
  const { theme, currency, language } = useAppStore();
  const isDark = theme === 'dark';

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={COLORS[0]} stopOpacity={0.3} />
            <stop offset="95%" stopColor={COLORS[0]} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} vertical={false} />
        <XAxis dataKey="name" stroke={isDark ? '#94a3b8' : '#64748b'} fontSize={12} tickLine={false} axisLine={false} />
        <YAxis stroke={isDark ? '#94a3b8' : '#64748b'} fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => formatCurrency(v, currency, language)} />
        <Tooltip
          contentStyle={{ backgroundColor: isDark ? '#1e293b' : '#ffffff', border: 'none', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
          formatter={(v: number) => [formatCurrency(v, currency, language), '']}
        />
        <Area type="monotone" dataKey={dataKey} stroke={COLORS[0]} strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" animationDuration={1500} />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export const FinoraBarChart: React.FC<ChartProps & { dataKeys: string[] }> = ({ data, dataKeys, height = 300 }) => {
  const { theme, currency, language } = useAppStore();
  const isDark = theme === 'dark';

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} vertical={false} />
        <XAxis dataKey="name" stroke={isDark ? '#94a3b8' : '#64748b'} fontSize={12} tickLine={false} axisLine={false} />
        <YAxis stroke={isDark ? '#94a3b8' : '#64748b'} fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => formatCurrency(v, currency, language)} />
        <Tooltip
          contentStyle={{ backgroundColor: isDark ? '#1e293b' : '#ffffff', border: 'none', borderRadius: '8px' }}
          formatter={(v: number) => [formatCurrency(v, currency, language), '']}
        />
        <Legend verticalAlign="top" height={36} />
        {dataKeys.map((key, i) => (
          <Bar key={key} dataKey={key} fill={COLORS[i % COLORS.length]} radius={[4, 4, 0, 0]} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
};

export const FinoraPieChart: React.FC<ChartProps & { nameKey: string; valueKey: string }> = ({ data, nameKey, valueKey, height = 300 }) => {
  const { theme, currency, language } = useAppStore();
  const isDark = theme === 'dark';

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey={valueKey} nameKey={nameKey}>
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{ backgroundColor: isDark ? '#1e293b' : '#ffffff', border: 'none', borderRadius: '8px' }}
          formatter={(v: number) => [formatCurrency(v, currency, language), '']}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
};

export const FinoraLineChart: React.FC<ChartProps & { dataKeys: string[] }> = ({ data, dataKeys = [], height = 300 }) => {
  const { theme, currency, language } = useAppStore();
  const isDark = theme === 'dark';

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} vertical={false} />
        <XAxis dataKey="name" stroke={isDark ? '#94a3b8' : '#64748b'} fontSize={12} tickLine={false} axisLine={false} />
        <YAxis stroke={isDark ? '#94a3b8' : '#64748b'} fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => formatCurrency(v, currency, language)} />
        <Tooltip
          contentStyle={{ backgroundColor: isDark ? '#1e293b' : '#ffffff', border: 'none', borderRadius: '8px' }}
          formatter={(v: number) => [formatCurrency(v, currency, language), '']}
        />
        <Legend verticalAlign="top" height={36} />
        {dataKeys && Array.isArray(dataKeys) && dataKeys.map((key, i) => (
          <Line
            key={key}
            type="monotone"
            dataKey={key}
            stroke={COLORS[i % COLORS.length]}
            strokeWidth={4}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
};
