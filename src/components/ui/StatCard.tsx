
import React from 'react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  icon, 
  description,
  trend,
  className 
}) => {
  return (
    <div className={cn(
      "glass-card p-5 rounded-xl animated-card overflow-hidden relative",
      className
    )}>
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-finance-text-secondary">{title}</p>
          <h3 className="text-2xl font-bold text-finance-text-primary">{value}</h3>
          
          {trend && (
            <div className={cn(
              "flex items-center text-xs font-medium",
              trend.isPositive ? "text-finance-green" : "text-finance-red"
            )}>
              <span>{trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%</span>
              <span className="ml-1 text-finance-text-secondary">vs last period</span>
            </div>
          )}
          
          {description && (
            <p className="text-xs text-finance-text-secondary mt-1">{description}</p>
          )}
        </div>
        
        {icon && (
          <div className="p-2 rounded-full bg-opacity-10 bg-primary">
            {icon}
          </div>
        )}
      </div>
      
      <div className="absolute w-24 h-24 -bottom-6 -right-6 rounded-full bg-finance-blue opacity-5"></div>
    </div>
  );
};

export default StatCard;
