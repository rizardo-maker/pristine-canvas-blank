
import React from 'react';
import { cn } from '@/lib/utils';

interface PageTitleProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  className?: string;
}

const PageTitle: React.FC<PageTitleProps> = ({ 
  title, 
  subtitle, 
  children,
  className 
}) => {
  return (
    <div className={cn("flex flex-col md:flex-row md:items-center justify-between mb-6", className)}>
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-finance-text-primary">{title}</h1>
        {subtitle && (
          <p className="text-sm text-finance-text-secondary">{subtitle}</p>
        )}
      </div>
      {children && (
        <div className="mt-4 md:mt-0 flex flex-wrap gap-2 justify-start md:justify-end">
          {children}
        </div>
      )}
    </div>
  );
};

export default PageTitle;
