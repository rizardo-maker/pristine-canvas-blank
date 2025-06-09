
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart } from 'lucide-react';

const BalanceSheet = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Balance Sheet</h1>
        <p className="text-muted-foreground">
          View your financial position and balance sheet
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LineChart className="h-5 w-5" />
            Financial Balance Sheet
          </CardTitle>
          <CardDescription>
            Track assets, liabilities, and equity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Balance sheet feature coming soon...</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default BalanceSheet;
